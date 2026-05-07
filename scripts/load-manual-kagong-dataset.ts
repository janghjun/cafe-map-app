#!/usr/bin/env node
/**
 * 수동 수집 카공 카페 데이터셋 로더
 *
 * 사용법:
 *   npx tsx scripts/load-manual-kagong-dataset.ts [--input <path>]
 *
 * 출력:
 *   data/manual/normalized-manual-kagong-cafes.json
 *   data/manual/manual-kagong-invalid-records.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ManualKagongCafeDataset, ManualKagongCafeRecord } from "../src/types/manualCafeDataset.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

const INPUT_FILE = getArg("--input") ?? "incheon-kagong-manual-dataset.json";
const INPUT_PATH = resolve(ROOT, INPUT_FILE);
const OUTPUT_DIR = resolve(ROOT, "data/manual");
const OUTPUT_NORMALIZED = resolve(OUTPUT_DIR, "normalized-manual-kagong-cafes.json");
const OUTPUT_INVALID = resolve(OUTPUT_DIR, "manual-kagong-invalid-records.json");

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

type InvalidRecord = {
  rawId: string | null;
  rawName: string | null;
  reason: string;
};

function normalizePriority(p: string | undefined): "high" | "normal" | "low" {
  if (p === "high" || p === "normal" || p === "low") return p;
  return "normal";
}

function normalizeScore(v: number | null | undefined): number {
  if (v == null || isNaN(v)) return 3;
  return Math.min(5, Math.max(0, v));
}

let genCounter = 1;
function generateId(): string {
  return `manual-gen-${String(genCounter++).padStart(4, "0")}`;
}

function normalizeRecord(
  raw: ManualKagongCafeRecord,
  index: number
): { ok: true; record: NormalizedRecord } | { ok: false; reason: string } {
  const rawName = (raw.name ?? "").trim();
  if (!rawName) {
    return { ok: false, reason: `record[${index}] name이 비어있습니다.` };
  }

  const manualId =
    raw.id && raw.id.trim() ? raw.id.trim() : generateId();

  const suggestedScores: NormalizedRecord["suggestedScores"] = {
    quietScore:    normalizeScore(raw.suggestedScores?.quietScore),
    outletScore:   normalizeScore(raw.suggestedScores?.outletScore),
    wifiScore:     normalizeScore(raw.suggestedScores?.wifiScore),
    stayScore:     normalizeScore(raw.suggestedScores?.stayScore),
    soloScore:     normalizeScore(raw.suggestedScores?.soloScore),
    groupScore:    normalizeScore(raw.suggestedScores?.groupScore),
    groupSeatScore: normalizeScore(raw.suggestedScores?.groupSeatScore),
    coffeeScore:   normalizeScore(raw.suggestedScores?.coffeeScore),
    dessertScore:  normalizeScore(raw.suggestedScores?.dessertScore),
    lateOpenScore: normalizeScore(raw.suggestedScores?.lateOpenScore),
  };

  const record: NormalizedRecord = {
    manualId,
    name: rawName,
    district: raw.district?.trim() ?? null,
    dong: raw.dong?.trim() ?? null,
    addressHint: raw.addressHint?.trim() ?? null,
    areaGroup: raw.areaGroup?.trim() ?? null,
    operatorSummaryDraft: (raw.operatorSummaryDraft ?? "").trim(),
    rawReviewMemo: (raw.rawReviewMemo ?? "").trim(), // APP_EXPOSURE_FORBIDDEN
    sourceScore: raw.sourceScore ?? null, // APP_EXPOSURE_FORBIDDEN
    sourceRating: raw.sourceRating ?? null, // APP_EXPOSURE_FORBIDDEN
    sourceReviewCount: raw.sourceReviewCount ?? null, // APP_EXPOSURE_FORBIDDEN
    sourceTags: raw.sourceTags ?? [],
    studySignals: raw.studySignals ?? [],
    suggestedTags: raw.suggestedTags ?? [],
    suggestedScores,
    priority: normalizePriority(
      typeof raw.priority === "string" ? raw.priority : undefined
    ),
    sourceType: "manual_text",
    reviewStatus: "pending",
    verificationStatus: "needs_check",
  };

  return { ok: true, record };
}

// ────────────────────────────────────────────────────────────
// main
// ────────────────────────────────────────────────────────────

console.log(`\n📂 입력 파일: ${INPUT_PATH}`);

let raw: ManualKagongCafeDataset;
try {
  const content = readFileSync(INPUT_PATH, "utf-8");
  raw = JSON.parse(content) as ManualKagongCafeDataset;
} catch (e) {
  console.error(`❌ 파일 읽기 실패: ${INPUT_PATH}`);
  console.error(e);
  process.exit(1);
}

const records = raw.records ?? [];
console.log(`✅ 총 ${records.length}개 레코드 로드`);

const normalized: NormalizedRecord[] = [];
const invalid: InvalidRecord[] = [];

for (let i = 0; i < records.length; i++) {
  const result = normalizeRecord(records[i], i);
  if (result.ok) {
    normalized.push(result.record);
  } else {
    invalid.push({
      rawId: records[i].id ?? null,
      rawName: records[i].name ?? null,
      reason: result.reason,
    });
    console.warn(`  ⚠️ [${i}] 유효하지 않은 레코드: ${result.reason}`);
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });

writeFileSync(
  OUTPUT_NORMALIZED,
  JSON.stringify(
    {
      meta: {
        source: INPUT_FILE,
        normalizedAt: new Date().toISOString(),
        totalInput: records.length,
        validCount: normalized.length,
        invalidCount: invalid.length,
        policyNote:
          "rawReviewMemo, sourceScore, sourceRating, sourceReviewCount 는 앱 노출 금지 (APP_EXPOSURE_FORBIDDEN)",
      },
      records: normalized,
    },
    null,
    2
  ),
  "utf-8"
);

writeFileSync(
  OUTPUT_INVALID,
  JSON.stringify({ invalidRecords: invalid }, null, 2),
  "utf-8"
);

console.log(`\n📋 결과 요약`);
console.log(`  유효: ${normalized.length}개`);
console.log(`  무효: ${invalid.length}개`);
console.log(`  출력: ${OUTPUT_NORMALIZED}`);
console.log(`  무효 목록: ${OUTPUT_INVALID}`);
console.log("");
