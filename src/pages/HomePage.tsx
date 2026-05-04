import { useState, useEffect } from "react";
import type { UserPreference, PeopleType, MoodType } from "../types/cafe";
import type { Coords } from "../utils/distance";
import { RadiusSelector } from "../components/RadiusSelector";
import { FilterChip } from "../components/FilterChip";
import { trackEvent } from "../services/logService";
import { QUICK_PRESETS } from "../utils/quickPresets";
import { getCafeCount } from "../services/cafeService";
import {
  getFallbackLocation,
  getCurrentLocation,
  type LocationStatus,
} from "../services/locationService";
import "../styles/pages.css";

type Props = {
  onRecommend: (preference: UserPreference, userLocation: Coords) => void;
  onDistrictBest: () => void;
  onThemeCafesClick?: () => void;
  onFavoritesClick?: () => void;
  favoritesCount?: number;
  onRecentViewsClick?: () => void;
  recentViewsCount?: number;
  onServiceInfoClick?: () => void;
};

export function HomePage({ onRecommend, onDistrictBest, onThemeCafesClick, onFavoritesClick, favoritesCount, onRecentViewsClick, recentViewsCount, onServiceInfoClick }: Props) {
  useEffect(() => { trackEvent("home_view"); }, []);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [userLocation, setUserLocation] = useState<Coords>(getFallbackLocation);

  async function handleRequestLocation() {
    setLocationStatus("loading");
    const result = await getCurrentLocation();
    setUserLocation(result.coords);
    if (result.source === "gps") {
      setLocationStatus("granted");
      trackEvent("location_permission_allow");
    } else {
      setLocationStatus("denied");
      trackEvent("location_permission_deny");
    }
  }

  // 이미 권한이 허용된 경우 조용히 위치를 자동 수집
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 geolocation 미지원 환경 감지 후 즉시 상태 설정
      setLocationStatus("fallback");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).permissions
      ?.query?.({ name: "geolocation" })
      ?.then((perm: { state: string }) => {
        if (perm.state === "granted") handleRequestLocation();
        else if (perm.state === "denied") setLocationStatus("denied");
      })
      ?.catch(() => { /* Permissions API 미지원 → idle 유지 */ });
  }, []);

  const [radius, setRadius] = useState<1 | 3 | 5>(3);
  const [peopleType, setPeopleType] = useState<PeopleType>("solo");
  const [mood, setMood] = useState<MoodType>("quiet");
  const [needOutlet, setNeedOutlet] = useState(false);
  const [needWifi, setNeedWifi] = useState(false);
  const [needLateOpen, setNeedLateOpen] = useState(false);
  const [need24Hours, setNeed24Hours] = useState(false);
  const [careCoffee, setCareCoffee] = useState(false);
  const [careDessert, setCareDessert] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  function applyPreset(presetId: string) {
    const preset = QUICK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const f = preset.filters;
    setPeopleType(f.peopleType);
    setMood(f.mood);
    setNeedOutlet(f.needOutlet);
    setNeedWifi(f.needWifi);
    setNeedLateOpen(f.needLateOpen);
    setNeed24Hours(f.need24Hours);
    setCareCoffee(f.careCoffee);
    setCareDessert(f.careDessert);
    setActivePresetId(presetId);
    trackEvent("quick_preset_applied", { source: presetId });
  }

  function handleRecommend() {
    const preference: UserPreference = {
      radius,
      peopleType,
      mood,
      needOutlet,
      needWifi,
      needLateOpen,
      need24Hours,
      careCoffee,
      careDessert,
    };
    const conditionCount = [needOutlet, needWifi, needLateOpen, need24Hours, careCoffee, careDessert].filter(Boolean).length;
    trackEvent("recommendation_requested", { radius, peopleType, mood, conditionCount });
    onRecommend(preference, userLocation);
  }

  const cafeCount = getCafeCount();

  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="home-hero__badge">
          인천 카공 카페 {cafeCount}곳 수록
        </div>
        <h1 className="home-title">
          카공 어디가?
          <span className="home-title__sub">인천편</span>
        </h1>
        <p className="home-subtitle">지금 내 주변에서 공부하기 좋은 카페를 찾아드릴게요</p>
      </header>

      <div className="home-body">

      <section className="home-section">
        <h2 className="home-section__label">⚡ 빠른 선택</h2>
        <div className="quick-presets">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`quick-preset-btn${activePresetId === preset.id ? " quick-preset-btn--active" : ""}`}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="quick-presets__hint">선택 후 조건을 직접 수정할 수 있어요</p>
      </section>

      <section className="home-section">
        <h2 className="home-section__label">📍 내 위치</h2>
        <div className="location-status-box">
          {locationStatus === "idle" && (
            <>
              <p className="location-status">허용하면 내 주변 카페를 추천해드려요. 거부해도 인천 중심 기준으로 찾아드려요.</p>
              <button type="button" className="btn-location" onClick={handleRequestLocation}>
                내 위치 허용하기
              </button>
            </>
          )}
          {locationStatus === "loading" && (
            <p className="location-status">위치를 가져오는 중이에요...</p>
          )}
          {locationStatus === "granted" && (
            <p className="location-status location-status--ok">✓ 현재 위치 기준으로 검색해요</p>
          )}
          {(locationStatus === "denied" || locationStatus === "fallback") && (
            <>
              <p className="location-status location-status--warn">⚠ 인천 중심 기준으로 검색해요</p>
              <button type="button" className="btn-location" onClick={handleRequestLocation}>
                다시 시도하기
              </button>
            </>
          )}
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section__label">📏 반경</h2>
        <RadiusSelector value={radius} onChange={setRadius} />
      </section>

      <section className="home-section">
        <h2 className="home-section__label">👤 인원</h2>
        <div className="chip-row">
          <FilterChip label="혼자" selected={peopleType === "solo"} onClick={() => setPeopleType("solo")} />
          <FilterChip label="2~4명" selected={peopleType === "group_2_4"} onClick={() => setPeopleType("group_2_4")} />
          <FilterChip label="5명 이상" selected={peopleType === "group_5_plus"} onClick={() => setPeopleType("group_5_plus")} />
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section__label">🎧 분위기</h2>
        <div className="chip-row">
          <FilterChip label="조용한 곳" selected={mood === "quiet"} onClick={() => setMood("quiet")} />
          <FilterChip label="대화 가능한 곳" selected={mood === "talkable"} onClick={() => setMood("talkable")} />
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section__label">✅ 조건</h2>
        <div className="chip-row chip-row--wrap">
          <FilterChip label="콘센트"  selected={needOutlet}   onClick={() => setNeedOutlet(!needOutlet)} />
          <FilterChip label="와이파이" selected={needWifi}     onClick={() => setNeedWifi(!needWifi)} />
          <FilterChip label="늦게까지" selected={needLateOpen} onClick={() => setNeedLateOpen(!needLateOpen)} />
          <FilterChip label="24시간"  selected={need24Hours}  onClick={() => setNeed24Hours(!need24Hours)} />
          <FilterChip label="커피"    selected={careCoffee}   onClick={() => setCareCoffee(!careCoffee)} />
          <FilterChip label="디저트"  selected={careDessert}  onClick={() => setCareDessert(!careDessert)} />
        </div>
      </section>

      <div className="home-actions">
        <button type="button" className="btn-primary" onClick={handleRecommend}>
          카공 카페 추천받기
        </button>
        <button type="button" className="btn-secondary" onClick={onDistrictBest}>
          인천 BEST 보기
        </button>
        {onThemeCafesClick && (
          <button type="button" className="btn-secondary" onClick={onThemeCafesClick}>
            ✨ 테마 카공 추천 보기
          </button>
        )}
        {(onFavoritesClick || onRecentViewsClick) && (
          <div className="home-quick-links">
            {onFavoritesClick && (
              <button type="button" className="btn-text" onClick={onFavoritesClick}>
                ★ 저장한 카페{favoritesCount ? ` (${favoritesCount})` : ""} 보기
              </button>
            )}
            {onRecentViewsClick && (
              <button type="button" className="btn-text" onClick={onRecentViewsClick}>
                🕐 최근 본 카페{recentViewsCount ? ` (${recentViewsCount})` : ""} 보기
              </button>
            )}
          </div>
        )}
        {onServiceInfoClick && (
          <div className="home-service-link">
            <button type="button" className="btn-text" onClick={onServiceInfoClick}>
              서비스 안내
            </button>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
