#!/usr/bin/env node
/**
 * 수동 수집 카페 시드를 기존 mock 데이터와 병합하는 계획을 생성합니다.
 *
 * 사용법:
 *   npx tsx scripts/plan-manual-cafe-merge.ts
 *
 * 출력:
 *   data/manual/manual-cafe-merge-plan.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MOCK_CAFES } from "../src/data/cafes.mock.ts";
import type { Cafe } from "../src/types/cafe.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SEED_FILE = resolve(ROOT, "data/manual/manual-cafe-seed-candidates.json");
const DUPLICATE_FILE = resolve(ROOT, "data/manual/manual-cafe-duplicate-report.json");
const OUTPUT_DIR = resolve(ROOT, "data/manual");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "manual-cafe-merge-plan.json");

type SeedCandidate = Cafe & {
  manualBoostEligible: boolean;
  manualSourceId: string;
  manualPriority: "high" | "normal" | "low";
  studySignals?: string[];
  suggestedTags?: string[];
};

type SeedDataset = {
  seeds: SeedCandidate[];
};

type DuplicateEntry = {
  manualId: string;
  manualName: string;
  duplicateStatus: "duplicate_candidate" | "ambiguous" | "new_candidate";
  matchedCafeId?: string;
  matchedCafeName?: string;
  reason: string;
  confidence: number;
};

type DuplicateReport = {
  report: DuplicateEntry[];
};

type AddAction = {
  action: "add";
  seed: SeedCandidate;
  reason: string;
};

type UpdateAction = {
  action: "update";
  matchedCafeId: string;
  matchedCafeName: string;
  manualId: string;
  changes: {
    summary?: string;
    suggestedScores?: Record<string, number>;
    studySignals?: string[];
    suggestedTags?: string[];
    manualBoostEligible?: boolean;
    manualPriority?: string;
    manualSourceId?: string;
  };
  reason: string;
};

type SkipAction = {
  action: "skip";
  manualId: string;
  manualName: string;
  reason: string;
};

type MergePlan = {
  add: AddAction[];
  update: UpdateAction[];
  skip: SkipAction[];
};

// ────────────────────────────────────────────────────────────
// main
// ────────────────────────────────────────────────────────────

console.log(`\n📂 시드 파일: ${SEED_FILE}`);
console.log(`📂 중복 리포트: ${DUPLICATE_FILE}`);

let seedDataset: SeedDataset;
try {
  seedDataset = JSON.parse(readFileSync(SEED_FILE, "utf-8")) as SeedDataset;
} catch (e) {
  console.error(`❌ 파일 읽기 실패: ${SEED_FILE}`);
  console.error(e);
  process.exit(1);
}

let duplicateReport: DuplicateReport;
try {
  duplicateReport = JSON.parse(readFileSync(DUPLICATE_FILE, "utf-8")) as DuplicateReport;
} catch (e) {
  console.error(`❌ 파일 읽기 실패: ${DUPLICATE_FILE}`);
  console.error(e);
  process.exit(1);
}

const seeds = seedDataset.seeds ?? [];
const reportMap = new Map<string, DuplicateEntry>(
  (duplicateReport.report ?? []).map((r) => [r.manualId, r])
);

const existingCafeMap = new Map<string, Cafe>(MOCK_CAFES.map((c) => [c.id, c]));

const plan: MergePlan = { add: [], update: [], skip: [] };

for (const seed of seeds) {
  const manualId = seed.manualSourceId;
  const dupEntry = reportMap.get(manualId);

  if (!dupEntry) {
    // 중복 리포트에 없는 시드 → 신규 추가
    plan.add.push({
      action: "add",
      seed,
      reason: "중복 리포트 미포함 — 신규 추가 대상",
    });
    continue;
  }

  if (dupEntry.duplicateStatus === "new_candidate") {
    plan.add.push({
      action: "add",
      seed,
      reason: dupEntry.reason,
    });
  } else if (dupEntry.duplicateStatus === "duplicate_candidate") {
    const matchedId = dupEntry.matchedCafeId;
    if (!matchedId) {
      plan.skip.push({
        action: "skip",
        manualId,
        manualName: seed.name,
        reason: "duplicate_candidate 이지만 matchedCafeId 없음 — 수동 확인 필요",
      });
      continue;
    }

    const existing = existingCafeMap.get(matchedId);
    if (existing?.verificationStatus === "curated") {
      plan.skip.push({
        action: "skip",
        manualId,
        manualName: seed.name,
        reason: `기존 카페(${matchedId})가 curated 상태 — 수동 검수 필요`,
      });
      continue;
    }

    const priorityReason =
      seed.manualPriority === "high"
        ? "우선 검수 필요 (high priority)"
        : dupEntry.reason;

    plan.update.push({
      action: "update",
      matchedCafeId: matchedId,
      matchedCafeName: dupEntry.matchedCafeName ?? "",
      manualId,
      changes: {
        summary: seed.summary || undefined,
        suggestedScores: seed.attributes as unknown as Record<string, number>,
        studySignals: seed.studySignals,
        suggestedTags: seed.suggestedTags,
        manualBoostEligible: true,
        manualPriority: seed.manualPriority,
        manualSourceId: manualId,
      },
      reason: priorityReason,
    });
  } else if (dupEntry.duplicateStatus === "ambiguous") {
    plan.skip.push({
      action: "skip",
      manualId,
      manualName: seed.name,
      reason: `모호한 중복 (${dupEntry.reason}) — 운영자 직접 확인 필요`,
    });
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const now = new Date().toISOString();

writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    {
      meta: {
        generatedAt: now,
        totalSeeds: seeds.length,
        addCount: plan.add.length,
        updateCount: plan.update.length,
        skipCount: plan.skip.length,
        policyNote:
          "update 적용 시 기존 카페 status/verificationStatus를 직접 변경하지 마세요. 운영자 수동 검토 후 반영하세요.",
      },
      plan,
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`\n📋 병합 계획 결과`);
console.log(`  add    (신규 추가):  ${plan.add.length}개`);
console.log(`  update (기존 업데이트): ${plan.update.length}개`);
console.log(`  skip   (건너뜀):    ${plan.skip.length}개`);
console.log(`  출력: ${OUTPUT_FILE}`);
console.log("");
