#!/usr/bin/env node
/**
 * 수집·검증된 후보를 Supabase raw_cafe_candidates 테이블에 INSERT하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/insert-candidates.ts --input <collected.json> [options]
 *
 * 옵션:
 *   --input         <path>   collect-naver-candidates.ts 출력 JSON (필수)
 *   --verifications <path>   verify-candidates.ts 출력 JSON (선택 — 없으면 score 없이 insert)
 *   --dry-run                DB insert 없이 insert 대상 목록만 출력
 *   --min-confidence <f>     이 confidence 이상만 insert (기본값: 0.3)
 *   --min-status    <s>      이 상태 이상인 검증 결과만 insert
 *                            (기본값: likely, 선택: confirmed|likely|uncertain)
 *
 * 필요 환경 변수 (서버 사이드 전용):
 *   SUPABASE_URL              Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_ROLE_KEY Service Role Key (RLS 우회 필요 시) 또는 Anon Key
 *
 * ⚠️ SERVICE_ROLE_KEY는 절대 클라이언트 코드에 포함하지 마세요.
 * ⚠️ 이 스크립트는 운영자 검수 전 단계 — review_status: 'pending'으로만 insert합니다.
 * ⚠️ 자동 승인(approved) insert 금지.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { normalizePlaceName } from "../src/utils/placeMatch.ts";
import type { CafeExistenceStatus } from "../src/types/candidate.ts";

// ────────────────────────────────────────────────────────────
// CLI 인자 파싱
// ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

const INPUT_FILE           = getArg("--input");
const VERIFICATIONS_FILE   = getArg("--verifications");
const DRY_RUN              = args.includes("--dry-run");
const MIN_CONFIDENCE       = parseFloat(getArg("--min-confidence") ?? "0.3");

// "likely" 이상 = ["confirmed", "likely"]
// "uncertain" 이상 = ["confirmed", "likely", "uncertain"]
const MIN_STATUS_RAW = (getArg("--min-status") ?? "likely") as CafeExistenceStatus;
const STATUS_RANK: Record<CafeExistenceStatus, number> = {
  confirmed: 4, likely: 3, uncertain: 2, not_found: 1,
  closed_suspected: 0, closed_confirmed: 0,
};
const MIN_STATUS_RANK = STATUS_RANK[MIN_STATUS_RAW] ?? 3;

if (!INPUT_FILE) {
  console.error("❌ --input <file> 옵션이 필요합니다.");
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

type VerificationEntry = {
  queryName: string;
  existenceStatus: CafeExistenceStatus;
  overallMatchScore: number;
};

// Supabase raw_cafe_candidates insert 행 구조
type RawCandidateInsert = {
  source_type:        string;
  source_keyword:     string;
  candidate_name:     string;
  candidate_address:  string | null;
  extracted_keywords: string[];
  confidence_score:   number;
  review_status:      "pending"; // ⚠️ 항상 pending — 자동 승인 금지
};

// ────────────────────────────────────────────────────────────
// 환경 변수 확인
// ────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ 환경 변수 '${key}'가 설정되지 않았습니다.`);
    console.error(`   .env.local 또는 환경에서 설정하세요: ${key}=your_value`);
    process.exit(1);
  }
  return val;
}

// ────────────────────────────────────────────────────────────
// 파일 로드 헬퍼
// ────────────────────────────────────────────────────────────

function loadJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch (err) {
    console.error(`❌ 파일 읽기 실패: ${path}`);
    console.error(String(err));
    process.exit(1);
  }
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 후보 카페 Supabase INSERT ===\n");

  // 수집 결과 로드
  const collectionData = loadJson<{ candidates: CollectedCandidate[] }>(INPUT_FILE!);
  const allCandidates = collectionData.candidates ?? [];

  // 검증 결과 로드 (선택)
  const verificationMap = new Map<string, VerificationEntry>();
  if (VERIFICATIONS_FILE) {
    const verData = loadJson<{ verifications: VerificationEntry[] }>(VERIFICATIONS_FILE);
    for (const v of verData.verifications ?? []) {
      verificationMap.set(normalizePlaceName(v.queryName), v);
    }
    console.log(`검증 결과 로드: ${verificationMap.size}건`);
  } else {
    console.log("⚠️  --verifications 없음 — confidence만으로 필터링합니다.");
  }

  // 필터링
  const toInsert: Array<{ candidate: CollectedCandidate; row: RawCandidateInsert }> = [];
  const skipped: { reason: string; name: string }[] = [];

  for (const c of allCandidates) {
    // confidence 필터
    if (c.confidenceScore < MIN_CONFIDENCE) {
      skipped.push({ reason: `confidence < ${MIN_CONFIDENCE}`, name: c.candidateName });
      continue;
    }

    // 검증 상태 필터 (검증 결과가 있을 때만)
    if (verificationMap.size > 0) {
      const verification = verificationMap.get(normalizePlaceName(c.candidateName));
      if (!verification) {
        skipped.push({ reason: "검증 결과 없음", name: c.candidateName });
        continue;
      }
      const statusRank = STATUS_RANK[verification.existenceStatus] ?? 0;
      if (statusRank < MIN_STATUS_RANK) {
        skipped.push({
          reason: `status ${verification.existenceStatus} < ${MIN_STATUS_RAW}`,
          name: c.candidateName,
        });
        continue;
      }
    }

    toInsert.push({
      candidate: c,
      row: {
        source_type:        c.sourceType,
        source_keyword:     c.sourceKeyword,
        candidate_name:     c.candidateName,
        candidate_address:  c.candidateAddress ?? null,
        extracted_keywords: c.extractedKeywords,
        confidence_score:   c.confidenceScore,
        review_status:      "pending", // ⚠️ 항상 pending
      },
    });
  }

  console.log(`전체 후보: ${allCandidates.length}개`);
  console.log(`INSERT 대상: ${toInsert.length}개`);
  console.log(`건너뜀: ${skipped.length}개\n`);

  if (DRY_RUN) {
    console.log("[dry-run 모드] DB insert 없이 대상 목록만 출력합니다.\n");
    toInsert.forEach(({ candidate }, i) => {
      const ver = verificationMap.get(normalizePlaceName(candidate.candidateName));
      const statusStr = ver ? ` [${ver.existenceStatus}/${ver.overallMatchScore.toFixed(2)}]` : "";
      console.log(
        `  ${i + 1}. [${candidate.confidenceScore.toFixed(2)}${statusStr}] ${candidate.candidateName}`
      );
      if (candidate.candidateAddress) console.log(`        ${candidate.candidateAddress}`);
    });
    console.log("\n실제 insert를 실행하려면 --dry-run 플래그를 제거하세요.");
    return;
  }

  // Supabase 클라이언트 생성
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 배치 insert (25개 단위)
  const BATCH_SIZE = 25;
  let insertedCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE).map(({ row }) => row);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);
    process.stdout.write(`  배치 ${batchNum}/${totalBatches} (${batch.length}건) insert 중...`);

    const { error, data } = await supabase
      .from("raw_cafe_candidates")
      // candidate_name UNIQUE 제약 기준으로 중복 행은 조용히 건너뜀 (ON CONFLICT DO NOTHING)
      .upsert(batch, { onConflict: "candidate_name", ignoreDuplicates: true })
      .select("id");

    if (error) {
      errorCount += batch.length;
      process.stdout.write(` ⚠️ 오류: ${error.message}\n`);
    } else {
      const inserted = (data ?? []).length;
      const skippedDups = batch.length - inserted;
      insertedCount += inserted;
      duplicateCount += skippedDups;
      process.stdout.write(
        ` ✅ ${inserted}건 완료${skippedDups > 0 ? `, ${skippedDups}건 중복 건너뜀` : ""}\n`
      );
    }
  }

  console.log(`\n=== INSERT 완료 ===`);
  console.log(`성공: ${insertedCount}건`);
  if (duplicateCount > 0) console.log(`중복 건너뜀: ${duplicateCount}건`);
  if (errorCount > 0)     console.log(`⚠️  오류: ${errorCount}건`);
  console.log(`\n다음 단계: Supabase 대시보드 → raw_cafe_candidates 테이블에서 운영자 검수를 진행하세요.`);
  console.log(`           review_status = 'pending' 항목만 검수 대기 중입니다.`);
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
