import { safeGet, safeSet, isStringArray } from "../utils/safeStorage";

const KEY = "kagong_favorites";

function read(): string[] {
  return safeGet(KEY, [], isStringArray);
}

function write(ids: string[]): void {
  safeSet(KEY, ids);
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
  isFavorite(cafeId) ? removeFavorite(cafeId) : addFavorite(cafeId);
}
