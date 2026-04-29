import type { CafeTag } from "../types/cafe";
import { safeGet, safeSet } from "../utils/safeStorage";

export type UserSuggestion = {
  id: string;
  cafeName: string;
  address: string;
  reason: string;
  tags: CafeTag[];
  status: "pending";
  submittedAt: string;
};

const KEY = "kagong_suggestions";

function loadAll(): UserSuggestion[] {
  return safeGet(KEY, [], (v): v is UserSuggestion[] => Array.isArray(v));
}

export function getSuggestions(): UserSuggestion[] {
  return loadAll();
}

export function addSuggestion(
  cafeName: string,
  address: string,
  reason: string,
  tags: CafeTag[]
): UserSuggestion {
  const suggestion: UserSuggestion = {
    id: `suggestion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cafeName: cafeName.trim(),
    address: address.trim(),
    reason: reason.trim(),
    tags,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  safeSet(KEY, [...loadAll(), suggestion]);
  return suggestion;
}
