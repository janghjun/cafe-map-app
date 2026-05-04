import { safeGet, safeSet, isStringArray } from "../utils/safeStorage";
import { getAnonymousUserId } from "./userIdentityService";

const LEGACY_KEY = "kagong_favorites";

function userKey(): string {
  return `kagong_favorites_${getAnonymousUserId()}`;
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

function write(ids: string[]): void {
  safeSet(userKey(), ids);
}

export function getFavorites(): string[] {
  return read();
}

export function isFavorite(cafeId: string): boolean {
  return read().includes(cafeId);
}

export function addFavorite(cafeId: string): void {
  const current = read();
  if (!current.includes(cafeId)) write([...current, cafeId]);
}

export function removeFavorite(cafeId: string): void {
  write(read().filter((id) => id !== cafeId));
}

export function toggleFavorite(cafeId: string): void {
  if (isFavorite(cafeId)) removeFavorite(cafeId);
  else addFavorite(cafeId);
}
