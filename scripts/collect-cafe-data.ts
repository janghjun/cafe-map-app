#!/usr/bin/env node
/**
 * 네이버 지역 검색 API로 인천 전 구/동의 카페 데이터를 직접 수집합니다.
 *
 * 기존 collect-naver-candidates.ts가 "블로그·카페글 기반 후보 발굴"이라면,
 * 이 스크립트는 카페 엔티티를 지역 단위로 직접 조회합니다.
 * 좌표(lat/lng)와 네이버 지도 URL까지 확보해 cafes 테이블에 바로 적재할 수 있습니다.
 *
 * 사용법:
 *   npx tsx scripts/collect-cafe-data.ts --output data/incheon-cafes.json
 *   npx tsx scripts/collect-cafe-data.ts --dry-run
 *
 * 옵션:
 *   --output <path>      수집 결과 JSON 저장 경로 (기본값: stdout)
 *   --dry-run            API 호출 없이 쿼리 목록만 출력
 *   --max-pages <n>      쿼리당 최대 페이지 수, 1~4 (기본값: 4, 최대 20건/쿼리)
 *   --delay <ms>         요청 간 딜레이 ms (기본값: 400)
 *
 * 환경 변수:
 *   NAVER_CLIENT_ID
 *   NAVER_CLIENT_SECRET
 *
 * ⚠️ 서버 사이드 전용
 * ⚠️ API 응답의 description(리뷰 발췌)은 저장하지 않습니다.
 * ⚠️ mapx/mapy는 Naver Local API의 WGS84×10^7 좌표입니다.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { normalizePlaceName } from "../src/utils/placeMatch.ts";
import type { CafeAttributes, CafeTag } from "../src/types/cafe.ts";

// ──────────────────────────────────────────────────────────────
// CLI 인자 파싱
// ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");
const OUTPUT_FILE = (() => { const i = args.indexOf("--output"); return i !== -1 ? args[i + 1] : null; })();
const MAX_PAGES   = Math.min(Math.max(parseInt((() => { const i = args.indexOf("--max-pages"); return i !== -1 ? args[i + 1] : "4"; })(), 10), 1), 4);
const DELAY_MS    = parseInt((() => { const i = args.indexOf("--delay"); return i !== -1 ? args[i + 1] : "400"; })(), 10);

// ──────────────────────────────────────────────────────────────
// 수집 쿼리 목록
// ──────────────────────────────────────────────────────────────

const LOCATION_QUERIES: string[] = [
  // 중구 / 동구
  "인천 중구 카페",
  "동인천 카페",
  "신포동 카페",
  "인천 동구 카페",
  "인천 화수동 카페",
  // 미추홀구 (인하대, 주안)
  "인천 미추홀구 카페",
  "인하대 카페",
  "주안역 카페",
  "인천 용현동 카페",
  "인천 학익동 카페",
  "인천 숭의동 카페",
  // 연수구 / 송도
  "인천 연수구 카페",
  "송도 카페",
  "인천 연수동 카페",
  "인천 청학동 카페",
  "인천 옥련동 카페",
  "인천 동춘동 카페",
  // 남동구
  "인천 남동구 카페",
  "인천 구월동 카페",
  "인천 간석동 카페",
  "인천 논현동 카페",
  "인천 만수동 카페",
  "인천 서창동 카페",
  // 부평구
  "인천 부평구 카페",
  "부평역 카페",
  "인천 삼산동 카페",
  "인천 산곡동 카페",
  "인천 부개동 카페",
  "인천 청천동 카페",
  // 계양구
  "인천 계양구 카페",
  "인천 계산동 카페",
  "인천 작전동 카페",
  "인천 귤현동 카페",
  // 서구
  "인천 서구 카페",
  "청라 카페",
  "인천 검단 카페",
  "인천 가정동 카페",
  "인천 석남동 카페",
  "인천 신현동 카페",
  // 강화
  "강화 카페",
  "강화도 카페",
];

const STUDY_QUERIES: string[] = [
  "인천 카공카페",
  "인천 노트북카페",
  "인천 공부카페",
  "인천 24시간 카페",
  "인천 새벽 카페",
  "인천 콘센트 카페",
  "인천 와이파이 카페",
  "송도 카공카페",
  "청라 카공카페",
  "구월동 카공카페",
  "부평 카공카페",
  "인하대 카공카페",
  "인천대 카공카페",
  "주안 카공카페",
];

const ALL_QUERIES = [...LOCATION_QUERIES, ...STUDY_QUERIES];

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
  // ⚠️ description(리뷰 발췌)은 타입에 포함하지 않습니다.
};

type NaverLocalResponse = {
  total: number;
  start: number;
  display: number;
  items: NaverLocalItem[];
};

export type CollectedCafeData = {
  id: string;
  name: string;
  district: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  summary: string;
  openHoursSummary: string;
  is24Hours: boolean;
  naverMapUrl?: string;
  status: "active";
  verificationStatus: "verified_basic";
  verificationSources: { naverLocal: true };
  tags: CafeTag[];
  attributes: CafeAttributes;
  createdAt: string;
  updatedAt: string;
  sourceQuery: string;
  curatorNote: string;
};

// ──────────────────────────────────────────────────────────────
// 환경 변수
// ──────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) { console.error(`❌ 환경 변수 '${key}' 미설정`); process.exit(1); }
  return val;
}

// ──────────────────────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

/** 인천 주소에서 구/동을 추출합니다 */
function extractDistrictDong(address: string): { district: string; dong: string } {
  // 도로명: "인천광역시 연수구 송도과학로 32" → 구: 연수구, 동: ""
  // 지번:   "인천광역시 연수구 송도동 100" → 구: 연수구, 동: 송도동
  const gu = address.match(/인천(?:광역시)?\s*([가-힣]+구)/)?.[1] ?? "";
  const gun = !gu ? (address.match(/인천(?:광역시)?\s*(강화군|옹진군)/)?.[1] ?? "") : "";
  const district = gu || gun;

  const dong =
    address.match(/[가-힣]+구\s+([가-힣]+동)/)?.[1] ??
    address.match(/[가-힣]+군\s+[가-힣]+읍\s+([가-힣]+리)/)?.[1] ??
    "";

  return { district, dong };
}

/**
 * Naver Local API의 mapx/mapy(WGS84 × 10^7)를 위도/경도로 변환합니다.
 * 인천 유효 범위(lat: 37.0~38.0, lng: 125.5~127.5)를 벗어나면 null을 반환합니다.
 */
function parseCoords(mapx: string, mapy: string): { lat: number; lng: number } | null {
  const lngRaw = Number(mapx);
  const latRaw = Number(mapy);
  if (!lngRaw || !latRaw) return null;

  const lat = Math.round((latRaw / 1e7) * 1e6) / 1e6;
  const lng = Math.round((lngRaw / 1e7) * 1e6) / 1e6;

  if (lat < 37.0 || lat > 38.0 || lng < 125.5 || lng > 127.5) return null;
  return { lat, lng };
}

/**
 * 수집 쿼리와 카테고리로 기본 CafeAttributes를 추론합니다.
 * 모든 값은 운영자 검수 전 기본값으로 부정확할 수 있습니다.
 */
function inferAttributes(query: string): CafeAttributes {
  const isStudy    = /카공|노트북|공부|작업/.test(query);
  const is24h      = /24시간|새벽/.test(query);
  const isQuiet    = /조용/.test(query);
  const isOutlet   = /콘센트/.test(query);
  const isWifi     = /와이파이|wifi/.test(query);

  return {
    quietScore:     isQuiet   ? 4 : 3,
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

function inferTags(query: string, is24Hours: boolean): CafeTag[] {
  const tags = new Set<CafeTag>();
  if (/카공|노트북|공부/.test(query))   { tags.add("outlet"); tags.add("wifi"); }
  if (/와이파이|wifi/.test(query))       tags.add("wifi");
  if (/콘센트/.test(query))              tags.add("outlet");
  if (is24Hours || /24시간/.test(query)) { tags.add("24hours"); tags.add("late_open"); }
  if (/새벽/.test(query))                tags.add("late_open");
  if (/조용/.test(query))                tags.add("quiet");
  return [...tags];
}

// ──────────────────────────────────────────────────────────────
// Naver API 호출
// ──────────────────────────────────────────────────────────────

async function searchNaverLocal(
  query: string,
  start: number,
  clientId: string,
  clientSecret: string
): Promise<NaverLocalResponse | null> {
  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5");
  url.searchParams.set("start", String(start));

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
    return (await res.json()) as NaverLocalResponse;
  } catch {
    console.warn(`  ⚠️ 네트워크 오류`);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// 아이템 → CollectedCafeData 변환
// ──────────────────────────────────────────────────────────────

function convertItem(
  item: NaverLocalItem,
  query: string,
  now: string
): CollectedCafeData | null {
  const name = normalizePlaceName(stripHtml(item.title));
  if (!name || name.length < 2) return null;

  // 인천 주소 체크 (도로명·지번 둘 다 확인)
  const anyAddress = item.roadAddress || item.address;
  if (!anyAddress.includes("인천")) return null;

  const isCafe =
    item.category.includes("카페") ||
    item.category.includes("커피") ||
    item.category.includes("디저트");
  if (!isCafe) return null;

  const coords = parseCoords(item.mapx, item.mapy);
  if (!coords) return null;

  // 동 추출: 지번 주소(item.address)가 더 정확 — "연수구 송도동 xxx" 패턴
  // 표시용 주소는 도로명 우선
  const { district, dong } = extractDistrictDong(item.address || item.roadAddress);
  if (!district) return null;

  const is24Hours = /24시간/.test(query);
  const attrs     = inferAttributes(query);
  const tags      = inferTags(query, is24Hours);

  // naverMapUrl: API link 필드 우선, 없으면 검색 URL 생성
  let naverMapUrl: string | undefined;
  if (item.link && item.link.includes("naver.com")) {
    naverMapUrl = item.link;
  } else if (item.roadAddress) {
    naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(name + " " + item.roadAddress)}`;
  }

  return {
    id:               randomUUID(),
    name,
    district,
    dong,
    address:          anyAddress,
    lat:              coords.lat,
    lng:              coords.lng,
    phone:            item.telephone || undefined,
    summary:          `${district} ${dong ? dong + " " : ""}에 위치한 카페입니다.`,
    openHoursSummary: "방문 전 직접 확인해 주세요.",
    is24Hours,
    naverMapUrl,
    status:           "active",
    verificationStatus: "verified_basic",
    verificationSources: { naverLocal: true },
    tags,
    attributes:       attrs,
    createdAt:        now,
    updatedAt:        now,
    sourceQuery:      query,
    curatorNote:      "자동 수집 (Naver Local API) — 운영자 속성 검수 필요",
  };
}

// ──────────────────────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 인천 카페 데이터 직접 수집 ===");
  console.log(`쿼리: ${ALL_QUERIES.length}개 × 최대 ${MAX_PAGES}페이지(5건) = 최대 ${ALL_QUERIES.length * MAX_PAGES * 5}건`);
  console.log(`예상 시간: ~${Math.ceil((ALL_QUERIES.length * MAX_PAGES * DELAY_MS) / 1000)}초\n`);

  if (DRY_RUN) {
    console.log("[dry-run] 쿼리 목록:\n");
    ALL_QUERIES.forEach((q, i) => console.log(`  ${String(i + 1).padStart(2)}. ${q}`));
    console.log("\n실제 수집을 시작하려면 --dry-run을 제거하세요.");
    return;
  }

  const clientId     = requireEnv("NAVER_CLIENT_ID");
  const clientSecret = requireEnv("NAVER_CLIENT_SECRET");
  const now          = new Date().toISOString();

  const rawItems: CollectedCafeData[] = [];
  let apiCalls = 0;
  let skippedNoIncheon = 0;
  let skippedNotCafe   = 0;
  let skippedNoCoords  = 0;

  for (let qi = 0; qi < ALL_QUERIES.length; qi++) {
    const query = ALL_QUERIES[qi];
    process.stdout.write(`[${qi + 1}/${ALL_QUERIES.length}] "${query}" `);

    let totalKnown = Infinity;
    let fetched    = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      const start = page * 5 + 1;
      if (start > totalKnown) break;

      await delay(DELAY_MS);
      const resp = await searchNaverLocal(query, start, clientId, clientSecret);
      apiCalls++;

      if (!resp || !resp.items.length) break;
      if (page === 0) totalKnown = resp.total;

      for (const item of resp.items) {
        const cafe = convertItem(item, query, now);
        if (!cafe) {
          const addr = item.roadAddress || item.address;
          if (!addr.includes("인천")) skippedNoIncheon++;
          else if (!item.category.includes("카페") && !item.category.includes("커피")) skippedNotCafe++;
          else skippedNoCoords++;
          continue;
        }
        rawItems.push(cafe);
        fetched++;
      }
    }

    process.stdout.write(`→ ${fetched}건\n`);
  }

  // ── 중복 제거: 정규화된 이름이 같으면 address가 포함된 것 우선 ──
  const seen = new Map<string, CollectedCafeData>();
  for (const cafe of rawItems) {
    const key = normalizePlaceName(cafe.name) + "|" + cafe.district;
    const ex  = seen.get(key);
    if (!ex || (!ex.phone && cafe.phone) || (!ex.naverMapUrl && cafe.naverMapUrl)) {
      seen.set(key, cafe);
    }
  }
  const cafes = [...seen.values()].sort((a, b) => a.district.localeCompare(b.district));

  // ── 통계 ──
  const districtCounts = cafes.reduce<Record<string, number>>((acc, c) => {
    acc[c.district] = (acc[c.district] ?? 0) + 1;
    return acc;
  }, {});
  const withPhone     = cafes.filter((c) => c.phone).length;
  const withNaverUrl  = cafes.filter((c) => c.naverMapUrl).length;

  console.log(`\n=== 수집 완료 ===`);
  console.log(`API 호출: ${apiCalls}회`);
  console.log(`원본 수집: ${rawItems.length}건`);
  console.log(`중복 제거 후: ${cafes.length}건`);
  console.log(`제외 — 인천 외: ${skippedNoIncheon}, 카페 외: ${skippedNotCafe}, 좌표 없음: ${skippedNoCoords}`);
  console.log(`전화번호 확보: ${withPhone}건 / Naver URL: ${withNaverUrl}건`);
  console.log("\n구별 분포:");
  Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([d, n]) => console.log(`  ${d}: ${n}개`));

  // ── 출력 ──
  const output = JSON.stringify(
    {
      collectedAt:       now,
      totalApiCalls:     apiCalls,
      totalRaw:          rawItems.length,
      deduplicatedCount: cafes.length,
      districtCounts,
      stats: { withPhone, withNaverUrl },
      cafes,
    },
    null,
    2
  );

  if (OUTPUT_FILE) {
    mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
    writeFileSync(OUTPUT_FILE, output, "utf-8");
    console.log(`\n✅ 결과 저장: ${OUTPUT_FILE}`);
    console.log("다음 단계: npx tsx scripts/insert-seed-cafes.ts --input", OUTPUT_FILE);
  } else {
    console.log("\n--- 결과 JSON (일부) ---");
    console.log(JSON.stringify({ ...JSON.parse(output), cafes: JSON.parse(output).cafes.slice(0, 3) }, null, 2));
    console.log(`\n(전체 ${cafes.length}건 — --output <path>로 저장하세요)`);
  }
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
