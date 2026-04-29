import type { Cafe } from "../types/cafe";
import { scoreLabel, scoreLabelKey } from "../utils/scoreLabel";
import "../styles/components.css";

type AttrRow = { label: string; score: number | undefined };

function getRows(cafe: Cafe): AttrRow[] {
  const a = cafe.attributes;
  return [
    { label: "조용함", score: a.quietScore },
    { label: "콘센트", score: a.outletScore },
    { label: "와이파이", score: a.wifiScore },
    { label: "1인 적합", score: a.soloScore },
    { label: "다인 / 단체석", score: Math.round((a.groupScore + a.groupSeatScore) / 2) },
    { label: "공간 크기", score: a.spaceScore },
    { label: "좌석 편의", score: a.seatScore },
    { label: "장시간 체류", score: a.stayScore },
    // is24Hours인 경우 lateOpenScore를 최고값으로 보정
    { label: "늦은 영업", score: cafe.is24Hours ? 5 : a.lateOpenScore },
  ];
}

type Props = { cafe: Cafe };

export function AttributeSummary({ cafe }: Props) {
  const rows = getRows(cafe);
  return (
    <div className="attr-summary">
      {rows.map(({ label, score }) => (
        <div key={label} className="attr-row">
          <span className="attr-label">{label}</span>
          <span className={`attr-badge attr-badge--${scoreLabelKey(score)}`}>
            {scoreLabel(score)}
          </span>
        </div>
      ))}
    </div>
  );
}
