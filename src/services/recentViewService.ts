import { safeGet, safeSet, isStringArray } from "../utils/safeStorage";
import { getAnonymousUserId } from "./userIdentityService";

const LEGACY_KEY = "kagong_recent_views";
const MAX_ITEMS = 20;

function userKey(): string {
  return `kagong_recent_views_${getAnonymousUserId()}`;
}

function read(): string[] {
  const key = userKey();

  // 기존 키에 데이터가 있고 사용자 키에는 없는 경우 한 번만 migration
  const existing = safeGet(key, null, isStringArray);
  if (existing !== null) return existing;

  const legacy = safeGet(LEGACY_KEY, [], isStringArray);
  if (legacy.length > 0) {
    safeSet(key, legacy);
  }
  return legacy;
}

export function getRecentViews(): string[] {
  return read();
}

export function addRecentView(cafeId: string): void {
  safeSet(userKey(), [cafeId, ...read().filter((id) => id !== cafeId)].slice(0, MAX_ITEMS));
}

export function clearRecentViews(): void {
  safeSet(userKey(), []);
}
