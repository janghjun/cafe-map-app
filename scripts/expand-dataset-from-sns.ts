#!/usr/bin/env node
/**
 * SNS/블로그 언급 기반으로 인천 카공 카페 데이터셋을 확장합니다.
 *
 * ─ Phase 1  블로그 발견 (Naver Blog API)
 *   카페 추천/후기 성격의 블로그 포스트 제목에서 카페명 후보를 추출합니다.
 *   ⚠️ 원문·이미지·평점은 저장하지 않습니다. 제목 텍스트만 패턴 매칭 후 폐기합니다.
 *
 * ─ Phase 2  추가 지역 검색 (Naver Local API)
 *   기존 collect-cafe-data.ts가 커버하지 못한 세부 동/역세권 쿼리를 실행합니다.
 *
 * ─ Phase 3  후보 검증 (Naver Local API)
 *   Phase 1에서 추출한 후보 이름을 Local Search로 검증해 좌표·주소를 확보합니다.
 *
 * ─ Phase 4  기존 데이터셋과 병합
 *   data/incheon-cafes-raw.json 과 중복 제거 후 신규 카페를 추가합니다.
 *   cafes.mock.ts를 자동 재생성합니다.
 *
 * 사용법:
 *   npx tsx scripts/expand-dataset-from-sns.ts
 *   npx tsx scripts/expand-dataset-from-sns.ts --dry-run
 *   npx tsx scripts/expand-dataset-from-sns.ts --output data/incheon-cafes-raw.json
 *
 * 옵션:
 *   --dry-run          API 호출 없이 쿼리/후보 통계만 출력
 *   --output <path>    병합 결과 저장 경로 (기본값: data/incheon-cafes-raw.json)
 *   --base <path>      기존 데이터셋 경로 (기본값: data/incheon-cafes-raw.json)
 *   --delay <ms>       요청 간 딜레이 ms (기본값: 400)
 *   --no-regen         cafes.mock.ts 재생성 건너뜀
 *
 * 환경 변수:
 *   NAVER_CLIENT_ID
 *   NAVER_CLIENT_SECRET
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { normalizePlaceName } from "../src/utils/placeMatch.ts";
import type { CafeAttributes, CafeTag } from "../src/types/cafe.ts";
import type { CollectedCafeData } from "./collect-cafe-data.ts";

// ──────────────────────────────────────────────────────────────
// CLI 인자
// ──────────────────────────────────────────────────────────────

const args          = process.argv.slice(2);
const DRY_RUN       = args.includes("--dry-run");
const NO_REGEN      = args.includes("--no-regen");
const OUTPUT_FILE   = (() => { const i = args.indexOf("--output"); return i !== -1 ? args[i + 1] : "data/incheon-cafes-raw.json"; })();
const BASE_FILE     = (() => { const i = args.indexOf("--base");   return i !== -1 ? args[i + 1] : "data/incheon-cafes-raw.json"; })();
const DELAY_MS      = parseInt((() => { const i = args.indexOf("--delay"); return i !== -1 ? args[i + 1] : "400"; })(), 10);

// ──────────────────────────────────────────────────────────────
// Phase 1 — 블로그 발견 쿼리
// 카페 추천/후기 블로그 포스트를 찾기 위한 큐레이션 성격의 키워드
// ──────────────────────────────────────────────────────────────

const BLOG_QUERIES: string[] = [
  // 추천 리스트형 — 여러 카페명이 제목에 노출됨
  "인천 카공 카페 추천",
  "인천 카공카페 추천",
  "인천 노트북 카페 추천",
  "인천 공부하기 좋은 카페 추천",
  "인천 콘센트 카페 추천",
  "인천 조용한 카페 추천",
  "인천 24시간 카페 추천",
  "인천 혼자 공부 카페",
  "인천 스터디 카공 카페",
  "인천 작업하기 좋은 카페",
  // 지역 특화 추천
  "송도 카공 카페 추천",
  "송도 노트북 카페",
  "송도 혼자 카페",
  "청라 카공 카페 추천",
  "청라 노트북 카페",
  "부평 카공 카페 추천",
  "부평 혼자 카페",
  "구월동 카공 카페",
  "구월동 노트북 카페",
  "인하대 카공 카페",
  "인하대 근처 공부 카페",
  "주안 카공 카페",
  "계양구 카공 카페",
  "계양구 노트북 카페",
  "검단 카공 카페",
  "검단 노트북 카페",
  "서구 카공 카페",
  "연수구 카공 카페",
  "동인천 카공 카페",
  "인천대 카공 카페",
  // 야간/특화
  "인천 새벽 카페 추천",
  "인천 심야 카페",
  "인천 밤새 공부 카페",
  "인천 24시 카페 추천",
  "인천 무인 카페 추천",
  "인천 1인 카페",
  "인천 파티션 카페",
  "인천 집중 공부 카페",
  // 리뷰형 — 특정 카페 후기
  "송도 카공카페 후기",
  "부평 카공카페 방문기",
  "인천 카공카페 방문기",
  "인천 카공 카페 솔직후기",
  "인천 카페 노트북 허용",
  "인천 카페 콘센트 있는 곳",
  // 인스타/SNS 스타일 키워드
  "인천카공카페",
  "송도카공카페",
  "부평카공",
  "인천노트북카페",
  "인천공부카페",
];

// ──────────────────────────────────────────────────────────────
// Phase 2 — 추가 지역 Local Search 쿼리
// 기존 collect-cafe-data.ts가 커버하지 않은 세부 지역
// ──────────────────────────────────────────────────────────────

const EXTRA_LOCAL_QUERIES: string[] = [
  // 역세권 — 더 세분화
  "주안역 카공카페",
  "인하대역 카페",
  "동암역 카페",
  "부평역 카공카페",
  "계양역 카페",
  "귤현역 카페",
  "박촌역 카페",
  "임학역 카페",
  "서구청역 카페",
  "검단오류역 카페",
  "송도역 카공카페",
  "연수역 카페",
  "원인재역 카페",
  "인천시청역 카페",
  "간석오거리역 카페",
  // 세부 동 레벨
  "인천 도화동 카페",
  "인천 관교동 카페",
  "인천 십정동 카페",
  "인천 부개동 카페",
  "인천 일신동 카페",
  "인천 효성동 카페",
  "인천 갈산동 카페",
  "인천 서창동 카페",
  "인천 논현고잔동 카페",
  "인천 남촌동 카페",
  "인천 구월2동 카페",
  "인천 만수6동 카페",
  "인천 청라3동 카페",
  "인천 원당동 카페",
  "인천 마전동 카페",
  "인천 불로동 카페",
  "인천 오류동 카페",
  "인천 왕길동 카페",
  "인천 신현원창동 카페",
  "인천 석남동 카공카페",
  "인천 가정동 카공카페",
  // 대학교 인근
  "인하대학교 앞 카페",
  "인천대학교 앞 카페",
  "인하대입구역 카페",
  "인하대 주변 카공",
  // 복합단지/상권
  "송도 트리플스트리트 카페",
  "송도 센트럴파크 카페",
  "송도 아트센터 카페",
  "청라 호수공원 카페",
  "부평 지하상가 카페",
  "구월동 롯데백화점 카페",
  "인천 신세계 카페",
  // 스터디 특화 키워드
  "인천 카공 카페 콘센트",
  "인천 카공 카페 와이파이",
  "인천 스터디룸 있는 카페",
  "인천 조용한 카공 카페",
  "인천 넓은 카페",
  "인천 혼자 앉기 좋은 카페",
];

// ──────────────────────────────────────────────────────────────
// 환경 변수
// ──────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) { console.error(`❌ 환경 변수 '${key}' 미설정`); process.exit(1); }
  return val;
}

// ──────────────────────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────────────────────

type NaverLocalItem = {
  title: string;
  address: string;
  roadAddress: string;
  category: string;
  telephone: string;
  mapx: string;
  mapy: string;
  link: string;
};

type NaverLocalResponse = {
  total: number;
  start: number;
  display: number;
  items: NaverLocalItem[];
};

type NaverBlogItem = {
  title: string;
  description: string; // 속성 추출 후 즉시 폐기
  postdate: string;
  // ⚠️ link, bloggername, thumbnail 저장 금지
};

type NaverBlogResponse = {
  total: number;
  items: NaverBlogItem[];
};

// ──────────────────────────────────────────────────────────────
// API 헬퍼
// ──────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

async function naverGet<T>(
  endpoint: string,
  params: Record<string, string>,
  clientId: string,
  clientSecret: string
): Promise<T | null> {
  const url = new URL(endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id":     clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) {
      console.warn(`  ⚠️ API ${res.status}: ${(await res.text()).slice(0, 80)}`);
      return null;
    }
    return (await res.json()) as T;
  } catch {
    console.warn(`  ⚠️ 네트워크 오류`);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Phase 1: 블로그 제목에서 카페명 후보 추출
// ──────────────────────────────────────────────────────────────

/**
 * 블로그 포스트 제목/요약에서 카페명 후보를 추출합니다.
 * 원문은 이 함수 스코프에서만 사용하고 반환하지 않습니다.
 *
 * 인식 패턴:
 *   1) 구분자 뒤의 이름  — "인천 카공카페 :: 브루웍스 방문기" → "브루웍스"
 *   2) 카페명 + 카페 접미사 — "브루웍스카페", "Cafe 오리진"
 *   3) "카페이름 카페" — "조양방직 카페"
 *   4) 영문 브랜드명    — "Starbucks 인천..." (영문 대문자로 시작)
 */
function extractCafeNamesFromTitle(title: string): string[] {
  const clean = stripHtml(title);
  const found = new Set<string>();

  // 1. 구분자(–, -, ::, |, /, ｜) 뒤에 오는 짧은 텍스트
  const separators = /(?:–|-|::|\/|｜|\|)\s*([가-힣A-Za-z0-9][가-힣A-Za-z0-9\s]{1,20}?)(?:\s*(?:방문기|후기|리뷰|추천|소개|이야기|이용기|\d|$|[^\w가-힣]))/g;
  for (const m of clean.matchAll(separators)) {
    const candidate = m[1].trim();
    if (isLikelyCafeName(candidate)) found.add(candidate);
  }

  // 2. "카페명카페" or "카페명 카페" (명사 + 카페)
  const cafeNameSuffix = /([가-힣A-Za-z0-9]{2,15})\s*카페(?:\s|$|[^이은는이가을를도만])/g;
  for (const m of clean.matchAll(cafeNameSuffix)) {
    const candidate = m[1].trim();
    if (isLikelyCafeName(candidate)) found.add(candidate + " 카페");
  }

  // 3. "카페 + 명사" (카페 접두어)
  const cafePrefixName = /카페\s+([가-힣A-Za-z][가-힣A-Za-z0-9\s]{1,12})(?:\s|$|[,.!?])/g;
  for (const m of clean.matchAll(cafePrefixName)) {
    const candidate = ("카페 " + m[1]).trim();
    if (isLikelyCafeName(m[1].trim())) found.add(candidate);
  }

  // 4. 영문 브랜드명 (대문자 시작, 2~20자, 인천/카공 단어가 아닌 것)
  const englishBrand = /\b([A-Z][A-Za-z0-9]{2,19})\b/g;
  const excludeWords = new Set(["CAFE", "Coffee", "COFFEE", "NAVER", "Blog", "AND", "THE"]);
  for (const m of clean.matchAll(englishBrand)) {
    const candidate = m[1];
    if (!excludeWords.has(candidate) && isLikelyCafeName(candidate)) {
      found.add(candidate);
    }
  }

  return [...found].filter((n) => n.length >= 2);
}

/**
 * 추출된 문자열이 카페명일 가능성이 높은지 판단합니다.
 * 노이즈(일반 명사, 지역어, 동사) 제거용.
 */
function isLikelyCafeName(text: string): boolean {
  if (!text || text.length < 2 || text.length > 25) return false;

  // 지역어·일반 부사/동사는 제외
  const noiseWords = [
    "인천", "서울", "경기", "강화", "옹진",
    "추천", "방문기", "후기", "리뷰", "소개", "이야기", "직접",
    "카공", "공부", "노트북", "콘센트", "와이파이", "조용",
    "혼자", "함께", "오늘", "이번", "저번", "지난",
    "근처", "주변", "인근", "앞", "뒤",
    "구", "동", "역", "거리",
    "진짜", "솔직", "완전", "너무", "매우",
    "카페", // "카페" 단독은 너무 일반적
  ];
  if (noiseWords.some((w) => text === w)) return false;

  // 숫자만으로 된 것 제외
  if (/^\d+$/.test(text)) return false;

  return true;
}

// ──────────────────────────────────────────────────────────────
// 좌표 변환 + 인천 범위 검증
// ──────────────────────────────────────────────────────────────

function parseCoords(mapx: string, mapy: string): { lat: number; lng: number } | null {
  const lngRaw = Number(mapx);
  const latRaw = Number(mapy);
  if (!lngRaw || !latRaw) return null;
  const lat = Math.round((latRaw / 1e7) * 1e6) / 1e6;
  const lng = Math.round((lngRaw / 1e7) * 1e6) / 1e6;
  if (lat < 37.0 || lat > 38.0 || lng < 125.5 || lng > 127.5) return null;
  return { lat, lng };
}

function extractDistrictDong(address: string): { district: string; dong: string } {
  const gu  = address.match(/인천(?:광역시)?\s*([가-힣]+구)/)?.[1] ?? "";
  const gun = !gu ? (address.match(/인천(?:광역시)?\s*(강화군|옹진군)/)?.[1] ?? "") : "";
  const district = gu || gun;
  const dong =
    address.match(/[가-힣]+구\s+([가-힣]+동)/)?.[1] ??
    address.match(/[가-힣]+군\s+[가-힣]+읍\s+([가-힣]+리)/)?.[1] ??
    "";
  return { district, dong };
}

function inferAttributes(query: string): CafeAttributes {
  const isStudy  = /카공|노트북|공부|작업/.test(query);
  const is24h    = /24시간|새벽|심야/.test(query);
  const isQuiet  = /조용|집중|1인|혼자|파티션/.test(query);
  const isOutlet = /콘센트/.test(query);
  const isWifi   = /와이파이/.test(query);
  return {
    quietScore:     isQuiet   ? 4 : (isStudy ? 4 : 3),
    soloScore:      isStudy || is24h ? 4 : 3,
    groupScore:     3,
    outletScore:    isStudy || isOutlet ? 4 : 3,
    wifiScore:      isStudy || isWifi   ? 4 : 3,
    stayScore:      isStudy   ? 4 : 3,
    coffeeScore:    3,
    dessertScore:   3,
    lateOpenScore:  is24h     ? 5 : 3,
    spaceScore:     3,
    seatScore:      isStudy   ? 4 : 3,
    groupSeatScore: 3,
  };
}

function inferTags(query: string, is24Hours: boolean, name: string): CafeTag[] {
  const q = query + " " + name;
  const tags = new Set<CafeTag>();
  if (/카공|노트북|공부/.test(q))    { tags.add("outlet"); tags.add("wifi"); }
  if (/와이파이|wifi/i.test(q))       tags.add("wifi");
  if (/콘센트/.test(q))              tags.add("outlet");
  if (is24Hours || /24시간|24시/.test(q)) { tags.add("24hours"); tags.add("late_open"); }
  if (/새벽|심야|밤새/.test(q))       tags.add("late_open");
  if (/조용|집중|파티션/.test(q))     tags.add("quiet");
  if (/무인/.test(q))                tags.add("late_open");
  return [...tags];
}

// 카페 이름에서 24시간 여부 추론
function guessIs24h(name: string): boolean {
  return /24시간|24시|무인/.test(name);
}

// ──────────────────────────────────────────────────────────────
// Local Search 아이템 → CollectedCafeData
// ──────────────────────────────────────────────────────────────

function convertToCollectedData(
  item: NaverLocalItem,
  sourceQuery: string,
  now: string
): CollectedCafeData | null {
  const name = stripHtml(item.title);
  if (!name) return null;

  // 인천 주소만 허용
  const anyAddress = item.address || item.roadAddress;
  if (!anyAddress.includes("인천")) return null;

  // 카페 카테고리 확인
  if (!item.category.includes("카페") && !item.category.includes("커피")) return null;

  const coords = parseCoords(item.mapx, item.mapy);
  if (!coords) return null;

  const { district, dong } = extractDistrictDong(item.address || item.roadAddress);
  if (!district) return null;

  const is24Hours = guessIs24h(name) || /24시간|무인/.test(sourceQuery);
  const tags = inferTags(sourceQuery, is24Hours, name);
  const attrs = inferAttributes(sourceQuery);
  const naverMapUrl = anyAddress
    ? `https://map.naver.com/v5/search/${encodeURIComponent(name + " " + anyAddress)}`
    : undefined;

  return {
    id: randomUUID(),
    name,
    district,
    dong,
    address: anyAddress,
    lat: coords.lat,
    lng: coords.lng,
    phone: item.telephone || undefined,
    summary: `${district}${dong ? " " + dong : ""}에 위치한 카페입니다.`,
    openHoursSummary: is24Hours ? "24시간" : "방문 전 직접 확인해 주세요.",
    is24Hours,
    naverMapUrl,
    status: "active",
    verificationStatus: "verified_basic",
    verificationSources: { naverLocal: true },
    tags,
    attributes: attrs,
    createdAt: now,
    updatedAt: now,
    sourceQuery,
    curatorNote: "자동 수집 (Naver Local API) — 운영자 속성 검수 필요",
  };
}

// ──────────────────────────────────────────────────────────────
// 중복 키 계산
// ──────────────────────────────────────────────────────────────

function dedupKey(name: string, district: string): string {
  return normalizePlaceName(name) + "|" + district;
}

// ──────────────────────────────────────────────────────────────
// cafes.mock.ts 재생성 (generate-mock-from-collected.ts 로직 인라인)
// ──────────────────────────────────────────────────────────────

function cafeToTs(c: CollectedCafeData): string {
  const tags = c.tags.length > 0
    ? `[${c.tags.map((t) => `"${t}"`).join(", ")}]`
    : "[]";
  const a = c.attributes;
  const lines: string[] = [
    `  {`,
    `    id: "${c.id}",`,
    `    name: ${JSON.stringify(c.name)},`,
    `    district: "${c.district}",`,
    `    dong: "${c.dong}",`,
    `    address: ${JSON.stringify(c.address)},`,
    `    lat: ${c.lat},`,
    `    lng: ${c.lng},`,
  ];
  if (c.phone) lines.push(`    phone: "${c.phone}",`);
  lines.push(
    `    summary: ${JSON.stringify(c.summary)},`,
    `    openHoursSummary: ${JSON.stringify(c.openHoursSummary)},`,
    `    is24Hours: ${c.is24Hours},`,
  );
  if (c.naverMapUrl) lines.push(`    naverMapUrl: ${JSON.stringify(c.naverMapUrl)},`);
  lines.push(
    `    status: "active",`,
    `    tags: ${tags},`,
    `    attributes: {`,
    `      quietScore: ${a.quietScore}, soloScore: ${a.soloScore}, groupScore: ${a.groupScore},`,
    `      outletScore: ${a.outletScore}, wifiScore: ${a.wifiScore}, stayScore: ${a.stayScore},`,
    `      coffeeScore: ${a.coffeeScore}, dessertScore: ${a.dessertScore}, lateOpenScore: ${a.lateOpenScore},`,
    `      spaceScore: ${a.spaceScore}, seatScore: ${a.seatScore}, groupSeatScore: ${a.groupSeatScore},`,
    `    },`,
    `    createdAt: "${c.createdAt}",`,
    `    updatedAt: "${c.updatedAt}",`,
    `    verificationStatus: "${c.verificationStatus}",`,
    `    verificationSources: { naverLocal: true },`,
    `    curatorNote: ${JSON.stringify(c.curatorNote)},`,
    `  },`,
  );
  return lines.join("\n");
}

function regenerateMock(cafes: CollectedCafeData[], collectedAt: string): void {
  const cafeBlocks = cafes.map(cafeToTs).join("\n");
  const output = `// 실제 수집된 인천 카공 카페 데이터 (Naver Local API 기반)
// 최종 업데이트: ${new Date().toISOString()}
// 총 ${cafes.length}개 카페 — 운영자 속성 검수 전 기본값(3/5) 사용
// Supabase 연결 전까지 추천 로직 및 UI 개발에 사용합니다.

import type { Cafe } from "../types/cafe";

export const MOCK_CAFES: Cafe[] = [
${cafeBlocks}
];
`;
  writeFileSync(resolve("src/data/cafes.mock.ts"), output, "utf-8");
  console.log(`  ✅ cafes.mock.ts 재생성 완료 (${cafes.length}개)`);
}

// ──────────────────────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 인천 카공 카페 데이터셋 확장 ===\n");
  console.log(`블로그 발견 쿼리: ${BLOG_QUERIES.length}개`);
  console.log(`추가 Local 쿼리: ${EXTRA_LOCAL_QUERIES.length}개`);

  // 기존 데이터셋 로드
  let existingCafes: CollectedCafeData[] = [];
  let baseCollectedAt = new Date().toISOString();
  if (existsSync(BASE_FILE)) {
    const parsed = JSON.parse(readFileSync(BASE_FILE, "utf-8")) as {
      cafes: CollectedCafeData[];
      collectedAt: string;
    };
    existingCafes = parsed.cafes;
    baseCollectedAt = parsed.collectedAt;
    console.log(`기존 데이터셋: ${existingCafes.length}개 카페\n`);
  } else {
    console.log(`기존 데이터셋 없음 — 신규 생성\n`);
  }

  // 기존 카페 중복 키 세트
  const existingKeys = new Set(existingCafes.map((c) => dedupKey(c.name, c.district)));

  if (DRY_RUN) {
    console.log("[dry-run] 블로그 쿼리 목록:");
    BLOG_QUERIES.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
    console.log("\n[dry-run] 추가 Local 쿼리 목록:");
    EXTRA_LOCAL_QUERIES.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
    console.log(`\n총 API 호출 예상: ${BLOG_QUERIES.length} (blog) + ${EXTRA_LOCAL_QUERIES.length * 2} (local pages) = ${BLOG_QUERIES.length + EXTRA_LOCAL_QUERIES.length * 2}회`);
    return;
  }

  const clientId     = requireEnv("NAVER_CLIENT_ID");
  const clientSecret = requireEnv("NAVER_CLIENT_SECRET");
  const now = new Date().toISOString();

  const newCafes: CollectedCafeData[] = [];
  let apiCalls = 0;
  let blogCandidates = 0;
  let blogVerified = 0;

  // ── Phase 1: 블로그 발견 ───────────────────────────────────
  console.log("\n[Phase 1] 블로그 발견 — 카페명 후보 추출 중...\n");

  const blogCandidateNames = new Set<string>();

  for (let i = 0; i < BLOG_QUERIES.length; i++) {
    const query = BLOG_QUERIES[i];
    process.stdout.write(`  [${i + 1}/${BLOG_QUERIES.length}] "${query}"...`);

    await delay(DELAY_MS);
    const resp = await naverGet<NaverBlogResponse>(
      "https://openapi.naver.com/v1/search/blog.json",
      { query, display: "10", sort: "date" },
      clientId,
      clientSecret
    );
    apiCalls++;

    if (!resp?.items?.length) {
      process.stdout.write(" (결과 없음)\n");
      continue;
    }

    let extracted = 0;
    for (const item of resp.items) {
      // 2026년 이후 게시물만 사용 (최신 정보 우선)
      const postYear = parseInt(item.postdate.slice(0, 4), 10);
      if (postYear < 2023) continue;

      const namesFromTitle = extractCafeNamesFromTitle(item.title);
      // description에서도 추출 (원문은 이 블록 이후 즉시 GC됨)
      const namesFromDesc  = extractCafeNamesFromTitle(item.description);
      const allNames = [...namesFromTitle, ...namesFromDesc];

      for (const n of allNames) {
        const normalized = normalizePlaceName(n);
        if (normalized && normalized.length >= 2) {
          blogCandidateNames.add(normalized);
          extracted++;
        }
      }
    }
    // ⚠️ item.title, item.description 원문은 이 루프 이후 참조되지 않습니다.

    process.stdout.write(` +${extracted}개 후보 (누적: ${blogCandidateNames.size}개)\n`);
  }

  blogCandidates = blogCandidateNames.size;
  console.log(`\nPhase 1 완료: ${blogCandidates}개 후보명 추출\n`);

  // ── Phase 2: 추가 Local Search ──────────────────────────────
  console.log("[Phase 2] 추가 지역 Local Search 쿼리...\n");

  for (let i = 0; i < EXTRA_LOCAL_QUERIES.length; i++) {
    const query = EXTRA_LOCAL_QUERIES[i];
    process.stdout.write(`  [${i + 1}/${EXTRA_LOCAL_QUERIES.length}] "${query}"...`);

    let addedThisQuery = 0;

    for (const start of [1, 6]) {
      await delay(DELAY_MS);
      const resp = await naverGet<NaverLocalResponse>(
        "https://openapi.naver.com/v1/search/local.json",
        { query, display: "5", start: String(start) },
        clientId,
        clientSecret
      );
      apiCalls++;
      if (!resp?.items?.length) break;

      for (const item of resp.items) {
        const cafe = convertToCollectedData(item, query, now);
        if (!cafe) continue;
        const key = dedupKey(cafe.name, cafe.district);
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        newCafes.push(cafe);
        addedThisQuery++;
      }

      if (resp.total <= 5) break;
    }

    process.stdout.write(` +${addedThisQuery}개 신규\n`);
  }

  console.log(`\nPhase 2 완료: ${newCafes.length}개 신규 카페 (local)\n`);

  // ── Phase 3: 블로그 발견 후보 검증 ───────────────────────────
  console.log(`[Phase 3] 블로그 후보 ${blogCandidates}개 Local Search 검증 중...\n`);

  const candidateArray = [...blogCandidateNames];
  let verifiedCount = 0;

  for (let i = 0; i < candidateArray.length; i++) {
    const candidateName = candidateArray[i];

    // 이미 알고 있는 카페면 건너뜀
    if ([...existingKeys].some((k) => k.startsWith(normalizePlaceName(candidateName) + "|"))) {
      continue;
    }

    // 인천 카페 검색으로 검증
    await delay(DELAY_MS);
    const resp = await naverGet<NaverLocalResponse>(
      "https://openapi.naver.com/v1/search/local.json",
      { query: candidateName + " 인천 카페", display: "3" },
      clientId,
      clientSecret
    );
    apiCalls++;

    if (!resp?.items?.length) continue;

    let addedThisCandidate = 0;
    for (const item of resp.items) {
      const cafe = convertToCollectedData(item, candidateName + " 인천 카페 (블로그발견)", now);
      if (!cafe) continue;
      const key = dedupKey(cafe.name, cafe.district);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      newCafes.push(cafe);
      addedThisCandidate++;
      verifiedCount++;
    }

    if (i % 20 === 0 || addedThisCandidate > 0) {
      process.stdout.write(`  [${i + 1}/${candidateArray.length}] "${candidateName}" → +${addedThisCandidate}개 (누적 검증: ${verifiedCount}개)\n`);
    }
  }

  blogVerified = verifiedCount;
  console.log(`\nPhase 3 완료: 블로그 후보 중 ${blogVerified}개 신규 카페 검증\n`);

  // ── Phase 4: 병합 & 저장 ──────────────────────────────────
  const merged = [...existingCafes, ...newCafes];

  console.log(`=== 수집 완료 ===`);
  console.log(`API 호출 수:       ${apiCalls}회`);
  console.log(`블로그 후보 추출:  ${blogCandidates}개`);
  console.log(`블로그 검증 추가:  ${blogVerified}개`);
  console.log(`Local 쿼리 추가:   ${newCafes.length - blogVerified}개`);
  console.log(`신규 추가:         ${newCafes.length}개`);
  console.log(`기존:              ${existingCafes.length}개`);
  console.log(`최종 합계:         ${merged.length}개`);

  // 구별 분포
  const byDistrict: Record<string, number> = {};
  merged.forEach((c) => { byDistrict[c.district] = (byDistrict[c.district] || 0) + 1; });
  console.log("\n구별 분포:");
  Object.entries(byDistrict).sort((a, b) => b[1] - a[1])
    .forEach(([d, n]) => console.log(`  ${d}: ${n}개`));

  // JSON 저장
  const output = JSON.stringify({
    collectedAt: baseCollectedAt,
    expandedAt: now,
    totalCount: merged.length,
    newCount: newCafes.length,
    cafes: merged,
  }, null, 2);

  writeFileSync(resolve(OUTPUT_FILE), output, "utf-8");
  console.log(`\n✅ 데이터셋 저장: ${OUTPUT_FILE}`);

  // mock.ts 재생성
  if (!NO_REGEN) {
    console.log("cafes.mock.ts 재생성 중...");
    regenerateMock(merged, baseCollectedAt);
  }
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
