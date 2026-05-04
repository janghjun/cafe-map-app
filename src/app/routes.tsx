import type { UserPreference, Cafe } from "../types/cafe";
import type { Coords } from "../utils/distance";

// App.tsx가 관리하는 화면 전환 상태.
// 라우터 없이 navStack 배열에 push/pop하는 방식으로 앞/뒤 이동을 처리합니다.
export type NavState =
  | { page: "home" }
  | { page: "recommendations"; preference: UserPreference; userLocation: Coords }
  | { page: "cafeDetail"; cafe: Cafe; distanceLabel?: string }
  | { page: "districtBest" }
  | { page: "favorites" }
  | { page: "recentViews" }
  | { page: "suggestCafe"; targetCafeId?: string; targetCafeName?: string }
  | { page: "serviceInfo" }
  | { page: "themeCafes" };
