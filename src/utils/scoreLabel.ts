export type ScoreLabel = "좋음" | "보통" | "낮음" | "정보 부족";
export type ScoreLabelKey = "good" | "fair" | "low" | "unknown";

export function scoreLabel(score: number | undefined): ScoreLabel {
  if (score === undefined || score === 0) return "정보 부족";
  if (score >= 4) return "좋음";
  if (score >= 3) return "보통";
  return "낮음";
}

export function scoreLabelKey(score: number | undefined): ScoreLabelKey {
  if (score === undefined || score === 0) return "unknown";
  if (score >= 4) return "good";
  if (score >= 3) return "fair";
  return "low";
}
