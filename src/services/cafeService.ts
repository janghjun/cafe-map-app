import type { Cafe } from "../types/cafe";
import { MOCK_CAFES } from "../data/cafes.mock";

// 향후 Supabase 전환 시 이 파일만 수정하면 됩니다.
// 교체 예시:
//   import { supabase } from "./supabaseClient";
//   export async function getCafes(): Promise<Cafe[]> {
//     const { data } = await supabase.from("cafes").select("*, cafe_attributes(*), cafe_tags(tag)");
//     return data ?? [];
//   }

export function getCafes(): Cafe[] {
  return MOCK_CAFES;
}

export function getCafeById(id: string): Cafe | undefined {
  return MOCK_CAFES.find((c) => c.id === id);
}

export function getCafesByDistrict(district: string, dong?: string): Cafe[] {
  return MOCK_CAFES.filter(
    (c) =>
      c.status === "active" &&
      c.district === district &&
      (dong === undefined || c.dong === dong)
  );
}
