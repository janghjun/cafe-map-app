import type { Cafe, UserPreference } from "../types/cafe";

type Candidate = {
  label: string;
  score: number;
  required?: boolean; // user explicitly selected this condition
};

function lateLabel(cafe: Cafe): string {
  return cafe.is24Hours ? "24시간" : "늦은 영업";
}
function lateScore(cafe: Cafe): number {
  return cafe.is24Hours ? 5 : cafe.attributes.lateOpenScore;
}

function pickHighlights(candidates: Candidate[], maxCount = 4): string[] {
  const result: string[] = [];

  // Pass 1: required (user-selected) conditions with score >= 3
  for (const c of candidates) {
    if (c.required && c.score >= 3 && !result.includes(c.label)) {
      result.push(c.label);
    }
  }

  // Pass 2: high-quality (score >= 4) in priority order
  for (const c of candidates) {
    if (result.length >= maxCount) break;
    if (c.score >= 4 && !result.includes(c.label)) {
      result.push(c.label);
    }
  }

  // Pass 3: fill to 3 with score >= 3 in priority order
  if (result.length < 3) {
    for (const c of candidates) {
      if (result.length >= 3) break;
      if (c.score >= 3 && !result.includes(c.label)) {
        result.push(c.label);
      }
    }
  }

  return result.slice(0, maxCount);
}

export function getCafeHighlights(cafe: Cafe, preference?: UserPreference): string[] {
  const a = cafe.attributes;

  // No preference (DistrictBest, Favorites, RecentViews): top attributes by score
  if (!preference) {
    const candidates: Candidate[] = [
      { label: "조용함", score: a.quietScore },
      { label: "콘센트", score: a.outletScore },
      { label: "와이파이", score: a.wifiScore },
      { label: lateLabel(cafe), score: lateScore(cafe) },
      { label: "넓은 공간", score: a.spaceScore },
      { label: "단체석", score: a.groupSeatScore },
      { label: "장시간 가능", score: a.stayScore },
      { label: "1인 적합", score: a.soloScore },
    ];
    return pickHighlights(candidates, 4);
  }

  const isSolo = preference.peopleType === "solo";

  if (isSolo) {
    // 혼자: 조용함 > 콘센트 > 1인 적합 > 좌석 편의 > 장시간 가능 > 와이파이
    const candidates: Candidate[] = [
      { label: "조용함", score: preference.mood === "quiet" ? a.quietScore : Math.max(a.quietScore - 1, 0) },
      { label: "콘센트", score: a.outletScore, required: preference.needOutlet },
      { label: "1인 최적", score: a.soloScore },
      { label: "좌석 편의", score: a.seatScore },
      { label: "장시간 가능", score: a.stayScore },
      { label: "와이파이", score: a.wifiScore, required: preference.needWifi },
      { label: lateLabel(cafe), score: lateScore(cafe), required: preference.need24Hours || preference.needLateOpen },
      { label: "커피", score: a.coffeeScore },
    ];
    return pickHighlights(candidates, 4);
  }

  // 그룹: 단체석 > 넓은 공간 > 그룹 적합 > 대화 가능 > 늦은 영업 > 콘센트
  const talkableScore = preference.mood === "talkable"
    ? Math.max(0, 5 - a.quietScore)
    : 0;

  const candidates: Candidate[] = [
    { label: "단체석", score: a.groupSeatScore },
    { label: "넓은 공간", score: a.spaceScore },
    { label: "그룹 적합", score: a.groupScore },
    { label: "대화 가능", score: talkableScore },
    { label: lateLabel(cafe), score: lateScore(cafe), required: preference.need24Hours || preference.needLateOpen },
    { label: "콘센트", score: a.outletScore, required: preference.needOutlet },
    { label: "와이파이", score: a.wifiScore, required: preference.needWifi },
    { label: "장시간 가능", score: a.stayScore },
  ];
  return pickHighlights(candidates, 4);
}
