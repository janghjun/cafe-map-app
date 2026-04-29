import { safeGet, safeSet, safeRemove } from "../utils/safeStorage";

const STORAGE_KEY = "kagong_events";
const MAX_EVENTS = 500;

export type LogEventName =
  | "home_view"
  | "recommendation_requested"
  | "recommendation_result_view"
  | "cafe_card_click"
  | "cafe_detail_view"
  | "favorite_add"
  | "favorite_remove"
  | "direction_click"
  | "district_best_view"
  | "district_selected"
  | "dong_selected"
  | "suggestion_submit"
  | "location_permission_allow"
  | "location_permission_deny";

// 이벤트별로 저장되는 필드 (위치 좌표/주소/전화번호 등 개인정보 미포함)
export type LogEventPayload = Partial<{
  cafeId: string;
  cafeDistrict: string;
  rank: number;
  radius: 1 | 3 | 5;
  peopleType: string;
  mood: string;
  conditionCount: number;
  resultCount: number;
  district: string;
  dong: string;
  tagCount: number;
  source: string; // direction_click: "direct"(naverMapUrl 보유) | "search"(검색 URL 생성)
}>;

export type LogEvent = {
  id: string;
  name: LogEventName;
  payload: LogEventPayload;
  timestamp: string;
};

function loadEvents(): LogEvent[] {
  return safeGet(STORAGE_KEY, [], (v): v is LogEvent[] => Array.isArray(v));
}

export function trackEvent(name: LogEventName, payload: LogEventPayload = {}): void {
  const event: LogEvent = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[log]", event.name, event.payload);
  }

  safeSet(STORAGE_KEY, [...loadEvents(), event].slice(-MAX_EVENTS));
}

export function getLocalEvents(): LogEvent[] {
  return loadEvents();
}

export function clearLocalEvents(): void {
  safeRemove(STORAGE_KEY);
}
