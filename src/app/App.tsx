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
import { getFavorites, toggleFavorite } from "../services/favoriteService";
import { getRecentViews } from "../services/recentViewService";
import { trackEvent } from "../services/logService";
import type { Cafe } from "../types/cafe";
import "../styles/globals.css";

export function App() {
  const [navStack, setNavStack] = useState<NavState[]>([{ page: "home" }]);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [recentViews, setRecentViews] = useState<string[]>(() => getRecentViews());
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 홈 또는 최근 본 카페 화면 진입 시 localStorage와 동기화
  useEffect(() => {
    if (nav.page === "home" || nav.page === "recentViews") {
      setRecentViews(getRecentViews());
    }
  }, [nav.page]);

  function push(state: NavState) {
    // history entry를 쌓아 Android 뒤로가기가 popstate를 발생시킬 수 있게 합니다.
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

  switch (nav.page) {
    case "home":
      return (
        <HomePage
          onRecommend={(preference, userLocation) =>
            push({ page: "recommendations", preference, userLocation })
          }
          onDistrictBest={() => push({ page: "districtBest" })}
          onFavoritesClick={() => push({ page: "favorites" })}
          favoritesCount={favorites.length}
          onRecentViewsClick={handleOpenRecentViews}
          recentViewsCount={recentViews.length}
          onServiceInfoClick={() => push({ page: "serviceInfo" })}
        />
      );

    case "recommendations":
      return (
        <RecommendationPage
          preference={nav.preference}
          userLocation={nav.userLocation}
          onCafeClick={handleCafeClick}
          onBack={pop}
          onDistrictBest={() => push({ page: "districtBest" })}
          favoriteIds={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      );

    case "cafeDetail":
      return (
        <CafeDetailPage
          cafe={nav.cafe}
          distanceLabel={nav.distanceLabel}
          onBack={pop}
          onFavoriteClick={handleFavoriteToggle}
          isFavorite={favorites.includes(nav.cafe.id)}
          onSuggestClick={() => push({ page: "suggestCafe" })}
        />
      );

    case "districtBest":
      return (
        <DistrictBestPage
          onCafeClick={handleCafeClick}
          onBack={pop}
        />
      );

    case "favorites":
      return (
        <FavoritesPage
          favoriteIds={favorites}
          onCafeClick={handleCafeClick}
          onFavoriteToggle={handleFavoriteToggle}
          onBack={pop}
        />
      );

    case "recentViews":
      return (
        <RecentViewsPage
          recentIds={recentViews}
          onCafeClick={handleCafeClick}
          onBack={pop}
          onRecentViewsCleared={handleRecentViewsCleared}
        />
      );

    case "suggestCafe":
      return <SuggestCafePage onBack={pop} />;

    case "serviceInfo":
      return <ServiceInfoPage onBack={pop} />;
  }
}
