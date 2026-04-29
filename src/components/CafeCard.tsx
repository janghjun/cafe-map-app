import type { Cafe } from "../types/cafe";
import { TagBadge } from "./TagBadge";
import "../styles/components.css";

type Props = {
  cafe: Cafe;
  distanceLabel?: string;
  score?: number;
  reasons?: string[];
  highlights?: string[];
  variant?: "primary" | "secondary";
  onClick: (cafe: Cafe, distanceLabel?: string) => void;
  onFavoriteClick?: (cafe: Cafe) => void;
  isFavorite?: boolean;
};

export function CafeCard({
  cafe,
  distanceLabel,
  score,
  reasons,
  highlights,
  variant = "secondary",
  onClick,
  onFavoriteClick,
  isFavorite = false,
}: Props) {
  const isPrimary = variant === "primary";
  const hasHighlights = Array.isArray(highlights) && highlights.length > 0;
  const visibleTags = hasHighlights ? [] : cafe.tags.slice(0, 3);

  return (
    <div
      className={`cafe-card${isPrimary ? " cafe-card--primary" : ""}`}
      onClick={() => onClick(cafe, distanceLabel)}
      role="button"
      tabIndex={0}
      aria-label={`${cafe.name} 카페 상세 보기`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(cafe, distanceLabel);
        }
      }}
    >
      {isPrimary && (
        <div className="cafe-card__primary-header">
          <span className="cafe-card__badge">가장 추천</span>
          <p className="cafe-card__primary-caption">이 조건에 가장 잘 맞아요</p>
        </div>
      )}

      <div className="cafe-card__header">
        <div className="cafe-card__title-row">
          <span className="cafe-card__name">{cafe.name}</span>
          {onFavoriteClick && (
            <button
              type="button"
              className={`cafe-card__favorite${isFavorite ? " cafe-card__favorite--active" : ""}`}
              onClick={(e) => { e.stopPropagation(); onFavoriteClick(cafe); }}
              aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              aria-pressed={isFavorite}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          )}
        </div>

        <div className="cafe-card__meta">
          <span className="cafe-card__location">{cafe.district} {cafe.dong}</span>
          {distanceLabel && (
            <>
              <span className="cafe-card__dot">·</span>
              <span className="cafe-card__distance">{distanceLabel}</span>
            </>
          )}
          {score !== undefined && (
            <>
              <span className="cafe-card__dot">·</span>
              <span className="cafe-card__score">카공 {score}점</span>
            </>
          )}
        </div>
      </div>

      {hasHighlights && (
        <div className="cafe-card__highlights">
          {highlights.map((h) => (
            <span key={h} className="cafe-card__highlight-chip">{h}</span>
          ))}
        </div>
      )}

      {visibleTags.length > 0 && (
        <div className="cafe-card__tags">
          {visibleTags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {reasons && reasons.length > 0 && (
        <div className="cafe-card__reasons">
          {reasons.map((r, i) => (
            <p key={i} className="cafe-card__reason-line">{r}</p>
          ))}
        </div>
      )}

      <div className="cafe-card__footer">
        <span className="cafe-card__cta">상세 보기 →</span>
      </div>
    </div>
  );
}
