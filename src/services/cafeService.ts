import type { Cafe } from "../types/cafe";
import { MOCK_CAFES } from "../data/cafes.mock";
import { isSupabaseConfigured, getSupabaseClient } from "./supabaseClient";
import { mapCafeRow, type CafeRow } from "./cafeMapper";

const SUPABASE_SELECT =
  "*, cafe_attributes(*), cafe_tags(tag)";

const dataSource = import.meta.env.VITE_DATA_SOURCE as string | undefined;
const useSupabase = dataSource === "supabase" && isSupabaseConfigured();

// In-memory cache — cleared on page reload
let _cache: Cafe[] | null = null;

async function fetchFromSupabase(): Promise<Cafe[]> {
  const { data, error } = await getSupabaseClient()
    .from("cafes")
    .select(SUPABASE_SELECT)
    .eq("status", "active");

  if (error) throw new Error(`Supabase 카페 조회 실패: ${error.message}`);
  return (data as CafeRow[]).map(mapCafeRow);
}

export async function getCafes(): Promise<Cafe[]> {
  if (!useSupabase) return MOCK_CAFES;
  if (_cache) return _cache;
  _cache = await fetchFromSupabase();
  return _cache;
}

export async function getCafeById(id: string): Promise<Cafe | undefined> {
  const cafes = await getCafes();
  return cafes.find((c) => c.id === id);
}

export async function getCafesByDistrict(
  district: string,
  dong?: string
): Promise<Cafe[]> {
  const cafes = await getCafes();
  return cafes.filter(
    (c) =>
      c.status === "active" &&
      c.district === district &&
      (dong === undefined || c.dong === dong)
  );
}

/** 동기적으로 전체 카페를 반환합니다 (추천 로직 등 동기 컨텍스트용).
 *  Supabase 모드에서는 initCafeService() 이후에 캐시가 채워집니다. */
export function getCafesSync(): Cafe[] {
  if (useSupabase && _cache) return _cache;
  if (useSupabase) {
    // 캐시 미스: 빈 배열 반환. App 마운트 시 initCafeService()가 채워줍니다.
    return [];
  }
  return MOCK_CAFES;
}

/** App 마운트 시 1회 호출해 Supabase 모드의 캐시를 미리 채웁니다.
 *  mock 모드에서는 무동작입니다. */
export async function initCafeService(): Promise<void> {
  if (!useSupabase) return;
  await getCafes();
}

/** 항상 유효한 활성 카페 수를 반환합니다.
 *  Supabase 캐시가 비어있으면 MOCK_CAFES 기준으로 폴백합니다. */
export function getCafeCount(): number {
  const source = (_cache && _cache.length > 0) ? _cache : MOCK_CAFES;
  return source.filter((c) => c.status === "active").length;
}
