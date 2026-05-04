import type { UserPreference } from "../types/cafe";
import type { Coords } from "./distance";
import { recommendCafes } from "./recommendation";
import type { RecommendationResult } from "../types/cafe";

export type FallbackSuggestion = {
  label: string;
  description: string;
  /** null이면 조건 완화 타입, 숫자면 반경 확장 */
  newRadius?: 1 | 3 | 5;
  relaxCondition?: keyof Pick<UserPreference, "need24Hours" | "needOutlet" | "needWifi" | "needLateOpen">;
  /** 이 제안으로 반경을 바꿨을 때 결과 수 */
  resultCount?: number;
};

/**
 * 현재 조건에서 추천 결과가 없을 때 사용자에게 제안할 조건 완화 목록을 계산합니다.
 * 결과 수가 0인 제안은 포함하지 않습니다.
 */
export function buildFallbackSuggestions(
  cafes: ReturnType<typeof Array.prototype.filter>,
  preference: UserPreference,
  userLocation: Coords
): FallbackSuggestion[] {
  const suggestions: FallbackSuggestion[] = [];

  const tryRadius = (newRadius: 1 | 3 | 5): FallbackSuggestion | null => {
    if (newRadius <= preference.radius) return null;
    const results = recommendCafes(cafes as Parameters<typeof recommendCafes>[0], { ...preference, radius: newRadius }, userLocation, 5);
    if (results.length === 0) return null;
    return {
      label: `반경을 ${newRadius}km로 넓히기`,
      description: `${newRadius}km로 넓히면 ${results.length}곳이 있어요`,
      newRadius,
      resultCount: results.length,
    };
  };

  const tryRelax = (
    condition: FallbackSuggestion["relaxCondition"],
    label: string,
    desc: string
  ): FallbackSuggestion | null => {
    if (!preference[condition!]) return null;
    const relaxed = { ...preference, [condition!]: false };
    const results = recommendCafes(cafes as Parameters<typeof recommendCafes>[0], relaxed, userLocation, 5);
    if (results.length === 0) return null;
    return { label, description: `${desc} ${results.length}곳이 있어요`, relaxCondition: condition, resultCount: results.length };
  };

  if (preference.radius === 1) {
    const r3 = tryRadius(3);
    if (r3) suggestions.push(r3);
  }
  if (preference.radius <= 3) {
    const r5 = tryRadius(5);
    if (r5) suggestions.push(r5);
  }

  const outlet = tryRelax("needOutlet", "콘센트 조건 빼기", "콘센트 없어도");
  if (outlet) suggestions.push(outlet);

  const hours24 = tryRelax("need24Hours", "24시간 조건 빼기", "24시간 아니어도");
  if (hours24) suggestions.push(hours24);

  const wifi = tryRelax("needWifi", "와이파이 조건 빼기", "와이파이 확인 안 해도");
  if (wifi) suggestions.push(wifi);

  const late = tryRelax("needLateOpen", "늦게까지 조건 빼기", "일찍 닫혀도");
  if (late) suggestions.push(late);

  return suggestions.slice(0, 3);
}

export type { RecommendationResult };
