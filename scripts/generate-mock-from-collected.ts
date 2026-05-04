#!/usr/bin/env node
/**
 * data/incheon-cafes-raw.json → src/data/cafes.mock.ts 변환 스크립트
 *
 * 수집된 실제 인천 카페 데이터를 mock 데이터로 교체합니다.
 * Supabase 없이도 앱에서 실제 데이터를 사용할 수 있도록 합니다.
 *
 * 사용법:
 *   npx tsx scripts/generate-mock-from-collected.ts
 *   npx tsx scripts/generate-mock-from-collected.ts --input data/incheon-cafes-raw.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CollectedCafeData } from "./collect-cafe-data.ts";

const args = process.argv.slice(2);
const INPUT_FILE = (() => {
  const i = args.indexOf("--input");
  return i !== -1 ? args[i + 1] : "data/incheon-cafes-raw.json";
})();
const OUTPUT_FILE = "src/data/cafes.mock.ts";

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

  if (c.phone) {
    lines.push(`    phone: "${c.phone}",`);
  }

  lines.push(
    `    summary: ${JSON.stringify(c.summary)},`,
    `    openHoursSummary: ${JSON.stringify(c.openHoursSummary)},`,
    `    is24Hours: ${c.is24Hours},`,
  );

  if (c.naverMapUrl) {
    lines.push(`    naverMapUrl: ${JSON.stringify(c.naverMapUrl)},`);
  }

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

const inputPath = resolve(INPUT_FILE);
const raw = readFileSync(inputPath, "utf-8");
const parsed = JSON.parse(raw) as { cafes: CollectedCafeData[]; collectedAt: string };
const cafes = parsed.cafes;

console.log(`입력: ${inputPath}`);
console.log(`카페 수: ${cafes.length}개`);

const cafeBlocks = cafes.map(cafeToTs).join("\n");

const output = `// 실제 수집된 인천 카공 카페 데이터 (Naver Local API 기반)
// 수집일: ${parsed.collectedAt}
// 총 ${cafes.length}개 카페 — 운영자 속성 검수 전 기본값(3/5) 사용
// Supabase 연결 전까지 추천 로직 및 UI 개발에 사용합니다.

import type { Cafe } from "../types/cafe";

export const MOCK_CAFES: Cafe[] = [
${cafeBlocks}
];
`;

writeFileSync(resolve(OUTPUT_FILE), output, "utf-8");
console.log(`출력: ${OUTPUT_FILE}`);
console.log("✅ 완료");
