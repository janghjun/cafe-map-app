#!/usr/bin/env node
/**
 * 수집된 후보 카페를 네이버 지역 검색 API로 실존 검증하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/verify-candidates.ts --input <collected.json> [options]
 *
 * 옵션:
 *   --input  <path>   collect-naver-candidates.ts 출력 JSON 파일 (필수)
 *   --output <path>   검증 결과 저장 경로 (기본값: stdout)
 *   --dry-run         API 호출 없이 검증 대상 목록만 출력
 *   --max    <n>      최대 처리 후보 수 (기본값: 200)
 *   --min-confidence <f>  이 confidence 이상인 후보만 처리 (기본값: 0)
 *   --delay  <ms>     요청 간 딜레이 ms (기본값: 350)
 *
 * ⚠️ 서버 사이드 전용
 * ⚠️ API 응답 원문 저장 금지 — 매칭 점수와 상태값만 기록합니다.
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  normalizePlaceName,
  calculatePlaceMatchScore,
  decideExistenceStatus,
} from "../src/utils/placeMatch.ts";
import type { PlaceVerification } from "../src/types/candidate.ts";

// ────────────────────────────────────────────────────────────
// CLI 인자 파싱
// ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

const INPUT_FILE       = getArg("--input");
const OUTPUT_FILE      = getArg("--output");
const DRY_RUN          = args.includes("--dry-run");
const MAX_CANDIDATES   = parseInt(getArg("--max")  ?? "200", 10);
const MIN_CONFIDENCE   = parseFloat(getArg("--min-confidence") ?? "0");
const REQUEST_DELAY_MS = parseInt(getArg("--delay") ?? "350", 10);

if (!INPUT_FILE) {
  console.error("❌ --input <file> 옵션이 필요합니다.");
  console.error("   예: tsx scripts/verify-candidates.ts --input collected.json");
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

type CollectedCandidate = {
  sourceType: string;
  sourceKeyword: string;
  candidateName: string;
  candidateAddress?: string;
  extractedKeywords: string[];
  confidenceScore: number;
  collectedAt: string;
};

type CollectionOutput = {
  collectedAt: string;
  candidates: CollectedCandidate[];
};

// 네이버 지역 검색 API 응답 (허용된 필드만 정의)
type NaverLocalItem = {
  title: string;        // 상호명 (HTML 태그 포함 가능)
  address: string;
  roadAddress: string;
  category: string;
  // ⚠️ description(리뷰 발췌), mapx, mapy, link 등은 사용하지 않습니다.
};

type NaverLocalResponse = {
  items: NaverLocalItem[];
};

// ────────────────────────────────────────────────────────────
// 환경 변수 확인
// ────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ 환경 변수 '${key}'가 설정되지 않았습니다.`);
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
        "X-Naver-Client-Id":     clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) {
      console.warn(`  ⚠️ API 오류 [${res.status}]`);
      return [];
    }
    const data = (await res.json()) as NaverLocalResponse;
    return data.items ?? [];
  } catch {
    console.warn(`  ⚠️ 네트워크 오류`);
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// 검증 핵심 로직
// ────────────────────────────────────────────────────────────

/**
 * 후보 카페를 네이버 지역 검색 결과와 대조해 가장 잘 맞는 항목을 반환합니다.
 * API 응답 원문은 이 함수 내에서만 사용하고 반환하지 않습니다.
 */
function findBestMatch(
  candidate: CollectedCandidate,
  items: NaverLocalItem[]
): PlaceVerification["existenceStatus"] extends infer _S
  ? {
      matchedName?: string;
      matchedAddress?: string;
      nameMatchScore: number;
      addressMatchScore: number;
      overallMatchScore: number;
    }
  : never {
  if (items.length === 0) {
    return { nameMatchScore: 0, addressMatchScore: 0, overallMatchScore: 0 };
  }

  let best = { nameMatchScore: 0, addressMatchScore: 0, overallMatchScore: 0 };
  let bestMatchedName: string | undefined;
  let bestMatchedAddress: string | undefined;

  for (const item of items) {
    const matchedName = normalizePlaceName(item.title);
    const matchedAddress = item.roadAddress || item.address || undefined;

    // 인천 외 지역 결과 제외
    if (matchedAddress && !matchedAddress.includes("인천")) continue;

    const scores = calculatePlaceMatchScore(
      { candidateName: candidate.candidateName, candidateAddress: candidate.candidateAddress },
      { matchedName, matchedAddress }
    );

    if (scores.overallMatchScore > best.overallMatchScore) {
      best = scores;
      bestMatchedName    = matchedName;
      bestMatchedAddress = matchedAddress;
    }
    // ⚠️ item 원문은 이 루프 스코프에서만 사용하고 반환하지 않습니다.
  }

  return { ...best, matchedName: bestMatchedName, matchedAddress: bestMatchedAddress };
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 후보 카페 실존 검증 ===\n");

  // 입력 파일 로드
  let collectionData: CollectionOutput;
  try {
    const raw = readFileSync(INPUT_FILE!, "utf-8");
    collectionData = JSON.parse(raw) as CollectionOutput;
  } catch (err) {
    console.error(`❌ 입력 파일을 읽을 수 없습니다: ${INPUT_FILE}`);
    console.error(String(err));
    process.exit(1);
  }

  const allCandidates = collectionData.candidates ?? [];
  const filtered = allCandidates
    .filter((c) => c.confidenceScore >= MIN_CONFIDENCE)
    .slice(0, MAX_CANDIDATES);

  console.log(`전체 후보: ${allCandidates.length}개`);
  console.log(`처리 대상: ${filtered.length}개 (min-confidence: ${MIN_CONFIDENCE}, max: ${MAX_CANDIDATES})\n`);

  if (DRY_RUN) {
    console.log("[dry-run 모드] API 호출 없이 검증 대상 목록만 출력합니다.\n");
    filtered.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.confidenceScore.toFixed(2)}] ${c.candidateName}`);
      if (c.candidateAddress) console.log(`        ${c.candidateAddress}`);
    });
    return;
  }

  const clientId     = requireEnv("NAVER_CLIENT_ID");
  const clientSecret = requireEnv("NAVER_CLIENT_SECRET");

  const verifications: PlaceVerification[] = [];
  let apiCallCount = 0;

  for (let i = 0; i < filtered.length; i++) {
    const candidate = filtered[i];
    process.stdout.write(`[${i + 1}/${filtered.length}] "${candidate.candidateName}" 검증 중...`);

    await delay(REQUEST_DELAY_MS);
    const items = await searchNaverLocal(candidate.candidateName, clientId, clientSecret);
    apiCallCount++;

    const bestMatch = findBestMatch(candidate, items);
    const existenceStatus = decideExistenceStatus(bestMatch.overallMatchScore);

    const verification: PlaceVerification = {
      id:                 `verify_${Date.now()}_${i}`,
      candidateId:        `pending_${normalizePlaceName(candidate.candidateName)}`,
      provider:           "naver_local",
      queryName:          candidate.candidateName,
      queryAddress:       candidate.candidateAddress,
      matchedName:        bestMatch.matchedName,
      matchedAddress:     bestMatch.matchedAddress,
      nameMatchScore:     Math.round(bestMatch.nameMatchScore    * 1000) / 1000,
      addressMatchScore:  Math.round(bestMatch.addressMatchScore * 1000) / 1000,
      overallMatchScore:  Math.round(bestMatch.overallMatchScore * 1000) / 1000,
      existenceStatus,
      verifiedAt:         new Date().toISOString(),
    };
    verifications.push(verification);

    const statusIcon: Record<typeof existenceStatus, string> = {
      confirmed:        "✅",
      likely:           "🟡",
      uncertain:        "🟠",
      not_found:        "❌",
      closed_suspected: "🔴",
      closed_confirmed: "⛔",
    };
    process.stdout.write(
      ` ${statusIcon[existenceStatus]} ${existenceStatus} (${bestMatch.overallMatchScore.toFixed(2)})\n`
    );
  }

  // 통계
  const summary = {
    confirmed:        verifications.filter((v) => v.existenceStatus === "confirmed").length,
    likely:           verifications.filter((v) => v.existenceStatus === "likely").length,
    uncertain:        verifications.filter((v) => v.existenceStatus === "uncertain").length,
    not_found:        verifications.filter((v) => v.existenceStatus === "not_found").length,
    closed_suspected: verifications.filter((v) => v.existenceStatus === "closed_suspected").length,
  };

  console.log(`\n=== 검증 완료 ===`);
  console.log(`API 호출 수: ${apiCallCount}`);
  console.log(`✅ confirmed:  ${summary.confirmed}`);
  console.log(`🟡 likely:     ${summary.likely}`);
  console.log(`🟠 uncertain:  ${summary.uncertain}`);
  console.log(`❌ not_found:  ${summary.not_found}  ← 삭제 금지, 상태값 보관`);
  if (summary.closed_suspected > 0) {
    console.log(`🔴 closed_suspected: ${summary.closed_suspected}`);
  }

  const output = JSON.stringify(
    {
      verifiedAt:       new Date().toISOString(),
      sourceFile:       INPUT_FILE,
      totalVerified:    verifications.length,
      apiCallCount,
      summary,
      verifications,
      // ⚠️ API 응답 원문은 이 파일에 포함되지 않습니다.
    },
    null,
    2
  );

  if (OUTPUT_FILE) {
    writeFileSync(OUTPUT_FILE, output, "utf-8");
    console.log(`\n결과 저장됨: ${OUTPUT_FILE}`);
    console.log("다음 단계: tsx scripts/insert-candidates.ts --input <collected.json> --verifications <this.json>");
  } else {
    console.log("\n--- 결과 (JSON) ---");
    console.log(output);
  }
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
