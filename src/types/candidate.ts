// ⚠️ 원문(게시물 본문, 이미지, 리뷰, 외부 평점) 저장 금지
// 이 타입 파일에는 수집·검증 과정에서 추출한 구조화 데이터만 포함합니다.

import type { CafeCandidate } from "./cafe";
export type { CafeCandidate };

/** 장소 존재 검증에 사용한 외부 API 제공자 */
export type VerificationProvider = "naver_local" | "google_places" | "manual";

/**
 * 후보 카페의 실제 존재 여부 상태.
 * not_found 또는 closed_* 데이터는 삭제하지 말고 상태값으로 보관하세요.
 */
export type CafeExistenceStatus =
  | "confirmed"         // API 검색 결과와 높은 일치 → 존재 확인
  | "likely"            // 이름·주소 부분 일치 → 높은 신뢰도로 존재 추정
  | "uncertain"         // 낮은 일치도 → 운영자 직접 확인 필요
  | "not_found"         // 검색 결과 없음 — 즉시 삭제 금지, 상태값으로 보관
  | "closed_suspected"  // 폐업 의심 신호 감지 — 재확인 필요 (자동 부여 금지)
  | "closed_confirmed"; // 폐업 확정 (운영자 직접 확인 후 부여)

/**
 * 네이버 지역 검색 또는 Google Places로 후보 카페의 존재를 검증한 결과.
 * TypeScript ↔ SQL: place_verifications 테이블 참고
 */
export type PlaceVerification = {
  id: string;
  candidateId: string;          // raw_cafe_candidates.id 참조
  provider: VerificationProvider;
  queryName: string;            // 검색에 사용한 카페명 (candidate_name 원본)
  queryAddress?: string;        // 검색에 사용한 주소 (있는 경우)
  matchedName?: string;         // API 응답에서 가장 잘 매칭된 명칭
  matchedAddress?: string;      // API 응답에서 매칭된 주소
  nameMatchScore: number;       // 이름 유사도 0~1
  addressMatchScore: number;    // 주소 유사도 0~1 (주소 정보 없으면 0)
  overallMatchScore: number;    // 최종 종합 점수 0~1
  existenceStatus: CafeExistenceStatus;
  verifiedAt: string;           // ISO 8601 타임스탬프
};
