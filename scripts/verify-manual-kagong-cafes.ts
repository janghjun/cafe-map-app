#!/usr/bin/env node
/**
 * 수동 수집 카공 카페 네이버 지역 검색 API 검증 스크립트
 *
 * 사용법:
 *   export NAVER_CLIENT_ID=... && export NAVER_CLIENT_SECRET=...
 *   npx tsx scripts/verify-manual-kagong-cafes.ts
 *
 * 출력:
 *   data/manual/verified-manual-kagong-cafes.json
 *   data/manual/manual-kagong-verification-report.json
 *
 * ⚠️ API 응답 중 description(리뷰 발췌)은 저장하지 않습니다.
 * ⚠️ mapx/mapy(좌표)는 저장합니다.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizePlaceName,
  calculateNameSimilarity,
} from "../src/utils/placeMatch.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const INPUT_FILE = resolve(ROOT, "data/manual/normalized-manual-kagong-cafes.json");
const OUTPUT_DIR = resolve(ROOT, "data/manual");
const OUTPUT_VERIFIED = resolve(OUTPUT_DIR, "verified-manual-kagong-cafes.json");
const OUTPUT_REPORT = resolve(OUTPUT_DIR, "manual-kagong-verification-report.json");

const REQUEST_DELAY_MS = 350;

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

type NormalizedRecord = {
  manualId: string;
  name: string;
  district: string | null;
  dong: string | null;
  addressHint: string | null;
  areaGroup: string | null;
  operatorSummaryDraft: string;
  rawReviewMemo: string; // APP_EXPOSURE_FORBIDDEN
  sourceScore: number | null; // APP_EXPOSURE_FORBIDDEN
  sourceRating: number | null; // APP_EXPOSURE_FORBIDDEN
  sourceReviewCount: number | null; // APP_EXPOSURE_FORBIDDEN
  sourceTags: string[];
  studySignals: string[];
  suggestedTags: string[];
  suggestedScores: {
    quietScore: number;
    outletScore: number;
    wifiScore: number;
    stayScore: number;
    soloScore: number;
    groupScore: number;
    groupSeatScore: number;
    coffeeScore: number;
    dessertScore: number;
    lateOpenScore: number;
  };
  priority: "high" | "normal" | "low";
  sourceType: "manual_text";
  reviewStatus: "pending";
  verificationStatus: "needs_check";
};

type NormalizedDataset = {
  records: NormalizedRecord[];
};

// 네이버 지역 검색 API 응답 허용 필드만 정의
// ⚠️ description 필드는 의도적으로 포함하지 않습니다.
type NaverLocalItem = {
  title: string;
  address: string;
  roadAddress: string;
  category: string;
  mapx: string;
  mapy: string;
};

type NaverLocalResponse = {
  items: NaverLocalItem[];
};

type VerifiedRecord = {
  manualId: string;
  name: string;
  verifiedName: string | null;
  verifiedAddress: string | null;
  verifiedRoadAddress: string | null;
  mapx: string | null;
  mapy: string | null;
  naverCategory: string | null;
  verificationStatus: "verified_basic" | "not_found" | "ambiguous";
  verificationConfidence: number;
  matchedQuery: string | null;
  operatorSummaryDraft: string;
  rawReviewMemo: string; // APP_EXPOSURE_FORBIDDEN
  sourceScore: number | null; // APP_EXPOSURE_FORBIDDEN
  sourceRating: number | null; // APP_EXPOSURE_FORBIDDEN
  sourceReviewCount: number | null; // APP_EXPOSURE_FORBIDDEN
  suggestedScores: NormalizedRecord["suggestedScores"];
  suggestedTags: string[];
  priority: "high" | "normal" | "low";
  studySignals: string[];
};

type ReportEntry = {
  manualId: string;
  name: string;
  verificationStatus: "verified_basic" | "not_found" | "ambiguous";
  confidence: number;
  matchedQuery: string | null;
  verifiedName: string | null;
};

// ────────────────────────────────────────────────────────────
// 환경 변수
// ────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ 환경 변수 '${key}'가 설정되지 않았습니다.`);
    console.error(`   export ${key}=<value>`);
    process.exit(1);
  }
  return val;
}

// ────────────────────────────────────────────────────────────
// API 헬퍼
// ────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchNaverLocal(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<NaverLocalItem[]> {
  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) {
      console.warn(`    ⚠️ API 오류 [${res.status}]: ${query}`);
      return [];
    }
    const data = (await res.json()) as NaverLocalResponse;
    return data.items ?? [];
  } catch {
    console.warn(`    ⚠️ 네트워크 오류: ${query}`);
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// 매칭 로직
// ────────────────────────────────────────────────────────────

type BestMatchResult = {
  item: NaverLocalItem;
  overallMatchScore: number;
} | null;

/**
 * Naver API 결과 주소가 기대 지역(district/dong/addressHint)과 얼마나 일치하는지 0~1 점수 반환.
 * - 반드시 인천 주소여야 기본점 부여 (타 도시 필터링)
 * - district → +0.35, dong → +0.25, addressHint 부분 일치 → +0.15
 */
function scoreLocationMatch(
  item: NaverLocalItem,
  district: string | null,
  dong: string | null,
  addressHint: string | null
): number {
  const addr = [item.roadAddress, item.address].filter(Boolean).join(" ").toLowerCase();
  if (!addr.includes("인천")) return 0; // 인천 외 지역 제외

  let score = 0.4; // 인천 확인 기본점

  if (district) {
    // "인천광역시 중구" → "중구" 만 추출해 비교
    const normDistrict = district.replace(/인천광역시\s*/g, "").replace(/인천\s*/g, "").trim();
    if (normDistrict && addr.includes(normDistrict.toLowerCase())) score += 0.35;
  }

  if (dong) {
    if (addr.includes(dong.toLowerCase())) score += 0.25;
  } else if (addressHint) {
    const hints = addressHint.split(/[\s,\-]+/).filter((p) => p.length >= 2);
    const matchCount = hints.filter((h) => addr.includes(h.toLowerCase())).length;
    if (matchCount > 0) score += 0.15 * Math.min((matchCount / hints.length) * 1.5, 1);
  }

  return Math.min(score, 1);
}

/**
 * 카페명 유사도(75%) + 위치 검증(25%) 종합 점수 계산.
 * 주소 없는 결과는 카페명 유사도만으로 평가 (최대 0.75 — ambiguous 처리 가능).
 */
function findBestMatch(
  rec: NormalizedRecord,
  items: NaverLocalItem[]
): BestMatchResult {
  let best: BestMatchResult = null;

  for (const item of items) {
    const cleanedTitle = normalizePlaceName(item.title);
    const nameSim = calculateNameSimilarity(rec.name, cleanedTitle);

    if (nameSim < 0.3) continue;

    const addr = item.roadAddress || item.address || "";
    // 주소가 있고 인천이 아닌 경우 제외 (쿼리에 인천 포함 시에도 간혹 타 도시 노출)
    if (addr && !addr.includes("인천")) continue;

    const locationScore = addr ? scoreLocationMatch(item, rec.district, rec.dong, rec.addressHint) : 0;
    const overallScore = addr
      ? nameSim * 0.75 + locationScore * 0.25
      : nameSim * 0.75; // 주소 없으면 이름 유사도만 (최대 0.75)

    if (!best || overallScore > best.overallMatchScore) {
      best = { item, overallMatchScore: overallScore };
    }
  }

  return best;
}

// ────────────────────────────────────────────────────────────
// main
// ────────────────────────────────────────────────────────────

console.log(`\n📂 입력 파일: ${INPUT_FILE}`);

const clientId = requireEnv("NAVER_CLIENT_ID");
const clientSecret = requireEnv("NAVER_CLIENT_SECRET");

let dataset: NormalizedDataset;
try {
  dataset = JSON.parse(readFileSync(INPUT_FILE, "utf-8")) as NormalizedDataset;
} catch (e) {
  console.error(`❌ 파일 읽기 실패: ${INPUT_FILE}`);
  console.error(e);
  process.exit(1);
}

const records = dataset.records ?? [];
console.log(`✅ 검증 대상: ${records.length}개`);
console.log(`⏱  요청 간격: ${REQUEST_DELAY_MS}ms\n`);

const verified: VerifiedRecord[] = [];
const reportEntries: ReportEntry[] = [];

for (let i = 0; i < records.length; i++) {
  const rec = records[i];
  console.log(`[${i + 1}/${records.length}] ${rec.name}`);

  // 카페명만으로 검색 → 결과에서 주소로 지역 검증
  // 지역명을 쿼리에 포함하면 동명 오인식·누락이 생겨 제외
  const uniqueQueries = [`${rec.name} 인천`, rec.name].filter(
    (q, i, arr) => arr.indexOf(q) === i
  );

  let bestItem: NaverLocalItem | null = null;
  let bestScore = 0;
  let matchedQuery: string | null = null;

  for (const query of uniqueQueries) {
    const items = await searchNaverLocal(query, clientId, clientSecret);
    await delay(REQUEST_DELAY_MS);

    if (items.length === 0) continue;

    const match = findBestMatch(rec, items);
    if (!match) continue;

    if (match.overallMatchScore >= 0.65) {
      bestItem = match.item;
      bestScore = match.overallMatchScore;
      matchedQuery = query;
      console.log(`  ✅ 검증 성공 (score: ${bestScore.toFixed(3)}) query: "${query}"`);
      break;
    }

    if (match.overallMatchScore > bestScore) {
      bestItem = match.item;
      bestScore = match.overallMatchScore;
      matchedQuery = query;
    }
  }

  let verificationStatus: "verified_basic" | "not_found" | "ambiguous";
  if (bestScore >= 0.65) {
    verificationStatus = "verified_basic";
  } else if (bestScore >= 0.45) {
    verificationStatus = "ambiguous";
    console.log(`  ⚠️ 모호 (score: ${bestScore.toFixed(3)})`);
  } else {
    verificationStatus = "not_found";
    console.log(`  ❌ 미발견 (score: ${bestScore.toFixed(3)})`);
  }

  const verifiedRecord: VerifiedRecord = {
    manualId: rec.manualId,
    name: rec.name,
    verifiedName: bestItem ? normalizePlaceName(bestItem.title) : null,
    verifiedAddress: bestItem ? bestItem.address || null : null,
    verifiedRoadAddress: bestItem ? bestItem.roadAddress || null : null,
    mapx: bestItem ? bestItem.mapx || null : null,
    mapy: bestItem ? bestItem.mapy || null : null,
    naverCategory: bestItem ? bestItem.category || null : null,
    verificationStatus,
    verificationConfidence: parseFloat(bestScore.toFixed(4)),
    matchedQuery,
    operatorSummaryDraft: rec.operatorSummaryDraft,
    rawReviewMemo: rec.rawReviewMemo, // APP_EXPOSURE_FORBIDDEN
    sourceScore: rec.sourceScore, // APP_EXPOSURE_FORBIDDEN
    sourceRating: rec.sourceRating, // APP_EXPOSURE_FORBIDDEN
    sourceReviewCount: rec.sourceReviewCount, // APP_EXPOSURE_FORBIDDEN
    suggestedScores: rec.suggestedScores,
    suggestedTags: rec.suggestedTags,
    priority: rec.priority,
    studySignals: rec.studySignals,
  };

  verified.push(verifiedRecord);
  reportEntries.push({
    manualId: rec.manualId,
    name: rec.name,
    verificationStatus,
    confidence: parseFloat(bestScore.toFixed(4)),
    matchedQuery,
    verifiedName: verifiedRecord.verifiedName,
  });
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const countVerified = verified.filter((v) => v.verificationStatus === "verified_basic").length;
const countAmbiguous = verified.filter((v) => v.verificationStatus === "ambiguous").length;
const countNotFound = verified.filter((v) => v.verificationStatus === "not_found").length;

writeFileSync(
  OUTPUT_VERIFIED,
  JSON.stringify(
    {
      meta: {
        verifiedAt: new Date().toISOString(),
        total: verified.length,
        verifiedBasic: countVerified,
        ambiguous: countAmbiguous,
        notFound: countNotFound,
        policyNote:
          "rawReviewMemo, sourceScore, sourceRating, sourceReviewCount 는 앱 노출 금지 (APP_EXPOSURE_FORBIDDEN). description은 저장하지 않음.",
      },
      records: verified,
    },
    null,
    2
  ),
  "utf-8"
);

writeFileSync(
  OUTPUT_REPORT,
  JSON.stringify(
    {
      meta: {
        generatedAt: new Date().toISOString(),
        total: reportEntries.length,
        verifiedBasic: countVerified,
        ambiguous: countAmbiguous,
        notFound: countNotFound,
      },
      report: reportEntries,
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`\n📋 검증 결과 요약`);
console.log(`  verified_basic: ${countVerified}개`);
console.log(`  ambiguous:      ${countAmbiguous}개`);
console.log(`  not_found:      ${countNotFound}개`);
console.log(`  출력: ${OUTPUT_VERIFIED}`);
console.log(`  리포트: ${OUTPUT_REPORT}`);
console.log("");
