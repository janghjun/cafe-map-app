import type { Cafe } from "../types/cafe";
import { CafeCard } from "../components/CafeCard";
import { EmptyState } from "../components/EmptyState";
import { getCafes } from "../services/cafeService";
import { getCafeHighlights } from "../utils/cafeHighlights";
import "../styles/pages.css";

type Props = {
  favoriteIds: string[];
  onCafeClick: (cafe: Cafe, distanceLabel?: string) => void;
  onFavoriteToggle: (cafe: Cafe) => void;
  onBack: () => void;
};

export function FavoritesPage({ favoriteIds, onCafeClick, onFavoriteToggle, onBack }: Props) {
  const favoriteCafes = getCafes().filter((c) => favoriteIds.includes(c.id));

  return (
    <div className="page favorites-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      <header className="district-header">
        <h1 className="district-title">저장한 카페</h1>
        <p className="district-subtitle">
          {favoriteCafes.length > 0
            ? "다시 가고 싶은 카공 카페를 모아봤어요."
            : "아직 저장한 카페가 없어요."}
        </p>
      </header>

      {favoriteCafes.length === 0 ? (
        <EmptyState
          title="저장한 카페가 없어요"
          description="카페 상세 화면에서 ☆를 눌러 저장해두면 여기서 바로 확인할 수 있어요."
          actionLabel="카페 추천받기"
          onAction={onBack}
        />
      ) : (
        <div className="cafe-list">
          {favoriteCafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              highlights={getCafeHighlights(cafe)}
              onClick={onCafeClick}
              onFavoriteClick={onFavoriteToggle}
              isFavorite
            />
          ))}
        </div>
      )}
    </div>
  );
}
