import type { CafeTag } from "../types/cafe";
import { safeGet, safeSet } from "../utils/safeStorage";

export type SuggestionStatus = "pending" | "approved" | "rejected" | "needs_check";

export type SuggestionMode = "new" | "update";

export type UpdateReasonType = "closed" | "hours" | "outlet" | "space" | "other";

export const UPDATE_REASON_LABELS: Record<UpdateReasonType, string> = {
  closed: "폐업/이전 같아요",
  hours:  "영업시간이 달라요",
  outlet: "콘센트 정보가 달라요",
  space:  "좌석/공간 정보가 달라요",
  other:  "기타",
};

export type UserSuggestion = {
  id: string;
  mode: SuggestionMode;
  cafeName: string;
  address: string;
  reason: string;
  tags: CafeTag[];
  status: SuggestionStatus;
  submittedAt: string;
  // update 모드 전용
  targetCafeId?: string;
  updateReasonType?: UpdateReasonType;
  reviewNote?: string;
  reviewedAt?: string;
};

const KEY = "kagong_suggestions";

function loadAll(): UserSuggestion[] {
  return safeGet(KEY, [], (v): v is UserSuggestion[] => Array.isArray(v));
}

function saveAll(list: UserSuggestion[]): void {
  safeSet(KEY, list);
}

export function getSuggestions(): UserSuggestion[] {
  return loadAll();
}

export function getSuggestionsByStatus(status: SuggestionStatus): UserSuggestion[] {
  return loadAll().filter((s) => s.status === status);
}

export function addSuggestion(
  cafeName: string,
  address: string,
  reason: string,
  tags: CafeTag[]
): UserSuggestion {
  const suggestion: UserSuggestion = {
    id: `suggestion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: "new",
    cafeName: cafeName.trim(),
    address: address.trim(),
    reason: reason.trim(),
    tags,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  saveAll([...loadAll(), suggestion]);
  return suggestion;
}

/**
 * 제안 상태를 변경합니다.
 * 승인된 후보는 이 함수로 상태만 변경되며, cafes 테이블/mock 데이터에 자동 반영되지 않습니다.
 * 최종 cafes 반영은 운영자가 직접 Supabase Studio 또는 seed 스크립트를 통해 수행합니다.
 * TODO: [Supabase 전환] 이 함수를 Supabase admin API 호출로 교체하세요. (service_role key 필요)
 */
export function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
  reviewNote?: string
): void {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return;
  list[idx] = {
    ...list[idx],
    status,
    reviewNote: reviewNote ?? list[idx].reviewNote,
    reviewedAt: new Date().toISOString(),
  };
  saveAll(list);
}

export function approveSuggestion(id: string, reviewNote?: string): void {
  updateSuggestionStatus(id, "approved", reviewNote);
}

export function rejectSuggestion(id: string, reviewNote?: string): void {
  updateSuggestionStatus(id, "rejected", reviewNote);
}

export function markNeedsCheck(id: string, reviewNote?: string): void {
  updateSuggestionStatus(id, "needs_check", reviewNote);
}

export function addUpdateSuggestion(
  targetCafeId: string,
  targetCafeName: string,
  updateReasonType: UpdateReasonType,
  reason: string
): UserSuggestion {
  const suggestion: UserSuggestion = {
    id: `suggestion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: "update",
    cafeName: targetCafeName,
    address: "",
    reason: reason.trim(),
    tags: [],
    status: "pending",
    submittedAt: new Date().toISOString(),
    targetCafeId,
    updateReasonType,
  };
  saveAll([...loadAll(), suggestion]);
  return suggestion;
}
