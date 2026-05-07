import { useState, useEffect } from "react";
import type { UserPreference, Cafe } from "../types/cafe";
import type { Coords } from "../utils/distance";
import { recommendCafes } from "../utils/recommendation";
import { formatDistance } from "../utils/distance";

// 인천광역시 대략적인 경계 (위도/경도 범위)
const INCHEON_BOUNDS = { latMin: 37.20, latMax: 37.72, lngMin: 126.30, lngMax: 126.95 };
function isInIncheon(coords: Coords): boolean {
  return coords.lat >= INCHEON_BOUNDS.latMin && coords.lat <= INCHEON_BOUNDS.latMax
      && coords.lng >= INCHEON_BOUNDS.lngMin && coords.lng <= INCHEON_BOUNDS.lngMax;
}
import { getCafesSync } from "../services/cafeService";
import { getCafeHighlights } from "../utils/cafeHighlights";
import { splitRecommendationSections } from "../utils/recommendationSections";
import { buildFallbackSuggestions } from "../utils/recommendationFallback";
import { CafeCard } from "../components/CafeCard";
import { MiniMapPreview } from "../components/MiniMapPreview";
import { RecommendationCriteria } from "../components/RecommendationCriteria";
import { EmptyState } from "../components/EmptyState";
import { trackEvent } from "../services/logService";
import "../styles/pages.css";

function getPreferenceChips(pref: UserPreference): string[] {
  const chips: string[] = [];
  chips.push(`${pref.radius}km`);
  if (pref.peopleType === "solo") chips.push("혼자");
  else if (pref.peopleType === "group_2_4") chips.push("2~4명");
  else chips.push("5명 이상");
  if (pref.mood === "quiet") chips.push("조용한 곳");
  else chips.push("대화 가능");
  if (pref.needOutlet)   chips.push("콘센트");
  if (pref.needWifi)     chips.push("와이파이");
  if (pref.needLateOpen) chips.push("늦게까지");
  if (pref.need24Hours)  chips.push("24시간");
  if (pref.careCoffee)   chips.push("커피");
  if (pref.careDessert)  chips.push("디저트");
  return chips;
}

type Props = {
  preference: UserPreference;
  userLocation: Coords;
  locationGranted?: boolean;
  onCafeClick: (cafe: Cafe, distanceLabel?: string) => void;
  onBack: () => void;
  onDistrictBest: () => void;
  favoriteIds?: string[];
  onFavoriteToggle?: (cafe: Cafe) => void;
};

export function RecommendationPage({
  preference,
  userLocation,
  locationGranted = false,
  onCafeClick,
  onBack,
  onDistrictBest,
  favoriteIds = [],
  onFavoriteToggle,
}: Props) {
  const [showMore, setShowMore] = useState(false);
  const [localPref, setLocalPref] = useState<UserPreference>(preference);

  const cafes = getCafesSync();
  // 위치 권한이 있고 인천 밖에 있는 경우 → 반경 무시하고 인천 전체에서 추천
  const outsideIncheon = locationGranted && !isInIncheon(userLocation);
  const allResults = recommendCafes(cafes, localPref, userLocation, 5, outsideIncheon);
  const { curatedResults, conditionResults } = splitRecommendationSections(allResults);
  const visibleConditionResults = showMore ? conditionResults : conditionResults.slice(0, 3);
  const totalVisible = curatedResults.length + visibleConditionResults.length;
  const canShowMore = conditionResults.length > 3 && !showMore;

  useEffect(() => {
    trackEvent("recommendation_result_view", {
      resultCount: allResults.length,
      curatedCount: curatedResults.length,
      radius: localPref.radius,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const prefChips = getPreferenceChips(localPref);

  const summaryText = outsideIncheon
    ? allResults.length > 0
      ? `현재 인천 밖에 계시네요. 조건에 맞는 인천 카공 카페 ${totalVisible}곳을 찾았어요${canShowMore ? ` (${conditionResults.length - 3}곳 더 있어요)` : ""}`
      : `현재 인천 밖에 계세요. 조건에 맞는 인천 카공 카페를 찾지 못했어요`
    : allResults.length > 0
      ? `내 주변 ${localPref.radius}km 안에서 조건에 맞는 카페 ${totalVisible}곳을 찾았어요${canShowMore ? ` (${conditionResults.length - 3}곳 더 있어요)` : ""}`
      : `내 주변 ${localPref.radius}km 안에서 조건에 맞는 카페를 찾지 못했어요`;

  const fallbackSuggestions = allResults.length === 0
    ? buildFallbackSuggestions(cafes, localPref, userLocation)
    : [];

  return (
    <div className="page recommendation-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 다시 선택
        </button>
      </div>

      {/* 선택 조건 요약 칩 */}
      <div className="rec-filter-chips" role="list" aria-label="선택한 조건">
        {prefChips.map((chip) => (
          <span key={chip} className="rec-filter-chip" role="listitem">{chip}</span>
        ))}
      </div>

      <p className="recommendation-summary">{summaryText}</p>

      {totalVisible === 0 ? (
        <EmptyState
          mascotState="warning"
          title="이 조건으로는 찾기 어려워요"
          description="조건을 조금 넓히면 더 많은 카공 카페를 찾을 수 있어요."
          fallbacks={fallbackSuggestions.map((s) => ({
            label: s.label,
            description: s.description,
            onApply: () => {
              const next: UserPreference = {
                ...localPref,
                ...(s.newRadius !== undefined && { radius: s.newRadius }),
                ...(s.relaxCondition !== undefined && { [s.relaxCondition]: false }),
              };
              setShowMore(false);
              setLocalPref(next);
              trackEvent("fallback_applied", { type: s.relaxCondition ?? `radius_${s.newRadius}` });
            },
          }))}
          actionLabel="조건 다시 선택하기"
          onAction={onBack}
        />
      ) : (
        <div className="cafe-list">

          {/* 운영자 추천 섹션 */}
          {curatedResults.length > 0 && (
            <>
              <p className="recommendation-section-label recommendation-section-label--curated">
                ⭐ 운영자 추천
              </p>
              {curatedResults.map((result, idx) => {
                const distLabel = formatDistance(result.distanceKm);
                return (
                  <CafeCard
                    key={result.cafe.id}
                    cafe={result.cafe}
                    distanceLabel={distLabel}
                    score={result.score}
                    reasons={result.matchReasons}
                    highlights={getCafeHighlights(result.cafe, preference)}
                    variant="primary"
                    isFavorite={favoriteIds.includes(result.cafe.id)}
                    onFavoriteClick={onFavoriteToggle}
                    onClick={(cafe) => {
                      trackEvent("cafe_card_click", { cafeId: cafe.id, cafeDistrict: cafe.district, rank: idx + 1, section: "curated" });
                      onCafeClick(cafe, distLabel);
                    }}
                  />
                );
              })}
            </>
          )}

          {/* 조건 기반 추천 섹션 */}
          {visibleConditionResults.length > 0 && (
            <>
              <p className="recommendation-section-label">
                {curatedResults.length > 0 ? "조건에 맞는 카페" : "추천 카페"}
              </p>
              {visibleConditionResults.map((result, idx) => {
                const distLabel = formatDistance(result.distanceKm);
                const isFirst = curatedResults.length === 0 && idx === 0;
                return (
                  <CafeCard
                    key={result.cafe.id}
                    cafe={result.cafe}
                    distanceLabel={distLabel}
                    score={result.score}
                    reasons={result.matchReasons}
                    highlights={getCafeHighlights(result.cafe, preference)}
                    variant={isFirst ? "primary" : "secondary"}
                    isFavorite={favoriteIds.includes(result.cafe.id)}
                    onFavoriteClick={onFavoriteToggle}
                    onClick={(cafe) => {
                      trackEvent("cafe_card_click", { cafeId: cafe.id, cafeDistrict: cafe.district, rank: idx + 1 + curatedResults.length, section: "condition" });
                      onCafeClick(cafe, distLabel);
                    }}
                  />
                );
              })}
            </>
          )}

          {canShowMore && (
            <button
              type="button"
              className="btn-show-more"
              onClick={() => setShowMore(true)}
            >
              카페 더 보기 ({conditionResults.length - 3}곳 더)
            </button>
          )}
        </div>
      )}

      {totalVisible > 0 && (
        <MiniMapPreview
          points={[...curatedResults, ...visibleConditionResults].map((r) => ({
            id: r.cafe.id,
            name: r.cafe.name,
            lat: r.cafe.lat,
            lng: r.cafe.lng,
          }))}
          userLocation={locationGranted ? userLocation : undefined}
          onMarkerClick={(cafeId) => {
            const result = [...curatedResults, ...visibleConditionResults].find((r) => r.cafe.id === cafeId);
            if (result) {
              trackEvent("cafe_card_click", { cafeId: result.cafe.id, cafeDistrict: result.cafe.district, source: "mini_map" });
              onCafeClick(result.cafe, formatDistance(result.distanceKm));
            }
          }}
        />
      )}

      <RecommendationCriteria />

      <div className="page-footer-link">
        <button type="button" className="btn-text" onClick={onDistrictBest}>
          인천 BEST도 보고 싶어요 →
        </button>
      </div>
    </div>
  );
}
