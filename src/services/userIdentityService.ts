import { safeGet, safeSet, safeRemove } from "../utils/safeStorage";

const STORAGE_KEY = "kagong_anon_id";

// TODO: [앱인토스 연동] 실기기에서는 이 함수를 앱인토스 getAnonymousKey()로 교체합니다.
// 교체 위치: getAnonymousUserId() 내부의 주석 처리된 블록을 활성화하세요.
// 참고 문서: docs/apps-in-toss-anonymous-key-plan.md

function generateId(): string {
  // crypto.randomUUID 지원 여부 확인 (iOS 14.1+, Chrome 92+, Android WebView)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // 폴백: 수동 UUID v4 생성
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getLocalAnonymousUserId(): string | null {
  return safeGet<string | null>(STORAGE_KEY, null, (v): v is string => typeof v === "string" && v.length > 0);
}

export function setLocalAnonymousUserId(id: string): void {
  safeSet(STORAGE_KEY, id);
}

export function clearLocalAnonymousUserId(): void {
  safeRemove(STORAGE_KEY);
}

/**
 * 현재 세션의 익명 사용자 ID를 반환합니다.
 * 없으면 새로 생성해 localStorage에 저장합니다.
 *
 * TODO: [앱인토스 연동] 아래와 같이 교체합니다.
 *   const tossKey = await window.__apptoss?.getAnonymousKey?.();
 *   if (tossKey) return tossKey;
 *   // getAnonymousKey 실패 시 local ID로 fallback
 */
export function getAnonymousUserId(): string {
  const existing = getLocalAnonymousUserId();
  if (existing) return existing;

  const newId = generateId();
  setLocalAnonymousUserId(newId);
  return newId;
}
