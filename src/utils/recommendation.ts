import type { Cafe, UserPreference, RecommendationResult } from "../types/cafe";
import { calculateDistanceKm, isWithinRadius } from "./distance";
import type { Coords } from "./distance";
import { buildRecommendationReasons } from "./recommendationReason";

export function calculateManualBoost(cafe: Cafe): number {
  if (!cafe.manualBoostEligible) return 0;

  let boost = 0;

  // 운영자 직접 수집·큐레이션 — 최고 신뢰도 (직접 서치·검증한 카공 후보)
  // curated: 운영자가 직접 확인한 최우선 추천 카페
  if (cafe.verificationStatus === "curated") boost += 35;
  else if (cafe.verificationStatus === "verified_basic") boost += 3;

  // 운영팀 우선 검수 지정 (+5)
  if (cafe.manualPriority === "high") boost += 5;

  // 카공 근거 신호 강도 — 직접 수집한 카공 시그널+태그 합산
  const signalCount = (cafe.studySignals?.length ?? 0) + (cafe.suggestedTags?.length ?? 0);
  if (signalCount >= 7) boost += 5;
  else if (signalCount >= 3) boost += 3;

  return Math.min(boost, 50);
}

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
  limit = DEFAULT_LIMIT,
  ignoreRadius = false
): RecommendationResult[] {
  const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  return cafes
    .filter((cafe) => {
      if (cafe.status !== "active") return false;
      if (cafe.verificationStatus === "closed") return false;
      return true;
    })
    .map((cafe) => {
      const distanceKm = calculateDistanceKm(userLocation, { lat: cafe.lat, lng: cafe.lng });
      return { cafe, distanceKm };
    })
    .filter(({ distanceKm }) => ignoreRadius || isWithinRadius(distanceKm, preference.radius))
    .map(({ cafe, distanceKm }) => {
      const baseScore = scoreCafeByPreference(cafe, preference, distanceKm);
      // 무인 카페는 카공 카페 특성상 후순위 배치 (키오스크·무인 운영으로 환경 편차 큼)
      const isUnmanned = cafe.name.includes("무인");
      const adjustedScore = isUnmanned
        ? Math.round(baseScore * 0.72)
        : cafe.verificationStatus === "needs_recheck"
          ? Math.round(baseScore * 0.8)
          : baseScore;
      const manualBoost = calculateManualBoost(cafe);
      const score = adjustedScore + manualBoost;
      const reasons = buildRecommendationReasons(cafe, preference);
      if (manualBoost > 0 && reasons.length < 3) {
        reasons.push("직접 수집한 카공 근거가 있는 후보예요.");
      }
      return {
        cafe,
        score,
        distanceKm,
        matchReasons: reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, clampedLimit);
}
