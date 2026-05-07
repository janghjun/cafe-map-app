import { useState, useMemo, useEffect } from "react";
import type { Cafe } from "../types/cafe";
import type { MascotState } from "../types/mascot";
import type { ThemeCriteria } from "../data/themes";
import { CAFE_THEMES } from "../data/themes";
import { getCafesSync } from "../services/cafeService";
import { CafeCard } from "../components/CafeCard";
import { MascotImage } from "../components/MascotImage";
import { trackEvent } from "../services/logService";
import "../styles/pages.css";

const THEME_MASCOT: Record<string, MascotState> = {
  weekly:   "sitting",
  night:    "night",
  teamwork: "thinking",
};

// 주(week) 단위 시드 — 같은 주 안에서는 동일한 추천, 매주 새로 섞임
const WEEK_SEED = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const h = Math.abs(Math.sin(seed * 9301 + i * 49297 + 233) * 1_000_000);
    const j = Math.floor(h % (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildDynamicReason(themeId: string, cafe: Cafe): string {
  const a = cafe.attributes;
  const signals = cafe.studySignals ?? [];

  if (themeId === "night") {
    // "24시간" 시그널은 이미 리드에 있으므로 야간 맥락 시그널만 활용
    const nightSignal = signals.find((s) =>
      !s.startsWith("24시간") &&
      (s.includes("야간") || s.includes("새벽") || s.includes("밤") || s.includes("마감"))
    );

    const features: string[] = [];
    if (a.outletScore >= 5) features.push("좌석마다 콘센트");
    else if (a.outletScore >= 4) features.push("콘센트 완비");
    if (a.wifiScore >= 4) features.push("와이파이 완비");
    if (a.quietScore >= 4) features.push("조용한 분위기");
    if (a.stayScore >= 5) features.push("장시간 체류 최적");

    const featStr = features.slice(0, 2).join("·");
    const loc = cafe.dong ? `${cafe.district} ${cafe.dong}` : cafe.district;

    if (nightSignal && featStr) return `24시간 운영. ${nightSignal}. ${featStr}.`;
    if (nightSignal) return `24시간 운영. ${nightSignal}.`;
    if (featStr) return `${loc} 24시간 운영. ${featStr}.`;
    return `${loc} 24시간 운영. 새벽까지 카공 가능해요.`;
  }

  if (themeId === "teamwork") {
    const groupSignal = signals.find((s) =>
      s.includes("단체") || s.includes("그룹") || s.includes("팀") || s.includes("소모임") || s.includes("소파")
    );

    const parts: string[] = [];

    // 그룹석 설명 — 점수가 낮으면 다른 강점으로 대신
    if (a.groupSeatScore >= 5) parts.push("단체석 넉넉");
    else if (a.groupSeatScore >= 4) parts.push("단체 자리 여유 있음");
    else if (groupSignal) parts.push(groupSignal);
    else parts.push(`${cafe.district} 팀 카공 가능`);

    // 추가 강점
    if (a.outletScore >= 4) parts.push("콘센트 완비");
    if (a.wifiScore >= 4) parts.push("와이파이 완비");
    if (a.stayScore >= 4) parts.push("오래 앉기 편한 환경");
    if (a.quietScore <= 2) parts.push("대화 편한 분위기");

    const combined = parts.slice(0, 3).join(", ");
    const suffix = a.groupSeatScore >= 4 ? "팀 프로젝트에 적합해요." : "소모임 카공에 어울려요.";
    return `${combined}. ${suffix}`;
  }

  return cafe.summary ?? "카공하기 좋은 카페예요.";
}

function buildDynamicPicks(
  criteria: ThemeCriteria,
  themeId: string,
  cafes: Cafe[]
): Array<{ cafe: Cafe; reason: string }> {
  let pool = cafes.filter((c) => c.status === "active");

  if (criteria.is24Hours) pool = pool.filter((c) => c.is24Hours);
  if (criteria.excludeUnmanned) pool = pool.filter((c) => !c.name.includes("무인"));
  if (criteria.minGroupScore != null)
    pool = pool.filter((c) => c.attributes.groupScore >= criteria.minGroupScore!);
  if (criteria.minGroupSeatScore != null)
    pool = pool.filter((c) => c.attributes.groupSeatScore >= criteria.minGroupSeatScore!);
  if (criteria.minStayScore != null)
    pool = pool.filter((c) => c.attributes.stayScore >= criteria.minStayScore!);

  // 큐레이션 우선, 그 다음 체류 + 1인 점수 합산으로 상위 풀 구성
  const scored = pool
    .map((c) => ({
      cafe: c,
      priority:
        (c.verificationStatus === "curated" ? 20 : 0) +
        c.attributes.stayScore +
        c.attributes.soloScore,
    }))
    .sort((a, b) => b.priority - a.priority);

  const limit = criteria.limit ?? 4;
  const topN = Math.min(scored.length, limit * 4);
  const shuffled = seededShuffle(scored.slice(0, topN).map((x) => x.cafe), WEEK_SEED);

  return shuffled.slice(0, limit).map((cafe) => ({
    cafe,
    reason: buildDynamicReason(themeId, cafe),
  }));
}

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

  const allCafes = useMemo(() => getCafesSync(), []);
  const cafeLookup = useMemo(() => new Map(allCafes.map((c) => [c.id, c])), [allCafes]);

  const activeTheme = CAFE_THEMES.find((t) => t.id === activeThemeId)!;
  const activeMascot = THEME_MASCOT[activeThemeId];

  const activePicks = useMemo<Array<{ cafe: Cafe; reason: string }>>(() => {
    if (activeTheme.picks && activeTheme.picks.length > 0) {
      return activeTheme.picks
        .map((p) => ({ cafe: cafeLookup.get(p.cafeId), reason: p.reason }))
        .filter((p): p is { cafe: Cafe; reason: string } => p.cafe !== undefined && p.cafe.status === "active");
    }
    if (activeTheme.criteria) {
      return buildDynamicPicks(activeTheme.criteria, activeTheme.id, allCafes);
    }
    return [];
  }, [activeTheme, cafeLookup, allCafes]);

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
        <p className="theme-page__subtitle">
          {activeTheme.criteria ? "조건에 맞는 카페를 매주 새로 추천해요" : "운영자가 직접 고른 카공 스팟"}
        </p>
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
        <div className="theme-desc-row">
          <div className="theme-desc-text">
            <p className="theme-desc">{activeTheme.description}</p>
            <p className="theme-updated">업데이트 {activeTheme.updatedAt}</p>
          </div>
          {activeMascot && (
            <MascotImage state={activeMascot} size="md" decorative />
          )}
        </div>

        <div className="theme-cafe-list">
          {activePicks.map(({ cafe, reason }) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              reasons={[reason]}
              onClick={onCafeClick}
              onFavoriteClick={onFavoriteToggle}
              isFavorite={favoriteIds.includes(cafe.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
