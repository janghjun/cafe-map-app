type Props = {
  score: number;
  label: string;
};

function scoreToFilled(score: number): number {
  if (score <= 0) return 0;
  if (score >= 4) return 4;
  return Math.floor(score);
}

export function ScoreBar({ score, label }: Props) {
  const filled = scoreToFilled(score);
  return (
    <div className="score-bar">
      <span className="score-bar__label">{label}</span>
      <span className="score-bar__blocks" aria-label={`${label} ${filled}/4`}>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`score-bar__block${filled >= n ? " score-bar__block--filled" : ""}`}
          />
        ))}
      </span>
    </div>
  );
}
