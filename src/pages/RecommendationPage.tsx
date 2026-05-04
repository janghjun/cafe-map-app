import { useState, useEffect } from "react";
import type { UserPreference, Cafe } from "../types/cafe";
import type { Coords } from "../utils/distance";
import { recommendCafes } from "../utils/recommendation";
import { formatDistance } from "../utils/distance";
import { getCafesSync } from "../services/cafeService";
import { getCafeHighlights } from "../utils/cafeHighlights";
import { CafeCard } from "../components/CafeCard";
import { MiniMapPreview } from "../components/MiniMapPreview";
import { RecommendationCriteria } from "../components/RecommendationCriteria";
import { EmptyState } from "../components/EmptyState";
import { trackEvent } from "../services/logService";
import "../styles/pages.css";

type Props = {
  preference: UserPreference;
  userLocation: Coords;
  onCafeClick: (cafe: Cafe, distanceLabel?: string) => void;
  onBack: () => void;
  onDistrictBest: () => void;
  favoriteIds?: string[];
  onFavoriteToggle?: (cafe: Cafe) => void;
};

export function RecommendationPage({
  preference,
  userLocation,
  onCafeClick,
  onBack,
  onDistrictBest,
  favoriteIds = [],
  onFavoriteToggle,
}: Props) {
  const [limit, setLimit] = useState<3 | 5>(3);

  const allResults = recommendCafes(getCafesSync(), preference, userLocation, 5);
  const visibleResults = allResults.slice(0, limit);
  const canShowMore = allResults.length > 3 && limit === 3;

  useEffect(() => {
    trackEvent("recommendation_result_view", { resultCount: allResults.length, radius: preference.radius });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const summaryText =
    allResults.length > 0
      ? `내 주변 ${preference.radius}km 안에서 조건에 맞는 카페 ${allResults.length}곳을 찾았어요`
      : `내 주변 ${preference.radius}km 안에서 조건에 맞는 카페를 찾지 못했어요`;

  return (
    <div className="page recommendation-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 다시 선택
        </button>
      </div>

      <p className="recommendation-summary">{summaryText}</p>

      {visibleResults.length === 0 ? (
        <EmptyState
          title="이 조건으로는 찾기 어려워요"
          description="조건을 조금 넓히면 더 많은 카공 카페를 찾을 수 있어요."
          actionLabel="조건 다시 선택하기"
          onAction={onBack}
        />
      ) : (
        <div className="cafe-list">
          {/* 1순위 — 가장 추천 */}
          {(() => {
            const result = visibleResults[0];
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
                  trackEvent("cafe_card_click", { cafeId: cafe.id, cafeDistrict: cafe.district, rank: 1 });
                  onCafeClick(cafe, distLabel);
                }}
              />
            );
          })()}

          {/* 2순위 이하 — 다른 추천 */}
          {visibleResults.length > 1 && (
            <>
              <p className="recommendation-section-label">
                다른 추천 {visibleResults.length - 1}곳
              </p>
              {visibleResults.slice(1).map((result, idx) => {
                const distLabel = formatDistance(result.distanceKm);
                return (
                  <CafeCard
                    key={result.cafe.id}
                    cafe={result.cafe}
                    distanceLabel={distLabel}
                    score={result.score}
                    reasons={result.matchReasons}
                    highlights={getCafeHighlights(result.cafe, preference)}
                    variant="secondary"
                    isFavorite={favoriteIds.includes(result.cafe.id)}
                    onFavoriteClick={onFavoriteToggle}
                    onClick={(cafe) => {
                      trackEvent("cafe_card_click", { cafeId: cafe.id, cafeDistrict: cafe.district, rank: idx + 2 });
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
              onClick={() => setLimit(5)}
            >
              카페 더 보기 ({allResults.length - 3}곳 더)
            </button>
          )}
        </div>
      )}

      {visibleResults.length > 0 && (
        <MiniMapPreview
          points={visibleResults.map((r) => ({
            id: r.cafe.id,
            name: r.cafe.name,
            lat: r.cafe.lat,
            lng: r.cafe.lng,
          }))}
          userLocation={userLocation}
          onMarkerClick={(cafeId) => {
            const result = visibleResults.find((r) => r.cafe.id === cafeId);
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
