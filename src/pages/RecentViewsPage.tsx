import type { Cafe } from "../types/cafe";
import { CafeCard } from "../components/CafeCard";
import { EmptyState } from "../components/EmptyState";
import { getCafesSync } from "../services/cafeService";
import { getCafeHighlights } from "../utils/cafeHighlights";
import { clearRecentViews } from "../services/recentViewService";
import "../styles/pages.css";

type Props = {
  recentIds: string[];
  onCafeClick: (cafe: Cafe, distanceLabel?: string) => void;
  onBack: () => void;
  onRecentViewsCleared: () => void;
};

export function RecentViewsPage({ recentIds, onCafeClick, onBack, onRecentViewsCleared }: Props) {
  const allCafes = getCafesSync();
  const recentCafes = recentIds
    .map((id) => allCafes.find((c) => c.id === id))
    .filter((c): c is Cafe => c !== undefined);

  function handleClear() {
    clearRecentViews();
    onRecentViewsCleared();
  }

  return (
    <div className="page recent-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
        {recentCafes.length > 0 && (
          <button type="button" className="btn-text" onClick={handleClear}>
            전체 삭제
          </button>
        )}
      </div>

      <header className="district-header">
        <h1 className="district-title">최근 본 카페</h1>
        <p className="district-subtitle">
          {recentCafes.length > 0
            ? "방금 봤던 카페를 다시 확인해보세요."
            : "아직 본 카페가 없어요."}
        </p>
      </header>

      {recentCafes.length === 0 ? (
        <EmptyState
          title="아직 둘러본 카페가 없어요"
          description="카공 카페를 구경하면 여기에 자동으로 기록돼요."
          actionLabel="카공 카페 찾아보기"
          onAction={onBack}
        />
      ) : (
        <div className="cafe-list">
          {recentCafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              highlights={getCafeHighlights(cafe)}
              onClick={onCafeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
