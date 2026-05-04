import { isSupabaseConfigured, getSupabaseClient } from "./supabaseClient";

export type RawCandidate = {
  id: string;
  candidateName: string;
  candidateAddress?: string;
  sourceKeyword: string;
  confidenceScore: number;
  existenceStatus?: string;
  reviewStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

type RawCandidateRow = {
  id: string;
  candidate_name: string;
  candidate_address?: string | null;
  source_keyword: string;
  confidence_score: number;
  existence_status?: string | null;
  review_status: "pending" | "approved" | "rejected";
  created_at: string;
};

function mapRow(row: RawCandidateRow): RawCandidate {
  return {
    id: row.id,
    candidateName: row.candidate_name,
    candidateAddress: row.candidate_address ?? undefined,
    sourceKeyword: row.source_keyword,
    confidenceScore: row.confidence_score,
    existenceStatus: row.existence_status ?? undefined,
    reviewStatus: row.review_status,
    createdAt: row.created_at,
  };
}

/**
 * Supabase raw_cafe_candidates 테이블에서 pending 후보를 조회합니다.
 * VITE_DATA_SOURCE=supabase 환경에서만 동작합니다.
 *
 * 보안 주의: 현재 RLS 미적용 상태입니다.
 *   프로덕션 전 반드시 RLS를 적용하고 관리자 인증을 추가하세요.
 *   (docs/admin-supabase-review-plan.md 참고)
 */
export async function fetchPendingCandidates(): Promise<RawCandidate[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseClient()
    .from("raw_cafe_candidates")
    .select("id, candidate_name, candidate_address, source_keyword, confidence_score, existence_status, review_status, created_at")
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("raw_cafe_candidates 조회 실패:", error.message);
    return [];
  }

  return (data as RawCandidateRow[]).map(mapRow);
}

export function isSupabaseModeActive(): boolean {
  const dataSource = import.meta.env.VITE_DATA_SOURCE as string | undefined;
  return dataSource === "supabase" && isSupabaseConfigured();
}
