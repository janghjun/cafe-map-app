import { safeGet, safeSet, isStringArray } from "../utils/safeStorage";

const KEY = "kagong_recent_views";
const MAX_ITEMS = 20;

function read(): string[] {
  return safeGet(KEY, [], isStringArray);
}

export function getRecentViews(): string[] {
  return read();
}

export function addRecentView(cafeId: string): void {
  safeSet(KEY, [cafeId, ...read().filter((id) => id !== cafeId)].slice(0, MAX_ITEMS));
}

export function clearRecentViews(): void {
  safeSet(KEY, []);
}
