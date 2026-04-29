import { useState, type FormEvent } from "react";
import type { CafeTag } from "../types/cafe";
import { FilterChip } from "../components/FilterChip";
import { addSuggestion } from "../services/suggestionService";
import { trackEvent } from "../services/logService";
import "../styles/pages.css";
import "../styles/suggest.css";

const ALL_TAGS: CafeTag[] = [
  "quiet", "talkable", "outlet", "wifi",
  "late_open", "24hours", "coffee", "dessert", "solo", "group",
];

const TAG_LABELS: Record<CafeTag, string> = {
  quiet: "조용해요",
  talkable: "대화 가능한 분위기예요",
  outlet: "콘센트가 있어요",
  wifi: "와이파이가 좋아요",
  late_open: "늦게까지 열어요",
  "24hours": "24시간이에요",
  coffee: "커피가 괜찮아요",
  dessert: "디저트가 괜찮아요",
  solo: "혼자 공부하기 좋아요",
  group: "2~4명이 앉기 좋아요",
};

type Props = {
  onBack: () => void;
};

export function SuggestCafePage({ onBack }: Props) {
  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<CafeTag[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ cafeName?: string; address?: string }>({});

  function toggleTag(tag: CafeTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!cafeName.trim()) next.cafeName = "카페 이름을 입력해주세요.";
    if (!address.trim()) next.address = "주소를 입력해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addSuggestion(cafeName, address, reason, tags);
    trackEvent("suggestion_submit", { tagCount: tags.length });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="suggest-page">
        <div className="page-top-bar">
          <button type="button" className="btn-back" onClick={onBack}>
            ← 뒤로
          </button>
        </div>
        <div className="suggest-success">
          <p className="suggest-success__icon">✅</p>
          <h2 className="suggest-success__title">제안해주셔서 감사해요!</h2>
          <p className="suggest-success__body">
            제안해주신 카페는 검수 후 반영돼요.
            <br />좋은 카공 장소를 함께 모아가요.
          </p>
          <button type="button" className="btn-primary" onClick={onBack}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      <header className="suggest-header">
        <h1 className="suggest-title">카페 제안하기</h1>
        <p className="suggest-desc">
          알고 계신 인천 카공 카페를 알려주세요.
          <br />운영자 검수 후 앱에 반영돼요.
          <br /><span className="suggest-desc--notice">제출 즉시 공개되지 않아요.</span>
        </p>
      </header>

      <form className="suggest-form" onSubmit={handleSubmit} noValidate>
        <div className="suggest-field">
          <label className="suggest-label" htmlFor="suggest-cafe-name">
            카페 이름 <span className="suggest-required">*</span>
          </label>
          <input
            id="suggest-cafe-name"
            type="text"
            className={`suggest-input${errors.cafeName ? " suggest-input--error" : ""}`}
            value={cafeName}
            onChange={(e) => {
              setCafeName(e.target.value);
              if (errors.cafeName) setErrors((prev) => ({ ...prev, cafeName: undefined }));
            }}
            placeholder="예: 카페 온도"
            maxLength={60}
          />
          {errors.cafeName && <p className="suggest-error">{errors.cafeName}</p>}
        </div>

        <div className="suggest-field">
          <label className="suggest-label" htmlFor="suggest-address">
            주소 <span className="suggest-required">*</span>
          </label>
          <input
            id="suggest-address"
            type="text"
            className={`suggest-input${errors.address ? " suggest-input--error" : ""}`}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
            }}
            placeholder="예: 인천 연수구 송도동 ..."
            maxLength={100}
          />
          {errors.address && <p className="suggest-error">{errors.address}</p>}
        </div>

        <div className="suggest-field">
          <label className="suggest-label" htmlFor="suggest-reason">
            추천 이유 <span className="suggest-optional">(선택)</span>
          </label>
          <textarea
            id="suggest-reason"
            className="suggest-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="어떤 점이 카공하기 좋았나요?"
            maxLength={200}
            rows={3}
          />
        </div>

        <div className="suggest-field">
          <p className="suggest-label">
            카공 조건 <span className="suggest-optional">(선택 · 해당되는 항목을 골라주세요)</span>
          </p>
          <div className="chip-row chip-row--wrap">
            {ALL_TAGS.map((tag) => (
              <FilterChip
                key={tag}
                label={TAG_LABELS[tag]}
                selected={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          제안 제출하기
        </button>
      </form>
    </div>
  );
}
