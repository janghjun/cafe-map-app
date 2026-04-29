import { useState } from "react";
import "../styles/components.css";

const CRITERIA = [
  { key: "distance", label: "거리", desc: "반경 내 가까울수록 높은 점수" },
  { key: "people", label: "인원 적합성", desc: "1인 / 소그룹 / 단체 조건 기반 매칭" },
  { key: "quiet", label: "분위기", desc: "조용함 / 대화 가능 선택에 따라 가중치 적용" },
  { key: "outlet", label: "콘센트", desc: "콘센트 필요 선택 시 반영" },
  { key: "wifi", label: "와이파이", desc: "와이파이 필요 선택 시 반영" },
  { key: "space", label: "공간 / 좌석", desc: "좌석 편의 및 공간 크기 반영" },
  { key: "hours", label: "영업시간", desc: "늦은 영업 / 24시간 조건 반영" },
  { key: "menu", label: "커피 / 디저트", desc: "커피 또는 디저트 중요 선택 시 반영" },
];

export function RecommendationCriteria() {
  const [open, setOpen] = useState(false);

  return (
    <div className="criteria-wrap">
      <button
        type="button"
        className="criteria-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        추천 기준 보기 {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="criteria-box">
          <p className="criteria-intro">
            거리와 카공 조건, 카페 속성을 종합해 점수를 내요.
          </p>
          <ul className="criteria-list">
            {CRITERIA.map((c) => (
              <li key={c.key} className="criteria-item">
                <span className="criteria-item__label">{c.label}</span>
                <span className="criteria-item__desc">{c.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
