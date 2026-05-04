import { safeGet, safeSet, safeRemove } from "../utils/safeStorage";
import { getAnonymousUserId } from "./userIdentityService";

const LEGACY_KEY = "kagong_events";
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
  | "location_permission_deny"
  | "quick_preset_applied"
  | "wifi_reported"
  | "theme_cafe_view"
  | "theme_tab_selected"
  | "course_created"
  | "course_deleted"
  | "course_viewed"
  | "course_cafe_added"
  | "course_cafe_removed";

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
  source: string;
  mode: string;
  updateReasonType: string;
  status: string;
}>;

export type LogEvent = {
  id: string;
  name: LogEventName;
  payload: LogEventPayload;
  timestamp: string;
  // 내부 집계용 익명 ID — UI에 노출하지 않음
  _uid: string;
};

function storageKey(): string {
  return `kagong_events_${getAnonymousUserId()}`;
}

function loadEvents(): LogEvent[] {
  const key = storageKey();

  const existing = safeGet(key, null, (v): v is LogEvent[] => Array.isArray(v));
  if (existing !== null) return existing;

  // 기존 이벤트 로그 migration (익명 ID 필드 없이 저장된 레거시 이벤트)
  const legacy = safeGet(LEGACY_KEY, [], (v): v is LogEvent[] => Array.isArray(v));
  return legacy;
}

export function trackEvent(name: LogEventName, payload: LogEventPayload = {}): void {
  const uid = getAnonymousUserId();
  const event: LogEvent = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    payload,
    timestamp: new Date().toISOString(),
    _uid: uid,
  };

  if (import.meta.env.DEV) {
    console.debug("[log]", event.name, event.payload);
  }

  safeSet(storageKey(), [...loadEvents(), event].slice(-MAX_EVENTS));
}

export function getLocalEvents(): LogEvent[] {
  return loadEvents();
}

export function clearLocalEvents(): void {
  safeRemove(storageKey());
  safeRemove(LEGACY_KEY);
}
