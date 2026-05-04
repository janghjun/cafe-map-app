#!/usr/bin/env node
/**
 * 네이버 공식 검색 API 기반 인천 카공 카페 후보 수집 스크립트
 *
 * 사용법:
 *   npx tsx scripts/collect-naver-candidates.ts [options]
 *
 * 옵션:
 *   --dry-run          API 호출 없이 키워드 목록만 출력
 *   --output <path>    결과를 JSON 파일로 저장 (기본값: stdout)
 *   --max <n>          최대 처리 키워드 수 (기본값: 100)
 *   --delay <ms>       요청 간 딜레이 ms (기본값: 350)
 *
 * ⚠️ 서버 사이드 전용 — 클라이언트 번들에 포함하지 마세요.
 * ⚠️ API 응답 원문 저장 금지 — 허용된 필드만 추출합니다.
 * ⚠️ NAVER_CLIENT_SECRET을 절대 클라이언트 코드에 노출하지 마세요.
 */

import { writeFileSync } from "node:fs";
import { generateCandidateSearchKeywords } from "../src/utils/candidateKeywords.ts";
import {
  extractCandidateAttributesFromMany,
  toExtractedKeywordList,
} from "../src/utils/candidateAttributeExtractor.ts";
import { normalizePlaceName } from "../src/utils/placeMatch.ts";

// ────────────────────────────────────────────────────────────
// CLI 인자 파싱
// ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const OUTPUT_FILE = (() => {
  const idx = args.indexOf("--output");
  return idx !== -1 ? args[idx + 1] : null;
})();
const MAX_KEYWORDS = (() => {
  const idx = args.indexOf("--max");
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 100;
})();
const REQUEST_DELAY_MS = (() => {
  const idx = args.indexOf("--delay");
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 350;
})();

// ────────────────────────────────────────────────────────────
// 환경 변수 확인
// ────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ 환경 변수 '${key}'가 설정되지 않았습니다.`);
    console.error(`   .env.local 파일 또는 환경에서 설정해 주세요:`);
    console.error(`   ${key}=your_value`);
    process.exit(1);
  }
  return val;
}

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

type SourceType = "naver_blog" | "naver_cafe" | "naver_local";

/** 수집 결과 구조 — DB insert용이 아니라 운영자 검수 전 단계 */
type CollectedCandidate = {
  sourceType: SourceType;
  sourceKeyword: string;
  candidateName: string;
  candidateAddress?: string;    // 네이버 지역 검색에서만 수집
  extractedKeywords: string[];  // 속성 키 목록 (원문 아님)
  confidenceScore: number;      // 0~1
  collectedAt: string;          // ISO timestamp
  // ⚠️ 게시물 본문, 이미지 URL, 작성자 정보, 외부 평점은 포함하지 않습니다.
};

// ────────────────────────────────────────────────────────────
// 네이버 API 응답 타입 (허용된 필드만 정의)
// ────────────────────────────────────────────────────────────

type NaverBlogItem = {
  title: string;       // 게시물 제목 (속성 추출 후 폐기)
  description: string; // 요약 발췌 (속성 추출 후 폐기) — 원문 저장 금지
  postdate: string;    // YYYYMMDD 형식
  // ⚠️ bloggername, link, thumbnail 등 나머지 필드는 사용하지 않습니다.
};

type NaverCafeItem = {
  title: string;
  description: string; // 속성 추출 후 폐기
  cafename: string;    // 커뮤니티 이름 (카페명 아님)
  postdate: string;
};

type NaverLocalItem = {
  title: string;        // 상호명 (HTML 태그 포함 가능)
  address: string;      // 지번 주소
  roadAddress: string;  // 도로명 주소
  category: string;     // "음식점>카페,디저트>카페" 형식
  telephone: string;    // 전화번호 (참고용)
  // ⚠️ description(리뷰 발췌), link, mapx, mapy는 사용하지 않습니다.
};

type NaverSearchResponse<T> = {
  total: number;
  start: number;
  display: number;
  items: T[];
};

// ────────────────────────────────────────────────────────────
// API 호출 헬퍼
// ────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function naverSearch<T>(
  endpoint: string,
  params: Record<string, string>,
  clientId: string,
  clientSecret: string
): Promise<NaverSearchResponse<T> | null> {
  const url = new URL(endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`  ⚠️ API 오류 [${res.status}]: ${text.slice(0, 100)}`);
      return null;
    }

    return (await res.json()) as NaverSearchResponse<T>;
  } catch (err) {
    console.warn(`  ⚠️ 네트워크 오류: ${String(err)}`);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// 후보 추출 함수
// ────────────────────────────────────────────────────────────

/**
 * 블로그/카페글 응답에서 카페명 후보를 추출합니다.
 * title + description에서 속성 키워드를 추출하고 원문은 즉시 폐기합니다.
 */
function extractCandidatesFromTextItems(
  items: Array<{ title: string; description: string }>,
  sourceType: "naver_blog" | "naver_cafe",
  keyword: string
): CollectedCandidate[] {
  const candidates: CollectedCandidate[] = [];

  for (const item of items) {
    const name = normalizePlaceName(item.title);
    // 게시물 제목에서 카페명을 추출하기엔 너무 일반적일 수 있음
    // 키워드에 지역어가 포함된 경우만 후보로 등록 (필터링 기준)
    if (!name || name.length < 2) continue;

    // 속성 추출 — 원문은 이 함수 스코프에서만 사용하고 저장하지 않음
    const extractedAttrs = extractCandidateAttributesFromMany([
      item.title,
      item.description,
    ]);
    const extractedKeywords = toExtractedKeywordList(extractedAttrs, 0.6);

    // 속성이 하나도 없으면 카공 관련 게시물이 아닐 가능성 높음 → 건너뜀
    if (extractedKeywords.length === 0) continue;

    const confidenceScore = Math.min(
      0.1 + extractedKeywords.length * 0.1,
      0.5 // 블로그/카페글 기반은 최대 0.5 (지역 검색보다 신뢰도 낮음)
    );

    candidates.push({
      sourceType,
      sourceKeyword: keyword,
      candidateName: name,
      extractedKeywords,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      collectedAt: new Date().toISOString(),
    });
    // ⚠️ item.title, item.description 원문은 여기서 참조가 끊어집니다.
  }

  return candidates;
}

/**
 * 네이버 지역 검색 응답에서 후보를 추출합니다.
 * 주소·카테고리 기반으로 신뢰도가 높습니다.
 */
function extractCandidatesFromLocalItems(
  items: NaverLocalItem[],
  keyword: string
): CollectedCandidate[] {
  const candidates: CollectedCandidate[] = [];

  for (const item of items) {
    const name = normalizePlaceName(item.title);
    if (!name) continue;

    // 인천광역시 기준 주소만 허용
    const address = item.roadAddress || item.address;
    if (!address.includes("인천")) continue;

    // 카페 카테고리인지 확인
    const isCarCategory = item.category.includes("카페") ||
      item.category.includes("커피");
    if (!isCarCategory) continue;

    // 지역 검색은 카페 카테고리 + 인천 주소로 신뢰도가 높음
    let confidenceScore = 0.4;
    if (item.roadAddress) confidenceScore += 0.2; // 도로명 주소 있으면 +0.2

    candidates.push({
      sourceType: "naver_local",
      sourceKeyword: keyword,
      candidateName: name,
      candidateAddress: item.roadAddress || item.address,
      extractedKeywords: [], // 지역 검색은 속성 추출 불필요 (상호명+주소 기준)
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      collectedAt: new Date().toISOString(),
    });
  }

  return candidates;
}

// ────────────────────────────────────────────────────────────
// 중복 제거
// ────────────────────────────────────────────────────────────

function deduplicateCandidates(
  candidates: CollectedCandidate[]
): CollectedCandidate[] {
  const seen = new Map<string, CollectedCandidate>();

  for (const c of candidates) {
    const key = normalizePlaceName(c.candidateName);
    const existing = seen.get(key);

    if (!existing || c.confidenceScore > existing.confidenceScore) {
      seen.set(key, c);
    }
  }

  return [...seen.values()];
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 인천 카공 카페 후보 수집 ===\n");

  // 키워드 생성
  const allKeywords = generateCandidateSearchKeywords();
  const keywords = allKeywords.slice(0, MAX_KEYWORDS);
  console.log(`키워드 총 ${allKeywords.length}개 생성 → 이번 실행: ${keywords.length}개`);

  if (DRY_RUN) {
    console.log("\n[dry-run 모드] API 호출 없이 키워드 목록만 출력합니다.\n");
    keywords.forEach((kw, i) => console.log(`  ${i + 1}. ${kw}`));
    console.log("\n실제 수집을 시작하려면 --dry-run 플래그를 제거하세요.");
    return;
  }

  const clientId = requireEnv("NAVER_CLIENT_ID");
  const clientSecret = requireEnv("NAVER_CLIENT_SECRET");

  console.log("\n수집 시작...\n");

  const allCandidates: CollectedCandidate[] = [];
  let apiCallCount = 0;

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    process.stdout.write(`[${i + 1}/${keywords.length}] "${keyword}" 검색 중...`);

    // 1. 블로그 검색
    await delay(REQUEST_DELAY_MS);
    const blogResp = await naverSearch<NaverBlogItem>(
      "https://openapi.naver.com/v1/search/blog.json",
      { query: keyword, display: "10", sort: "date" },
      clientId,
      clientSecret
    );
    apiCallCount++;
    if (blogResp?.items) {
      const extracted = extractCandidatesFromTextItems(
        blogResp.items,
        "naver_blog",
        keyword
      );
      allCandidates.push(...extracted);
    }

    // 2. 카페글 검색
    await delay(REQUEST_DELAY_MS);
    const cafeResp = await naverSearch<NaverCafeItem>(
      "https://openapi.naver.com/v1/search/cafearticle.json",
      { query: keyword, display: "10", sort: "date" },
      clientId,
      clientSecret
    );
    apiCallCount++;
    if (cafeResp?.items) {
      const extracted = extractCandidatesFromTextItems(
        cafeResp.items.map((item) => ({
          title: item.title,
          description: item.description,
        })),
        "naver_cafe",
        keyword
      );
      allCandidates.push(...extracted);
    }

    // 3. 지역 검색 (키워드에 지역어가 포함된 경우만)
    const hasArea = keyword.includes("인천") || keyword.includes("구") ||
      keyword.includes("동");
    if (hasArea) {
      await delay(REQUEST_DELAY_MS);
      const localResp = await naverSearch<NaverLocalItem>(
        "https://openapi.naver.com/v1/search/local.json",
        { query: keyword, display: "5" },
        clientId,
        clientSecret
      );
      apiCallCount++;
      if (localResp?.items) {
        const extracted = extractCandidatesFromLocalItems(
          localResp.items,
          keyword
        );
        allCandidates.push(...extracted);
      }
    }

    process.stdout.write(` 누적 후보: ${allCandidates.length}개\n`);
  }

  // 중복 제거
  const deduplicated = deduplicateCandidates(allCandidates);

  console.log(`\n=== 수집 완료 ===`);
  console.log(`API 호출 수: ${apiCallCount}`);
  console.log(`원본 후보 수: ${allCandidates.length}`);
  console.log(`중복 제거 후: ${deduplicated.length}`);

  // confidence 분포
  const high = deduplicated.filter((c) => c.confidenceScore >= 0.6).length;
  const med  = deduplicated.filter((c) => c.confidenceScore >= 0.3 && c.confidenceScore < 0.6).length;
  const low  = deduplicated.filter((c) => c.confidenceScore < 0.3).length;
  console.log(`  고신뢰 (≥0.6): ${high}개`);
  console.log(`  중신뢰 (0.3~): ${med}개`);
  console.log(`  저신뢰 (<0.3): ${low}개`);

  // 출력
  const output = JSON.stringify(
    {
      collectedAt: new Date().toISOString(),
      totalKeywords: keywords.length,
      apiCallCount,
      rawCount: allCandidates.length,
      deduplicatedCount: deduplicated.length,
      candidates: deduplicated,
    },
    null,
    2
  );

  if (OUTPUT_FILE) {
    writeFileSync(OUTPUT_FILE, output, "utf-8");
    console.log(`\n결과 저장됨: ${OUTPUT_FILE}`);
    console.log("⚠️  이 파일에는 원문/이미지/리뷰가 포함되지 않습니다.");
    console.log("    운영자 검수 후 Supabase raw_cafe_candidates에 INSERT 하세요.");
  } else {
    console.log("\n--- 결과 (JSON) ---");
    console.log(output);
  }
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
