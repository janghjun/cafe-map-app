import type { RecommendationResult } from "../types/cafe";

export type RecommendationSections = {
  /** verificationStatus === "curated" 인 카페 (최대 2개) */
  curatedResults: RecommendationResult[];
  /** verified_basic 이상, curated 중복 없음 (최대 3개) */
  conditionResults: RecommendationResult[];
};

/**
 * 추천 결과를 "운영자 추천"과 "조건 기반 추천" 두 섹션으로 분리합니다.
 * - curated가 없으면 conditionResults에 전체 결과가 들어갑니다.
 * - 중복 카페가 두 섹션에 동시에 나타나지 않습니다.
 */
export function splitRecommendationSections(
  results: RecommendationResult[],
  maxCurated = 2,
  maxCondition = 3
): RecommendationSections {
  const curatedResults = results
    .filter((r) => r.cafe.verificationStatus === "curated")
    .slice(0, maxCurated);

  const curatedIds = new Set(curatedResults.map((r) => r.cafe.id));

  const conditionResults = results
    .filter((r) => !curatedIds.has(r.cafe.id))
    .slice(0, maxCondition);

  return { curatedResults, conditionResults };
}
