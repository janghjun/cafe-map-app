#!/usr/bin/env node
/**
 * 검증된 수동 수집 카페를 Cafe 시드 후보로 변환하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/convert-manual-to-cafe-seed.ts
 *
 * - verified_basic 상태인 레코드만 처리합니다.
 * - status: "pending" (active 아님)
 * - rawReviewMemo, sourceScore, sourceRating, sourceReviewCount 는 포함하지 않습니다.
 *
 * 출력:
 *   data/manual/manual-cafe-seed-candidates.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { Cafe, CafeTag, CafeAttributes } from "../src/types/cafe.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const INPUT_FILE = resolve(ROOT, "data/manual/verified-manual-kagong-cafes.json");
const OUTPUT_DIR = resolve(ROOT, "data/manual");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "manual-cafe-seed-candidates.json");

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
  suggestedTags: string[];
  priority: "high" | "normal" | "low";
  studySignals: string[];
  // rawReviewMemo, sourceScore, sourceRating, sourceReviewCount 는 seed에 포함하지 않음
};

type VerifiedDataset = {
  records: VerifiedRecord[];
};

type SeedCandidate = Cafe & {
  manualBoostEligible: boolean;
  manualSourceId: string;
  manualPriority: "high" | "normal" | "low";
  studySignals: string[];
  suggestedTags: string[];
};

const ALLOWED_TAGS: Set<string> = new Set([
  "quiet", "talkable", "outlet", "wifi", "late_open", "24hours", "coffee", "dessert", "solo", "group",
]);

function mapSuggestedTagsToCafeTags(suggestedTags: string[]): CafeTag[] {
  return suggestedTags
    .map((t) => t.toLowerCase().trim())
    .filter((t): t is CafeTag => ALLOWED_TAGS.has(t));
}

function buildAttributes(scores: VerifiedRecord["suggestedScores"]): CafeAttributes {
  return {
    quietScore: scores.quietScore,
    soloScore: scores.soloScore,
    groupScore: scores.groupScore,
    outletScore: scores.outletScore,
    wifiScore: scores.wifiScore,
    stayScore: scores.stayScore,
    coffeeScore: scores.coffeeScore,
    dessertScore: scores.dessertScore,
    lateOpenScore: scores.lateOpenScore,
    spaceScore: 3,
    seatScore: 3,
    groupSeatScore: scores.groupSeatScore,
  };
}

function convertCoords(mapx: string | null, mapy: string | null): { lat: number; lng: number } {
  if (!mapx || !mapy) return { lat: 0, lng: 0 };
  const lat = parseInt(mapy, 10) / 1e7;
  const lng = parseInt(mapx, 10) / 1e7;
  if (isNaN(lat) || isNaN(lng)) return { lat: 0, lng: 0 };
  return { lat, lng };
}

// ────────────────────────────────────────────────────────────
// main
// ────────────────────────────────────────────────────────────

console.log(`\n📂 입력 파일: ${INPUT_FILE}`);

let dataset: VerifiedDataset;
try {
  dataset = JSON.parse(readFileSync(INPUT_FILE, "utf-8")) as VerifiedDataset;
} catch (e) {
  console.error(`❌ 파일 읽기 실패: ${INPUT_FILE}`);
  console.error(e);
  process.exit(1);
}

const records = dataset.records ?? [];
const eligible = records.filter((r) => r.verificationStatus === "verified_basic");

console.log(`✅ 전체 레코드: ${records.length}개`);
console.log(`✅ verified_basic (변환 대상): ${eligible.length}개`);
console.log(`   건너뜀: ${records.length - eligible.length}개`);

const now = new Date().toISOString();
const seeds: SeedCandidate[] = [];

for (const rec of eligible) {
  const { lat, lng } = convertCoords(rec.mapx, rec.mapy);

  const name = rec.verifiedName ?? rec.name;
  const address =
    rec.verifiedRoadAddress ??
    rec.verifiedAddress ??
    "";

  const tags = mapSuggestedTagsToCafeTags(rec.suggestedTags);
  const attributes = buildAttributes(rec.suggestedScores);

  const seed: SeedCandidate = {
    id: `manual-seed-${rec.manualId}`,
    name,
    district: "",
    dong: "",
    address,
    lat,
    lng,
    summary: rec.operatorSummaryDraft,
    is24Hours: false,
    status: "pending",
    tags,
    attributes,
    createdAt: now,
    updatedAt: now,
    verificationStatus: "verified_basic",
    manualBoostEligible: true,
    manualSourceId: rec.manualId,
    manualPriority: rec.priority,
    studySignals: rec.studySignals,
    suggestedTags: rec.suggestedTags,
  };

  seeds.push(seed);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    {
      meta: {
        convertedAt: now,
        totalVerified: eligible.length,
        seedCount: seeds.length,
        policyNote:
          "status=pending 상태. 운영자 검수 후 active + curated로 승격. rawReviewMemo/sourceScore/sourceRating/sourceReviewCount 미포함.",
      },
      seeds,
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`\n📋 변환 결과`);
console.log(`  시드 후보 생성: ${seeds.length}개`);
console.log(`  출력: ${OUTPUT_FILE}`);
console.log("");
