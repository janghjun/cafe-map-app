import type { Cafe, UserPreference } from "../types/cafe";

// --- Sentence 1: who × mood ---
function buildPeopleMoodSentence(cafe: Cafe, pref: UserPreference): string {
  const a = cafe.attributes;

  if (pref.peopleType === "solo") {
    if (pref.mood === "quiet") {
      if (a.quietScore >= 5 && a.soloScore >= 4) return "혼자 조용히 집중하기에 최적인 분위기예요.";
      if (a.quietScore >= 4 && a.soloScore >= 4) return "혼자 조용히 집중하기 좋은 분위기예요.";
      if (a.quietScore >= 4) return "조용한 분위기에서 혼자 공부하기 좋아요.";
      if (a.soloScore >= 4) return "1인 카공에 맞는 좌석 구성이에요.";
      return "혼자 집중하기에 무리 없는 공간이에요.";
    }
    // talkable solo
    if (a.soloScore >= 4) return "자유로운 분위기에서 혼자 이용하기 좋아요.";
    return "혼자도 편하게 이용할 수 있는 공간이에요.";
  }

  if (pref.peopleType === "group_2_4") {
    if (pref.mood === "quiet") {
      if (a.groupScore >= 4 && a.groupSeatScore >= 4) return "조용하게 소그룹 스터디를 할 수 있는 구성이에요.";
      if (a.groupScore >= 4) return "조용한 분위기에서 소그룹 스터디를 하기 좋아요.";
      return "소그룹이 조용히 이용할 수 있는 공간이에요.";
    }
    // talkable group_2_4
    if (a.groupSeatScore >= 4 && a.groupScore >= 4) return "2~4명이 나란히 앉아 자유롭게 스터디하기 좋아요.";
    if (a.groupScore >= 4) return "소그룹이 함께 공부하기에 어울리는 공간이에요.";
    return "소그룹도 이용할 수 있는 공간이에요.";
  }

  // group_5_plus
  if (a.groupSeatScore >= 4 && a.spaceScore >= 4) return "5명 이상 단체도 자리를 잡기 좋은 넓은 공간이에요.";
  if (a.groupSeatScore >= 4) return "5명 이상 단체도 자리를 잡기 수월해요.";
  if (a.groupScore >= 4) return "단체 카공에도 활용할 수 있는 공간이에요.";
  return "방문 전 단체석 여부를 확인하는 걸 권장해요.";
}

// --- Sentence 2: conditions × quality ---
function buildConditionSentence(cafe: Cafe, pref: UserPreference, used: Set<string>): string | null {
  const a = cafe.attributes;

  // Collect matched user-selected conditions
  const good: string[] = [];
  if (pref.needOutlet && a.outletScore >= 4) good.push("콘센트");
  if (pref.needWifi && a.wifiScore >= 4) good.push("와이파이");
  if (pref.need24Hours && cafe.is24Hours) good.push("24시간 운영");
  else if (pref.needLateOpen && !cafe.is24Hours && a.lateOpenScore >= 4) good.push("늦은 영업");
  else if (pref.needLateOpen && cafe.is24Hours) good.push("24시간 운영");

  if (good.length >= 2) {
    const joined = good.slice(0, 2).join("와 ");
    if (good.includes("콘센트") && good.includes("와이파이")) {
      return "콘센트와 와이파이 조건이 좋아 노트북 작업에도 적합해요.";
    }
    return `${joined} 조건이 모두 갖춰져 있어요.`;
  }

  if (good.length === 1) {
    if (good[0] === "콘센트") return "노트북 작업에 필요한 콘센트를 사용할 수 있어요.";
    if (good[0] === "와이파이") return "빠른 와이파이로 온라인 작업에도 적합해요.";
    if (good[0] === "24시간 운영") return "24시간 운영이라 시간 걱정 없이 방문할 수 있어요.";
    if (good[0] === "늦은 영업") return "늦은 시간까지 영업해 야간 카공도 가능해요.";
  }

  // No specific condition matched — use best available quality indicator
  if (a.stayScore >= 4 && !used.has("머물")) return "오래 머물기 부담이 적어 집중 시간이 긴 날에 좋아요.";
  if (a.outletScore >= 4 && !pref.needOutlet && !used.has("콘센트")) return "콘센트 자리가 충분해 노트북 작업에도 편해요.";
  if (a.wifiScore >= 4 && !pref.needWifi && !used.has("와이파이")) return "와이파이 환경이 좋아 온라인 작업에도 문제없어요.";
  if (cafe.is24Hours && !used.has("24시간")) return "24시간 운영이라 시간 걱정 없이 이용할 수 있어요.";
  if (a.lateOpenScore >= 4 && !used.has("늦은")) return "늦은 시간까지 영업해 여유롭게 이용할 수 있어요.";

  return null;
}

// --- Sentence 3: bonus ---
function buildBonusSentence(cafe: Cafe, pref: UserPreference, used: Set<string>): string | null {
  const a = cafe.attributes;

  if (pref.careCoffee && a.coffeeScore >= 4 && !used.has("커피")) return "커피 퀄리티가 좋아 오래 머물어도 만족스러워요.";
  if (pref.careDessert && a.dessertScore >= 4 && !used.has("디저트")) return "디저트 종류가 다양해 쉬는 시간에 즐기기 좋아요.";
  if (a.stayScore >= 5 && !used.has("머물")) return "오래 머물기 부담이 적어 집중 시간이 긴 날에 좋아요.";
  if (a.quietScore >= 5 && pref.mood === "quiet" && !used.has("조용")) return "특히 조용한 분위기로 집중력을 높이는 데 도움이 돼요.";
  if (a.spaceScore >= 4 && pref.peopleType !== "solo" && !used.has("넓")) return "공간이 넓어 답답하지 않게 이용할 수 있어요.";

  return null;
}

// --- Guaranteed fallback for 2nd sentence ---
function buildFallbackSentence(cafe: Cafe, pref: UserPreference, used: Set<string>): string {
  const a = cafe.attributes;

  // User selected a condition that the cafe partially meets (보통 수준)
  if (pref.needOutlet && a.outletScore >= 3 && !used.has("콘센트")) return "콘센트 자리를 이용할 수 있어요.";
  if (pref.needWifi && a.wifiScore >= 3 && !used.has("와이파이")) return "와이파이 이용이 가능해요.";

  // General quality fallbacks
  if (a.stayScore >= 3 && !used.has("머물")) return "체류 환경이 양호해 카공하기 나쁘지 않아요.";
  if (a.outletScore >= 3 && !used.has("콘센트")) return "콘센트 자리를 이용할 수 있어요.";

  return "확인된 카공 조건을 기준으로 추천드려요.";
}

// Main export
export function buildRecommendationReasons(cafe: Cafe, preference: UserPreference): string[] {
  const sentences: string[] = [];

  // S1: people × mood (always generated)
  const s1 = buildPeopleMoodSentence(cafe, preference);
  sentences.push(s1);

  // Build a topic-keyword set to prevent duplicate topics
  function topics(): Set<string> {
    const joined = sentences.join(" ");
    return new Set([
      joined.includes("조용") ? "조용" : "",
      joined.includes("머물") ? "머물" : "",
      joined.includes("콘센트") ? "콘센트" : "",
      joined.includes("와이파이") ? "와이파이" : "",
      joined.includes("24시간") ? "24시간" : "",
      joined.includes("늦은") ? "늦은" : "",
      joined.includes("커피") ? "커피" : "",
      joined.includes("디저트") ? "디저트" : "",
      joined.includes("넓") ? "넓" : "",
    ].filter(Boolean));
  }

  // S2: conditions / quality (always generated — fallback guarantees it)
  const s2 = buildConditionSentence(cafe, preference, topics());
  if (s2) {
    sentences.push(s2);
  } else {
    sentences.push(buildFallbackSentence(cafe, preference, topics()));
  }

  // S3: bonus (optional, only if < 3 sentences)
  if (sentences.length < 3) {
    const s3 = buildBonusSentence(cafe, preference, topics());
    if (s3) sentences.push(s3);
  }

  return sentences.slice(0, 3);
}
