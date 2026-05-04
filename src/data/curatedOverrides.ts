import type { CafeVerificationStatus } from "../types/cafe";

/**
 * 운영자가 직접 확인한 카페만 여기에 등록합니다.
 * 자동 생성 금지. docs/curation-guideline.md 기준을 충족한 경우에만 추가하세요.
 *
 * 필드 설명:
 *   - verificationStatus: "curated" 고정
 *   - 점수 필드: 운영자가 직접 확인한 값 (0~5)
 *   - curatorNote: 1~2문장, 외부 리뷰 원문 복사 금지
 *   - lastVerifiedAt: 확인 날짜 (YYYY-MM-DD)
 */

export type CuratedOverride = {
  verificationStatus: CafeVerificationStatus;
  quietScore?: number;
  soloScore?: number;
  groupScore?: number;
  outletScore?: number;
  wifiScore?: number;
  stayScore?: number;
  coffeeScore?: number;
  dessertScore?: number;
  lateOpenScore?: number;
  spaceScore?: number;
  seatScore?: number;
  groupSeatScore?: number;
  curatorNote?: string;
  lastVerifiedAt?: string;
};

/**
 * 카페 ID → override 정보 매핑
 * 운영자 확인 완료 후 아래에 항목을 추가하세요.
 *
 * TODO: docs/curated-candidate-list.md 의 20개 후보를 운영자가
 *       직접 방문/확인한 뒤 아래에 등록하세요.
 */
export const curatedCafeOverrides: Record<string, CuratedOverride> = {
  // ─── 예시 구조 (실제 운영자 확인 후 채우기) ─────────────────────────────
  //
  // "cafe-uuid-here": {
  //   verificationStatus: "curated",
  //   quietScore: 4,
  //   outletScore: 5,
  //   wifiScore: 4,
  //   stayScore: 5,
  //   soloScore: 5,
  //   groupScore: 3,
  //   curatorNote: "혼자 조용히 노트북 작업하기 좋은 곳으로 운영자가 직접 확인했어요.",
  //   lastVerifiedAt: "2026-05-04",
  // },
  //
  // ─── 실제 데이터는 운영자 확인 후 채우세요 ──────────────────────────────
};
