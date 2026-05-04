import type { Cafe } from "../types/cafe";

const NAVER_MAP_SEARCH = "https://map.naver.com/v5/search";

// 카페명만으로 검색 — 전체 주소를 포함하면 Naver 검색 실패 사례가 있어 이름 단독 사용
export function getCafeMapUrl(cafe: Cafe): string {
  return `${NAVER_MAP_SEARCH}/${encodeURIComponent(cafe.name)}`;
}
