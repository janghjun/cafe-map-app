import type { Cafe, UserPreference, RecommendationResult } from "../types/cafe";
import { calculateDistanceKm, isWithinRadius } from "./distance";
import type { Coords } from "./distance";
import { buildRecommendationReasons } from "./recommendationReason";

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 5;

// CLAUDE.md §9.1 가중치 기준 (총 100점)
export function scoreCafeByPreference(
  cafe: Cafe,
  preference: UserPreference,
  distanceKm: number
): number {
  const a = cafe.attributes;
  let score = 0;

  // 거리 적합도 (30): 반경 대비 거리 비율이 낮을수록 높은 점수
  score += (1 - Math.min(distanceKm / preference.radius, 1)) * 30;

  // 인원 적합도 (20): 그룹 조건은 groupScore + groupSeatScore 평균 반영
  if (preference.peopleType === "solo") {
    score += (a.soloScore / 5) * 20;
  } else {
    const groupFit = (a.groupScore + a.groupSeatScore) / 2;
    score += (groupFit / 5) * 20;
  }

  // 분위기 적합도 (15): talkable은 quietScore가 낮을수록 유리
  if (preference.mood === "quiet") {
    score += (a.quietScore / 5) * 15;
  } else {
    score += ((5 - a.quietScore) / 5) * 15;
  }

  // 콘센트 (10): 필요하지 않으면 만점 부여
  score += preference.needOutlet ? (a.outletScore / 5) * 10 : 10;

  // 와이파이 (5)
  score += preference.needWifi ? (a.wifiScore / 5) * 5 : 5;

  // 체류 적합성 (10)
  score += (a.stayScore / 5) * 10;

  // 영업시간/24시간 (5)
  if (preference.need24Hours) {
    score += cafe.is24Hours ? 5 : 0;
  } else if (preference.needLateOpen) {
    score += (a.lateOpenScore / 5) * 5;
  } else {
    score += 5;
  }

  // 커피/디저트 (5): 둘 다 관심 없으면 만점
  if (preference.careCoffee && preference.careDessert) {
    score += ((a.coffeeScore + a.dessertScore) / 10) * 5;
  } else if (preference.careCoffee) {
    score += (a.coffeeScore / 5) * 5;
  } else if (preference.careDessert) {
    score += (a.dessertScore / 5) * 5;
  } else {
    score += 5;
  }

  return Math.round(score);
}


export function recommendCafes(
  cafes: Cafe[],
  preference: UserPreference,
  userLocation: Coords,
  limit = DEFAULT_LIMIT
): RecommendationResult[] {
  const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  return cafes
    .filter((cafe) => cafe.status === "active")
    .map((cafe) => {
      const distanceKm = calculateDistanceKm(userLocation, { lat: cafe.lat, lng: cafe.lng });
      return { cafe, distanceKm };
    })
    .filter(({ distanceKm }) => isWithinRadius(distanceKm, preference.radius))
    .map(({ cafe, distanceKm }) => ({
      cafe,
      score: scoreCafeByPreference(cafe, preference, distanceKm),
      distanceKm,
      matchReasons: buildRecommendationReasons(cafe, preference),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, clampedLimit);
}
