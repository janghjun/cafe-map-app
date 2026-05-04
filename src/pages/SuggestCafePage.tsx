import { useState } from "react";
import type { CafeTag } from "../types/cafe";
import {
  type UpdateReasonType,
  UPDATE_REASON_LABELS,
  addSuggestion,
  addUpdateSuggestion,
} from "../services/suggestionService";
import { FilterChip } from "../components/FilterChip";
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

const UPDATE_REASON_KEYS = Object.keys(UPDATE_REASON_LABELS) as UpdateReasonType[];

type Props = {
  onBack: () => void;
  mode?: "new" | "update";
  targetCafeId?: string;
  targetCafeName?: string;
};

export function SuggestCafePage({
  onBack,
  mode = "new",
  targetCafeId,
  targetCafeName = "",
}: Props) {
  const isUpdate = mode === "update";

  const [cafeName, setCafeName] = useState(isUpdate ? targetCafeName : "");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<CafeTag[]>([]);
  const [updateReasonType, setUpdateReasonType] = useState<UpdateReasonType>("closed");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ cafeName?: string; updateReasonType?: string }>({});

  function toggleTag(tag: CafeTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!isUpdate && !cafeName.trim()) next.cafeName = "카페 이름을 입력해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    if (isUpdate && targetCafeId) {
      addUpdateSuggestion(targetCafeId, targetCafeName, updateReasonType, reason);
      trackEvent("suggestion_submit", { mode: "update", updateReasonType });
    } else {
      addSuggestion(cafeName, address, reason, tags);
      trackEvent("suggestion_submit", { mode: "new", tagCount: tags.length });
    }
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
          <h2 className="suggest-success__title">
            {isUpdate ? "제보해주셔서 감사해요!" : "제안해주셔서 감사해요!"}
          </h2>
          <p className="suggest-success__body">
            {isUpdate
              ? <>운영팀이 확인 후 정보를 업데이트할게요.<br />제출 즉시 카페 정보가 바뀌지는 않아요.</>
              : <>제안해주신 카페는 검수 후 반영돼요.<br />좋은 카공 장소를 함께 모아가요.</>
            }
          </p>
          <button type="button" className="btn-primary" onClick={onBack}>
            {isUpdate ? "카페로 돌아가기" : "홈으로 돌아가기"}
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
        <h1 className="suggest-title">
          {isUpdate ? "정보 수정 제안" : "카페 제안하기"}
        </h1>
        <p className="suggest-desc">
          {isUpdate ? (
            <>
              정보가 달라진 부분을 알려주세요.
              <br />운영팀이 확인 후 반영해요.
              <br /><span className="suggest-desc--notice">제출 즉시 카페 정보가 바뀌지 않아요.</span>
            </>
          ) : (
            <>
              알고 계신 인천 카공 카페를 알려주세요.
              <br />운영자 검수 후 앱에 반영돼요.
              <br /><span className="suggest-desc--notice">제출 즉시 공개되지 않아요.</span>
            </>
          )}
        </p>
      </header>

      <form className="suggest-form" onSubmit={handleSubmit} noValidate>
        {/* 대상 카페명 (update 모드: 읽기 전용 표시) */}
        {isUpdate ? (
          <div className="suggest-field">
            <p className="suggest-label">대상 카페</p>
            <p className="suggest-target-cafe">{targetCafeName}</p>
          </div>
        ) : (
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
        )}

        {/* 수정 유형 (update 모드 전용) */}
        {isUpdate && (
          <div className="suggest-field">
            <p className="suggest-label">
              어떤 부분이 달라요? <span className="suggest-required">*</span>
            </p>
            <div className="chip-row chip-row--wrap">
              {UPDATE_REASON_KEYS.map((key) => (
                <FilterChip
                  key={key}
                  label={UPDATE_REASON_LABELS[key]}
                  selected={updateReasonType === key}
                  onClick={() => setUpdateReasonType(key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 주소 (new 모드 전용) */}
        {!isUpdate && (
          <div className="suggest-field">
            <label className="suggest-label" htmlFor="suggest-address">
              주소 <span className="suggest-required">*</span>
            </label>
            <input
              id="suggest-address"
              type="text"
              className="suggest-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 인천 연수구 송도동 ..."
              maxLength={100}
            />
          </div>
        )}

        <div className="suggest-field">
          <label className="suggest-label" htmlFor="suggest-reason">
            {isUpdate ? "추가로 알려주실 내용" : "추천 이유"}
            <span className="suggest-optional"> (선택)</span>
          </label>
          <textarea
            id="suggest-reason"
            className="suggest-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isUpdate ? "구체적인 상황을 적어주시면 도움이 돼요." : "어떤 점이 카공하기 좋았나요?"}
            maxLength={200}
            rows={3}
          />
        </div>

        {/* 카공 조건 태그 (new 모드 전용) */}
        {!isUpdate && (
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
        )}

        <button type="submit" className="btn-primary">
          {isUpdate ? "수정 제안 제출하기" : "제안 제출하기"}
        </button>
      </form>
    </div>
  );
}
