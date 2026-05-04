import { useState, useEffect } from "react";
import type { Cafe } from "../types/cafe";
import { CAFE_THEMES } from "../data/themes";
import { getCafesSync } from "../services/cafeService";
import { CafeCard } from "../components/CafeCard";
import { trackEvent } from "../services/logService";
import "../styles/pages.css";

type Props = {
  onCafeClick: (cafe: Cafe) => void;
  onBack: () => void;
  favoriteIds?: string[];
  onFavoriteToggle?: (cafe: Cafe) => void;
};

export function ThemeCafesPage({ onCafeClick, onBack, favoriteIds = [], onFavoriteToggle }: Props) {
  const [activeThemeId, setActiveThemeId] = useState(CAFE_THEMES[0].id);

  useEffect(() => {
    trackEvent("theme_cafe_view");
  }, []);

  const cafeLookup = new Map(getCafesSync().map((c) => [c.id, c]));

  const activeTheme = CAFE_THEMES.find((t) => t.id === activeThemeId)!;

  function handleTabChange(themeId: string) {
    setActiveThemeId(themeId);
    trackEvent("theme_tab_selected", { source: themeId });
  }

  return (
    <div className="page theme-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      <header className="theme-page__header">
        <h1 className="theme-page__title">테마 카공 추천</h1>
        <p className="theme-page__subtitle">운영자가 직접 고른 카공 스팟</p>
      </header>

      <div className="theme-tab-bar" role="tablist">
        {CAFE_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            role="tab"
            aria-selected={activeThemeId === theme.id}
            className={`theme-tab${activeThemeId === theme.id ? " theme-tab--active" : ""}`}
            onClick={() => handleTabChange(theme.id)}
          >
            <span aria-hidden="true">{theme.icon}</span>
            {theme.title}
          </button>
        ))}
      </div>

      <div className="theme-tab-content" role="tabpanel">
        <p className="theme-desc">{activeTheme.description}</p>
        <p className="theme-updated">업데이트 {activeTheme.updatedAt}</p>

        <div className="theme-cafe-list">
          {activeTheme.picks.map((pick) => {
            const cafe = cafeLookup.get(pick.cafeId);
            if (!cafe) return null;
            return (
              <CafeCard
                key={pick.cafeId}
                cafe={cafe}
                reasons={[pick.reason]}
                onClick={onCafeClick}
                onFavoriteClick={onFavoriteToggle}
                isFavorite={favoriteIds.includes(cafe.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
