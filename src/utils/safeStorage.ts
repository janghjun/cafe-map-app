/**
 * localStorage unavailability, QuotaExceededError, SecurityError,
 * JSON 파싱 오류, 타입 불일치 등 모든 저장소 예외를 흡수하는 헬퍼.
 * validate를 통과하지 못하는 데이터는 fallback을 반환해 앱을 보호한다.
 */

export function safeGet<T>(
  key: string,
  fallback: T,
  validate?: (v: unknown) => v is T
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceededError / SecurityError — 저장 실패 시 조용히 무시
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 조용히 무시
  }
}

/** string[] 타입 런타임 검증 — 배열이 아니거나 원소가 string이 아닌 경우 false */
export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === "string");
}
