// 장소 이름·주소 매칭 순수 함수 모음
// API 호출 없음. 외부 의존성 없음. 수집된 후보와 검증 결과를 비교하는 계산 전용.
//
// ⚠️ 이 모듈은 API 응답 원문을 저장하지 않습니다.
// 매칭 점수와 상태값만 반환하며, 입력 텍스트는 호출 후 참조를 끊어야 합니다.

import type { CafeExistenceStatus } from "../types/candidate";

// ────────────────────────────────────────────────────────────
// 정규화
// ────────────────────────────────────────────────────────────

/**
 * 카페명을 비교 가능한 형태로 정규화합니다.
 * - HTML 태그 제거 (<b>, </b> 등 — 네이버 API 응답에 포함됨)
 * - HTML 엔티티 디코딩 (&amp;, &lt; 등)
 * - 연속 공백 → 단일 공백
 * - 앞뒤 공백 제거
 * - 소문자 변환 (영문 대소문자 통일)
 */
export function normalizePlaceName(name: string): string {
  return name
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ────────────────────────────────────────────────────────────
// 이름 유사도
// ────────────────────────────────────────────────────────────

function getBigrams(str: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    result.push(str.slice(i, i + 2));
  }
  return result;
}

/**
 * bigram Jaccard 유사도로 두 카페명의 유사도를 계산합니다.
 * 한국어 단어 경계를 고려하지 않아도 되므로 단순 bigram이 잘 동작합니다.
 *
 * @returns 0(완전 다름) ~ 1(완전 일치)
 */
export function calculateNameSimilarity(a: string, b: string): number {
  const na = normalizePlaceName(a);
  const nb = normalizePlaceName(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;

  const bigramSetA = new Set(getBigrams(na));
  const bigramSetB = new Set(getBigrams(nb));

  let intersectionCount = 0;
  for (const bg of bigramSetA) {
    if (bigramSetB.has(bg)) intersectionCount++;
  }
  const unionSize = bigramSetA.size + bigramSetB.size - intersectionCount;
  return intersectionCount / unionSize;
}

// ────────────────────────────────────────────────────────────
// 종합 매칭 점수
// ────────────────────────────────────────────────────────────

type MatchInput = {
  candidateName: string;
  candidateAddress?: string;
};

type MatchResult = {
  matchedName: string;
  matchedAddress?: string;
};

type PlaceMatchScore = {
  nameMatchScore: number;    // 이름 유사도 0~1
  addressMatchScore: number; // 주소 유사도 0~1
  overallMatchScore: number; // 종합 점수 0~1
};

/**
 * 후보 카페와 검증 API 결과를 비교해 매칭 점수를 계산합니다.
 * 이름 70% + 주소 30% 가중치. 주소 정보가 없으면 이름 100%.
 */
export function calculatePlaceMatchScore(
  candidate: MatchInput,
  match: MatchResult
): PlaceMatchScore {
  const nameMatchScore = calculateNameSimilarity(candidate.candidateName, match.matchedName);

  let addressMatchScore = 0;
  if (candidate.candidateAddress && match.matchedAddress) {
    const normA = candidate.candidateAddress.replace(/\s+/g, " ").toLowerCase();
    const normB = match.matchedAddress.replace(/\s+/g, " ").toLowerCase();
    if (normA === normB) {
      addressMatchScore = 1.0;
    } else if (normA.includes(normB) || normB.includes(normA)) {
      addressMatchScore = 0.8;
    } else {
      addressMatchScore = calculateNameSimilarity(normA, normB);
    }
  }

  const hasAddressInfo = Boolean(candidate.candidateAddress && match.matchedAddress);
  const overallMatchScore = hasAddressInfo
    ? nameMatchScore * 0.7 + addressMatchScore * 0.3
    : nameMatchScore;

  return { nameMatchScore, addressMatchScore, overallMatchScore };
}

// ────────────────────────────────────────────────────────────
// 존재 상태 결정
// ────────────────────────────────────────────────────────────

/**
 * 종합 매칭 점수로 카페 존재 상태를 결정합니다.
 *
 * | 점수 범위   | 상태       | 의미                     |
 * |------------|------------|--------------------------|
 * | 0.85 이상  | confirmed  | 존재 확인                 |
 * | 0.65 이상  | likely     | 높은 신뢰도로 존재 추정    |
 * | 0.35 이상  | uncertain  | 불확실 — 운영자 확인 필요  |
 * | 0.35 미만  | not_found  | 검색 결과 없음 (삭제 금지) |
 *
 * ⚠️ "closed_suspected" / "closed_confirmed"는 자동 부여하지 않습니다.
 * 폐업 의심은 운영자가 직접 판단해 부여해야 합니다.
 */
export function decideExistenceStatus(overallMatchScore: number): CafeExistenceStatus {
  if (overallMatchScore >= 0.85) return "confirmed";
  if (overallMatchScore >= 0.65) return "likely";
  if (overallMatchScore >= 0.35) return "uncertain";
  return "not_found";
}
