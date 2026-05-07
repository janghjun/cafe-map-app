import { useState, useEffect, useRef } from "react";
import type { NavState } from "./routes";
import { HomePage } from "../pages/HomePage";
import { RecommendationPage } from "../pages/RecommendationPage";
import { CafeDetailPage } from "../pages/CafeDetailPage";
import { DistrictBestPage } from "../pages/DistrictBestPage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { RecentViewsPage } from "../pages/RecentViewsPage";
import { SuggestCafePage } from "../pages/SuggestCafePage";
import { ServiceInfoPage } from "../pages/ServiceInfoPage";
import { ThemeCafesPage } from "../pages/ThemeCafesPage";
import { AdminCandidateListPage } from "../pages/admin/AdminCandidateListPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { Toast } from "../components/Toast";
import { useTheme } from "../hooks/useTheme";
import { getFavorites, toggleFavorite } from "../services/favoriteService";
import { getRecentViews } from "../services/recentViewService";
import { trackEvent } from "../services/logService";
import { initCafeService } from "../services/cafeService";
import type { Cafe } from "../types/cafe";
import "../styles/globals.css";

// ?mode=admin — 내부 운영자 전용 진입점. 일반 사용자 navStack과 완전히 분리.
const IS_ADMIN_MODE = new URLSearchParams(window.location.search).get("mode") === "admin";

// ?entry= 딥링크 — 앱인토스 기능 등록 및 직접 진입 지원.
// 알 수 없는 entry는 home으로 fallback.
function parseEntryNav(): NavState[] {
  const entry = new URLSearchParams(window.location.search).get("entry");
  switch (entry) {
    case "best":    return [{ page: "home" }, { page: "districtBest" }];
    case "suggest": return [{ page: "home" }, { page: "suggestCafe" }];
    case "theme":   return [{ page: "home" }, { page: "themeCafes" }];
    default:        return [{ page: "home" }];
  }
}
const INITIAL_NAV = parseEntryNav();

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [navStack, setNavStack] = useState<NavState[]>(INITIAL_NAV);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [recentViews, setRecentViews] = useState<string[]>(() => getRecentViews());
  const [adminAuthed, setAdminAuthed] = useState(
    () => IS_ADMIN_MODE && sessionStorage.getItem("kagong_admin_session") === "ok"
  );
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const nav = navStack[navStack.length - 1];

  // UI 버튼의 pop()이 history.back()을 호출할 때 popstate가 추가로 발생해
  // navStack이 이중으로 pop되는 것을 막기 위한 플래그
  const suppressNextPopState = useRef(false);

  useEffect(() => {
    // TODO: [앱인토스 실기기 확인 필요]
    // Android WebView에서 popstate 이벤트가 발생하는지 실기기로 검증해야 합니다.
    // popstate 미지원 환경에서는 이 블록이 무해하게 무시되고,
    // UI 뒤로가기 버튼의 즉각적인 navStack pop은 정상 동작합니다.
    // 앱인토스가 별도 브리지 API를 제공하는 경우 popstate 대신 해당 API로 교체하세요.

    // 홈 화면 진입 시 history entry 기준점을 확보합니다.
    history.replaceState(null, "");
    // 딥링크로 홈 위에 스택이 있을 경우 Android 뒤로가기가 동작하도록 추가 entry를 쌓습니다.
    for (let i = 1; i < INITIAL_NAV.length; i++) {
      history.pushState(null, "");
    }

    function handlePopState() {
      if (suppressNextPopState.current) {
        suppressNextPopState.current = false;
        return;
      }
      // Android 하드웨어 뒤로가기 또는 브라우저 뒤로가기
      setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Supabase 모드일 때 캐시를 미리 채움 (mock 모드에서는 무동작)
  useEffect(() => {
    initCafeService();
  }, []);

  // 홈 또는 최근 본 카페 화면 진입 시 localStorage와 동기화
  useEffect(() => {
    if (nav.page === "home" || nav.page === "recentViews") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage 외부 저장소를 React state와 동기화하는 의도적 패턴
      setRecentViews(getRecentViews());
    }
  }, [nav.page]);

  function push(state: NavState) {
    window.scrollTo({ top: 0, behavior: "instant" });
    history.pushState(null, "");
    setNavStack((prev) => [...prev, state]);
  }

  function pop() {
    if (navStack.length <= 1) return;
    // navStack을 즉시 pop해 UI 반응을 빠르게 유지합니다.
    setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    // history와 동기화합니다. 이로 인한 popstate는 suppressNextPopState가 차단합니다.
    suppressNextPopState.current = true;
    history.back();
  }

  function handleFavoriteToggle(cafe: Cafe) {
    const isAdding = !favorites.includes(cafe.id);
    toggleFavorite(cafe.id);
    setFavorites(getFavorites());
    setToast({ message: isAdding ? "⭐ 즐겨찾기에 추가했어요" : "즐겨찾기에서 제거했어요", key: Date.now() });
    trackEvent(isAdding ? "favorite_add" : "favorite_remove", { cafeId: cafe.id, cafeDistrict: cafe.district });
  }

  function handleOpenRecentViews() {
    setRecentViews(getRecentViews());
    push({ page: "recentViews" });
  }

  function handleRecentViewsCleared() {
    setRecentViews([]);
  }

  function handleCafeClick(cafe: Cafe, distanceLabel?: string) {
    push({ page: "cafeDetail", cafe, distanceLabel });
  }

  if (IS_ADMIN_MODE) {
    if (!adminAuthed) {
      return <AdminLoginPage onLogin={() => setAdminAuthed(true)} />;
    }
    return (
      <AdminCandidateListPage
        onBack={() => history.back()}
        onLogout={() => {
          sessionStorage.removeItem("kagong_admin_session");
          setAdminAuthed(false);
        }}
      />
    );
  }

  let page: React.ReactElement;
  switch (nav.page) {
    case "home":
      page = (
        <HomePage
          onRecommend={(preference, userLocation, locationGranted) =>
            push({ page: "recommendations", preference, userLocation, locationGranted })
          }
          onDistrictBest={() => push({ page: "districtBest" })}
          onThemeCafesClick={() => push({ page: "themeCafes" })}
          onFavoritesClick={() => push({ page: "favorites" })}
          favoritesCount={favorites.length}
          onRecentViewsClick={handleOpenRecentViews}
          recentViewsCount={recentViews.length}
          onServiceInfoClick={() => push({ page: "serviceInfo" })}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      );
      break;

    case "recommendations":
      page = (
        <RecommendationPage
          preference={nav.preference}
          userLocation={nav.userLocation}
          locationGranted={nav.locationGranted}
          onCafeClick={handleCafeClick}
          onBack={pop}
          onDistrictBest={() => push({ page: "districtBest" })}
          favoriteIds={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      );
      break;

    case "cafeDetail":
      page = (
        <CafeDetailPage
          cafe={nav.cafe}
          distanceLabel={nav.distanceLabel}
          onBack={pop}
          onFavoriteClick={handleFavoriteToggle}
          isFavorite={favorites.includes(nav.cafe.id)}
          onSuggestClick={(cafeId, cafeName) => push({ page: "suggestCafe", targetCafeId: cafeId, targetCafeName: cafeName })}
        />
      );
      break;

    case "districtBest":
      page = <DistrictBestPage onCafeClick={handleCafeClick} onBack={pop} />;
      break;

    case "favorites":
      page = (
        <FavoritesPage
          favoriteIds={favorites}
          onCafeClick={handleCafeClick}
          onFavoriteToggle={handleFavoriteToggle}
          onBack={pop}
        />
      );
      break;

    case "recentViews":
      page = (
        <RecentViewsPage
          recentIds={recentViews}
          onCafeClick={handleCafeClick}
          onBack={pop}
          onRecentViewsCleared={handleRecentViewsCleared}
        />
      );
      break;

    case "suggestCafe":
      page = (
        <SuggestCafePage
          onBack={pop}
          mode={nav.targetCafeId ? "update" : "new"}
          targetCafeId={nav.targetCafeId}
          targetCafeName={nav.targetCafeName}
        />
      );
      break;

    case "serviceInfo":
      page = <ServiceInfoPage onBack={pop} onSuggestClick={() => push({ page: "suggestCafe" })} />;
      break;

    case "themeCafes":
      page = (
        <ThemeCafesPage
          onCafeClick={handleCafeClick}
          onBack={pop}
          favoriteIds={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      );
      break;
  }

  return (
    <>
      {page}
      {toast && (
        <Toast key={toast.key} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </>
  );
}
