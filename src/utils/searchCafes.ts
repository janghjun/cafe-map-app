import type { Cafe } from "../types/cafe";

const TAG_KO: Record<string, string> = {
  quiet: "조용",
  talkable: "대화",
  outlet: "콘센트",
  wifi: "와이파이",
  late_open: "늦은",
  "24hours": "24시간",
  coffee: "커피",
  dessert: "디저트",
  solo: "1인",
  group: "그룹",
};

export function searchCafes(cafes: Cafe[], query: string): Cafe[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return cafes
    .filter((c) => c.status === "active")
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.dong.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some(
          (t) => t.toLowerCase().includes(q) || (TAG_KO[t] ?? "").includes(q)
        )
    );
}
