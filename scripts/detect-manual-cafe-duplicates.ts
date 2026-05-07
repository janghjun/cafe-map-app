#!/usr/bin/env node
/**
 * 수동 수집 카페와 기존 mock 데이터 중복 여부 탐지 스크립트
 *
 * 사용법:
 *   npx tsx scripts/detect-manual-cafe-duplicates.ts
 *
 * 출력:
 *   data/manual/manual-cafe-duplicate-report.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MOCK_CAFES } from "../src/data/cafes.mock.ts";
import { calculateNameSimilarity } from "../src/utils/placeMatch.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const INPUT_FILE = resolve(ROOT, "data/manual/normalized-manual-kagong-cafes.json");
const OUTPUT_DIR = resolve(ROOT, "data/manual");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "manual-cafe-duplicate-report.json");

type NormalizedRecord = {
  manualId: string;
  name: string;
  district: string | null;
  [key: string]: unknown;
};

type NormalizedDataset = {
  records: NormalizedRecord[];
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

console.log(`\n📂 입력 파일: ${INPUT_FILE}`);

let dataset: NormalizedDataset;
try {
  dataset = JSON.parse(readFileSync(INPUT_FILE, "utf-8")) as NormalizedDataset;
} catch (e) {
  console.error(`❌ 파일 읽기 실패: ${INPUT_FILE}`);
  console.error(e);
  process.exit(1);
}

const records = dataset.records ?? [];
console.log(`✅ 수동 수집 레코드: ${records.length}개`);
console.log(`✅ 기존 mock 카페:   ${MOCK_CAFES.length}개`);

const report: DuplicateEntry[] = [];

for (const manual of records) {
  let bestScore = 0;
  let bestMatch: (typeof MOCK_CAFES)[0] | null = null;

  for (const existing of MOCK_CAFES) {
    const nameSim = calculateNameSimilarity(manual.name, existing.name);
    if (nameSim < 0.45) continue;

    const districtMatch =
      !manual.district ||
      !existing.district ||
      manual.district === existing.district;

    if (!districtMatch) continue;

    if (nameSim > bestScore) {
      bestScore = nameSim;
      bestMatch = existing;
    }
  }

  let entry: DuplicateEntry;

  if (bestScore >= 0.75 && bestMatch) {
    entry = {
      manualId: manual.manualId,
      manualName: manual.name,
      duplicateStatus: "duplicate_candidate",
      matchedCafeId: bestMatch.id,
      matchedCafeName: bestMatch.name,
      reason: `이름 유사도 ${(bestScore * 100).toFixed(1)}% — 동일 카페로 판단`,
      confidence: parseFloat(bestScore.toFixed(4)),
    };
  } else if (bestScore >= 0.45 && bestMatch) {
    entry = {
      manualId: manual.manualId,
      manualName: manual.name,
      duplicateStatus: "ambiguous",
      matchedCafeId: bestMatch.id,
      matchedCafeName: bestMatch.name,
      reason: `이름 유사도 ${(bestScore * 100).toFixed(1)}% — 유사하나 확정 불가, 운영자 확인 필요`,
      confidence: parseFloat(bestScore.toFixed(4)),
    };
  } else {
    entry = {
      manualId: manual.manualId,
      manualName: manual.name,
      duplicateStatus: "new_candidate",
      reason: bestScore > 0
        ? `최대 유사도 ${(bestScore * 100).toFixed(1)}% — 신규 후보`
        : "일치 후보 없음 — 신규 후보",
      confidence: parseFloat(bestScore.toFixed(4)),
    };
  }

  report.push(entry);
}

const countNew = report.filter((r) => r.duplicateStatus === "new_candidate").length;
const countDuplicate = report.filter((r) => r.duplicateStatus === "duplicate_candidate").length;
const countAmbiguous = report.filter((r) => r.duplicateStatus === "ambiguous").length;

mkdirSync(OUTPUT_DIR, { recursive: true });

writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    {
      meta: {
        generatedAt: new Date().toISOString(),
        totalManual: records.length,
        newCandidates: countNew,
        duplicateCandidates: countDuplicate,
        ambiguous: countAmbiguous,
      },
      report,
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`\n📋 중복 탐지 결과`);
console.log(`  신규 후보:     ${countNew}개`);
console.log(`  중복 후보:     ${countDuplicate}개`);
console.log(`  모호 (검토 필요): ${countAmbiguous}개`);
console.log(`  출력: ${OUTPUT_FILE}`);
console.log("");
