#!/usr/bin/env node
/**
 * collect-cafe-data.ts 출력 JSON을 Supabase cafes 테이블에 직접 적재합니다.
 *
 * raw_cafe_candidates 경유 없이 cafes 테이블에 바로 INSERT합니다.
 * 모든 레코드는 verification_status='verified_basic', status='active' 로 적재됩니다.
 *
 * 사용법:
 *   npx tsx scripts/insert-seed-cafes.ts --input <path.json>
 *   npx tsx scripts/insert-seed-cafes.ts --input <path.json> --dry-run
 *
 * 옵션:
 *   --input <path>    collect-cafe-data.ts 출력 JSON 파일 (필수)
 *   --dry-run         Supabase INSERT 없이 첫 5건만 미리보기
 *   --batch <n>       배치 크기 (기본값: 50)
 *
 * 환경 변수:
 *   SUPABASE_URL             (VITE_ 접두사 없는 서버 사이드 키)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * ⚠️ SERVICE_ROLE_KEY를 절대 클라이언트 코드에 노출하지 마세요.
 * ⚠️ 기존 동일 이름+구 카페와 충돌 시 skip합니다 (upsert ignoreDuplicates).
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { CollectedCafeData } from "./collect-cafe-data.ts";

// ──────────────────────────────────────────────────────────────
// CLI 인자
// ──────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const INPUT_FILE = (() => { const i = args.indexOf("--input"); return i !== -1 ? args[i + 1] : null; })();
const DRY_RUN    = args.includes("--dry-run");
const BATCH_SIZE = parseInt((() => { const i = args.indexOf("--batch"); return i !== -1 ? args[i + 1] : "50"; })(), 10);

if (!INPUT_FILE) {
  console.error("❌ --input <file> 옵션이 필요합니다.");
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────
// 환경 변수
// ──────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) { console.error(`❌ 환경 변수 '${key}' 미설정`); process.exit(1); }
  return val;
}

// ──────────────────────────────────────────────────────────────
// Supabase 행 변환
// ──────────────────────────────────────────────────────────────

type CafeRow = {
  id: string;
  name: string;
  district: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  summary: string;
  open_hours_summary: string;
  is_24_hours: boolean;
  naver_map_url: string | null;
  status: string;
  verification_status: string;
  verification_sources: object;
  curator_note: string;
  created_at: string;
  updated_at: string;
};

type AttributeRow = {
  cafe_id: string;
  quiet_score: number;
  solo_score: number;
  group_score: number;
  outlet_score: number;
  wifi_score: number;
  stay_score: number;
  coffee_score: number;
  dessert_score: number;
  late_open_score: number;
  space_score: number;
  seat_score: number;
  group_seat_score: number;
};

type TagRow = { cafe_id: string; tag: string };

function toCafeRow(c: CollectedCafeData): CafeRow {
  return {
    id:                   c.id,
    name:                 c.name,
    district:             c.district,
    dong:                 c.dong,
    address:              c.address,
    lat:                  c.lat,
    lng:                  c.lng,
    phone:                c.phone ?? null,
    summary:              c.summary,
    open_hours_summary:   c.openHoursSummary,
    is_24_hours:          c.is24Hours,
    naver_map_url:        c.naverMapUrl ?? null,
    status:               c.status,
    verification_status:  c.verificationStatus,
    verification_sources: c.verificationSources,
    curator_note:         c.curatorNote,
    created_at:           c.createdAt,
    updated_at:           c.updatedAt,
  };
}

function toAttributeRow(c: CollectedCafeData): AttributeRow {
  const a = c.attributes;
  return {
    cafe_id:         c.id,
    quiet_score:     a.quietScore,
    solo_score:      a.soloScore,
    group_score:     a.groupScore,
    outlet_score:    a.outletScore,
    wifi_score:      a.wifiScore,
    stay_score:      a.stayScore,
    coffee_score:    a.coffeeScore,
    dessert_score:   a.dessertScore,
    late_open_score: a.lateOpenScore,
    space_score:     a.spaceScore,
    seat_score:      a.seatScore,
    group_seat_score: a.groupSeatScore,
  };
}

function toTagRows(c: CollectedCafeData): TagRow[] {
  return c.tags.map((tag) => ({ cafe_id: c.id, tag }));
}

// ──────────────────────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────────────────────

async function main() {
  // 입력 파일 로드
  let cafes: CollectedCafeData[];
  try {
    const raw = readFileSync(INPUT_FILE!, "utf-8");
    const parsed = JSON.parse(raw) as { cafes: CollectedCafeData[] };
    cafes = parsed.cafes;
  } catch (err) {
    console.error(`❌ 입력 파일 읽기 실패: ${INPUT_FILE}`);
    console.error(String(err));
    process.exit(1);
  }

  console.log(`=== Supabase cafes 적재 ===`);
  console.log(`총 ${cafes.length}개 카페 적재 예정\n`);

  if (DRY_RUN) {
    console.log("[dry-run] 첫 5개 미리보기:\n");
    cafes.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.district}] ${c.name}`);
      console.log(`     주소: ${c.address}`);
      console.log(`     좌표: ${c.lat}, ${c.lng}`);
      console.log(`     태그: ${c.tags.join(", ") || "(없음)"}`);
      console.log(`     전화: ${c.phone ?? "(없음)"}`);
    });
    console.log("\n실제 적재: --dry-run 제거 후 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정 필요");
    return;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey  = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase    = createClient(supabaseUrl, serviceKey);

  let insertedCafes  = 0;
  let insertedAttrs  = 0;
  let insertedTags   = 0;
  let skipped        = 0;

  // cafes 테이블에 배치 upsert
  for (let i = 0; i < cafes.length; i += BATCH_SIZE) {
    const batch       = cafes.slice(i, i + BATCH_SIZE);
    const cafeRows    = batch.map(toCafeRow);
    const attrRows    = batch.map(toAttributeRow);
    const tagRows     = batch.flatMap(toTagRows);

    process.stdout.write(`[${i + 1}~${Math.min(i + BATCH_SIZE, cafes.length)}/${cafes.length}] cafes...`);

    // cafes INSERT — id 충돌 시 skip
    const { data: cafeData, error: cafeErr } = await supabase
      .from("cafes")
      .upsert(cafeRows, { onConflict: "id", ignoreDuplicates: true })
      .select("id");
    if (cafeErr) {
      console.error(`\n  ❌ cafes insert 오류: ${cafeErr.message}`);
      continue;
    }
    const batchInserted = (cafeData ?? []).length;
    const batchSkipped  = batch.length - batchInserted;
    insertedCafes += batchInserted;
    skipped       += batchSkipped;

    // 성공 insert된 cafe_id만 attributes/tags 적재
    const insertedIds = new Set((cafeData ?? []).map((r: { id: string }) => r.id));
    const filteredAttrRows = attrRows.filter((r) => insertedIds.has(r.cafe_id));
    const filteredTagRows  = tagRows.filter((r) => insertedIds.has(r.cafe_id));

    if (filteredAttrRows.length > 0) {
      const { error: attrErr } = await supabase
        .from("cafe_attributes")
        .upsert(filteredAttrRows, { onConflict: "cafe_id", ignoreDuplicates: true });
      if (attrErr) console.warn(`\n  ⚠️ attributes 오류: ${attrErr.message}`);
      else insertedAttrs += filteredAttrRows.length;
    }

    if (filteredTagRows.length > 0) {
      const { error: tagErr } = await supabase
        .from("cafe_tags")
        .upsert(filteredTagRows, { onConflict: "cafe_id,tag", ignoreDuplicates: true });
      if (tagErr) console.warn(`\n  ⚠️ tags 오류: ${tagErr.message}`);
      else insertedTags += filteredTagRows.length;
    }

    process.stdout.write(` ✅ +${batchInserted} (skip ${batchSkipped})\n`);
  }

  console.log(`\n=== 적재 완료 ===`);
  console.log(`cafes:      ${insertedCafes}개 INSERT, ${skipped}개 skip`);
  console.log(`attributes: ${insertedAttrs}개`);
  console.log(`tags:       ${insertedTags}개`);
  console.log(`\n⚠️  모든 카페는 verification_status='verified_basic' 상태입니다.`);
  console.log("   ?mode=admin 관리자 화면에서 속성(quietScore 등)을 직접 검수해 주세요.");
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
