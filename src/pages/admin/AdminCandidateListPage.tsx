import { useState } from "react";
import {
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
  markNeedsCheck,
  type SuggestionStatus,
  type UserSuggestion,
} from "../../services/suggestionService";
import "../../styles/admin.css";

// TODO: [Supabase 전환] 이 화면은 내부 운영자 전용입니다.
// 현재는 ?mode=admin URL 파라미터로 진입하는 개발 도구 수준입니다.
// 실서비스 전환 시 반드시 인증(admin role / service_role key)을 적용하고,
// 일반 사용자 navStack에서 완전히 분리해야 합니다.
//
// TODO: [Phase B — raw_cafe_candidates 연동]
// scripts/insert-candidates.ts로 Supabase에 적재된 후보는 이 화면에서 보이지 않습니다.
// 현재 이 화면은 localStorage의 user_suggestions (사용자 직접 제안)만 표시합니다.
// Phase B에서 아래 작업이 필요합니다:
//   1. VITE_DATA_SOURCE=supabase 모드에서 raw_cafe_candidates를 Supabase에서 조회
//   2. review_status=pending 항목을 이 화면에 통합 또는 별도 탭으로 분리
//   3. 승인 시 raw_cafe_candidates.review_status 업데이트 (service_role key 필요)
//   4. ?mode=admin 접근을 Supabase Auth 또는 별도 인증으로 보호

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  needs_check: "재확인",
};

const STATUS_FILTERS: Array<"all" | SuggestionStatus> = [
  "all", "pending", "approved", "rejected", "needs_check",
];

type Props = {
  onBack: () => void;
  onLogout?: () => void;
};

export function AdminCandidateListPage({ onBack, onLogout }: Props) {
  const [filter, setFilter] = useState<"all" | SuggestionStatus>("pending");
  const [list, setList] = useState<UserSuggestion[]>(() => getSuggestions());
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function refresh() {
    setList(getSuggestions());
  }

  function handleApprove(id: string) {
    approveSuggestion(id);
    refresh();
  }

  function handleReject(id: string) {
    rejectSuggestion(id, rejectNote[id]);
    setRejectNote((prev) => { const n = { ...prev }; delete n[id]; return n; });
    refresh();
  }

  function handleNeedsCheck(id: string) {
    markNeedsCheck(id, rejectNote[id]);
    refresh();
  }

  const filtered = filter === "all" ? list : list.filter((s) => s.status === filter);

  return (
    <div className="admin-page">
      <div className="admin-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
        <h1 className="admin-title">카페 제안 검수</h1>
        <span className="admin-badge">내부 운영 전용</span>
        {onLogout && (
          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        )}
      </div>

      <div className="admin-filter-bar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`admin-filter-btn${filter === f ? " --active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "전체" : STATUS_LABELS[f]}
            <span className="admin-filter-count">
              {f === "all"
                ? list.length
                : list.filter((s) => s.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">해당 상태의 제안이 없어요.</div>
      ) : (
        <ul className="admin-list">
          {filtered.map((s) => (
            <li key={s.id} className={`admin-card --${s.status}`}>
              <div
                className="admin-card__header"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              >
                <span className="admin-card__name">{s.cafeName}</span>
                <span className={`admin-status-badge --${s.status}`}>
                  {STATUS_LABELS[s.status]}
                </span>
              </div>

              <div className="admin-card__address">{s.address}</div>
              <div className="admin-card__date">
                제출: {new Date(s.submittedAt).toLocaleString("ko-KR")}
              </div>

              {expandedId === s.id && (
                <div className="admin-card__detail">
                  {s.reason && (
                    <p className="admin-card__reason">
                      <strong>추천 이유:</strong> {s.reason}
                    </p>
                  )}
                  {s.tags.length > 0 && (
                    <p className="admin-card__tags">
                      <strong>태그:</strong> {s.tags.join(", ")}
                    </p>
                  )}
                  {s.reviewNote && (
                    <p className="admin-card__note">
                      <strong>운영자 메모:</strong> {s.reviewNote}
                    </p>
                  )}
                  {s.reviewedAt && (
                    <p className="admin-card__reviewed">
                      검수일: {new Date(s.reviewedAt).toLocaleString("ko-KR")}
                    </p>
                  )}

                  {s.status === "pending" || s.status === "needs_check" ? (
                    <div className="admin-card__actions">
                      <input
                        type="text"
                        className="admin-note-input"
                        placeholder="운영자 메모 (선택)"
                        value={rejectNote[s.id] ?? ""}
                        onChange={(e) =>
                          setRejectNote((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="admin-btn --approve"
                        onClick={() => handleApprove(s.id)}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="admin-btn --needs-check"
                        onClick={() => handleNeedsCheck(s.id)}
                      >
                        재확인
                      </button>
                      <button
                        type="button"
                        className="admin-btn --reject"
                        onClick={() => handleReject(s.id)}
                      >
                        반려
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
