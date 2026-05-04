import { useState, useEffect } from "react";
import {
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
  markNeedsCheck,
  type SuggestionStatus,
  type UserSuggestion,
} from "../../services/suggestionService";
import {
  fetchPendingCandidates,
  isSupabaseModeActive,
  type RawCandidate,
} from "../../services/adminCandidateService";
import "../../styles/admin.css";

// TODO: [보안] 현재는 ?mode=admin URL 파라미터로 진입하는 개발 도구 수준입니다.
// 실서비스 전환 시 Supabase Auth 또는 별도 인증으로 보호해야 합니다.
// docs/admin-supabase-review-plan.md 참고

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  needs_check: "재확인",
};

const STATUS_FILTERS: Array<"all" | SuggestionStatus> = [
  "all", "pending", "approved", "rejected", "needs_check",
];

type Tab = "suggestions" | "candidates";

type Props = {
  onBack: () => void;
  onLogout?: () => void;
};

export function AdminCandidateListPage({ onBack, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("suggestions");
  const [filter, setFilter] = useState<"all" | SuggestionStatus>("pending");
  const [list, setList] = useState<UserSuggestion[]>(() => getSuggestions());
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<RawCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const supMode = isSupabaseModeActive();

  useEffect(() => {
    if (activeTab === "candidates" && !candidatesLoaded && supMode) {
      setCandidatesLoading(true);
      fetchPendingCandidates().then((data) => {
        setCandidates(data);
        setCandidatesLoading(false);
        setCandidatesLoaded(true);
      });
    }
  }, [activeTab, candidatesLoaded, supMode]);

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
        <h1 className="admin-title">카페 검수</h1>
        <span className="admin-badge">내부 운영 전용</span>
        {onLogout && (
          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn${activeTab === "suggestions" ? " --active" : ""}`}
          onClick={() => setActiveTab("suggestions")}
        >
          사용자 제안
          <span className="admin-filter-count">{list.filter((s) => s.status === "pending").length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn${activeTab === "candidates" ? " --active" : ""}`}
          onClick={() => setActiveTab("candidates")}
        >
          수집 후보
          {candidatesLoaded && <span className="admin-filter-count">{candidates.length}</span>}
        </button>
      </div>

      {/* 사용자 제안 탭 */}
      {activeTab === "suggestions" && (
        <>
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

                      {(s.status === "pending" || s.status === "needs_check") && (
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
                          <button type="button" className="admin-btn --approve" onClick={() => handleApprove(s.id)}>승인</button>
                          <button type="button" className="admin-btn --needs-check" onClick={() => handleNeedsCheck(s.id)}>재확인</button>
                          <button type="button" className="admin-btn --reject" onClick={() => handleReject(s.id)}>반려</button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* 수집 후보 탭 */}
      {activeTab === "candidates" && (
        <div className="admin-candidates">
          {!supMode ? (
            <div className="admin-empty">
              <p>Supabase 연결 시 수집 후보를 확인할 수 있어요.</p>
              <p className="admin-empty__sub">VITE_DATA_SOURCE=supabase 환경에서 사용 가능합니다.</p>
            </div>
          ) : candidatesLoading ? (
            <div className="admin-empty">후보 목록을 불러오는 중...</div>
          ) : candidates.length === 0 ? (
            <div className="admin-empty">
              검수 대기 중인 수집 후보가 없어요.
              <p className="admin-empty__sub">scripts/insert-candidates.ts로 후보를 적재한 뒤 확인하세요.</p>
            </div>
          ) : (
            <>
              <p className="admin-candidates__notice">
                ⚠ 승인해도 즉시 추천에 반영되지 않습니다. Supabase에서 직접 cafes 테이블에 추가해야 합니다.
              </p>
              <ul className="admin-list">
                {candidates.map((c) => (
                  <li key={c.id} className="admin-card --pending">
                    <div className="admin-card__header">
                      <span className="admin-card__name">{c.candidateName}</span>
                      <span className="admin-card__confidence">
                        신뢰도 {Math.round(c.confidenceScore * 100)}%
                      </span>
                    </div>
                    {c.candidateAddress && (
                      <div className="admin-card__address">{c.candidateAddress}</div>
                    )}
                    <div className="admin-card__meta">
                      <span>키워드: {c.sourceKeyword}</span>
                      {c.existenceStatus && <span> · 존재: {c.existenceStatus}</span>}
                    </div>
                    <div className="admin-card__date">
                      수집: {new Date(c.createdAt).toLocaleString("ko-KR")}
                    </div>
                    <div className="admin-card__actions admin-card__actions--todo">
                      <span className="admin-todo-note">TODO: 승인/반려 기능 — Phase B에서 구현</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
