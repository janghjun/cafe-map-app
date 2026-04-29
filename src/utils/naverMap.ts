import type { Cafe } from "../types/cafe";

const NAVER_MAP_SEARCH = "https://map.naver.com/v5/search";

export function createNaverMapSearchUrl(cafeName: string, address?: string): string {
  const query = address ? `${cafeName} ${address}` : cafeName;
  return `${NAVER_MAP_SEARCH}/${encodeURIComponent(query)}`;
}

// cafe.naverMapUrl이 있으면 그대로 사용하고, 없으면 이름+주소로 검색 URL을 생성합니다.
export function getCafeMapUrl(cafe: Cafe): string {
  if (cafe.naverMapUrl) return cafe.naverMapUrl;
  return createNaverMapSearchUrl(cafe.name, cafe.address);
}
