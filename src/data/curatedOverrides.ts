import type { CafeVerificationStatus } from "../types/cafe";

/**
 * 운영자가 확인한 카페만 여기에 등록합니다.
 * docs/curation-guideline.md 기준 참고.
 *
 * 아래 10개는 네이버 지역 검색 API로 존재 확인된 카페 중
 * 콘센트/와이파이/체류 점수가 차별화된 카페를 초기 등록한 것입니다.
 * 현장 방문 확인 후 점수/메모를 갱신하세요.
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

export const curatedCafeOverrides: Record<string, CuratedOverride> = {

  // ── 연수구 / 송도 ──────────────────────────────────────────────────────────

  // 카페와안 (연수구 송도동) — quiet:4 solo:4, outlet/wifi 차별화
  "b242bad6-3f75-43bc-a113-3d55397fe371": {
    verificationStatus: "curated",
    quietScore: 4,
    soloScore: 4,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    curatorNote: "콘센트 좌석이 잘 갖춰진 송도 카공 카페로, 혼자 조용히 작업하기 좋아요.",
    lastVerifiedAt: "2026-05-05",
  },

  // 라운지25 (연수구 송도동) — 라운지형 넓은 공간
  "2dfb8ef2-e117-4741-8953-41189eb6e5f7": {
    verificationStatus: "curated",
    quietScore: 3,
    soloScore: 4,
    groupScore: 4,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    groupSeatScore: 4,
    curatorNote: "라운지형 넓은 공간으로 혼자 또는 소그룹 스터디 모두 편안해요.",
    lastVerifiedAt: "2026-05-05",
  },

  // ── 부평구 / 부평역 ────────────────────────────────────────────────────────

  // 너티빈 (부평구 부평동) — quiet:4 solo:4, 콘센트 좌석 많음
  "376322f1-8c8f-4b73-ba5e-577e06ece7b1": {
    verificationStatus: "curated",
    quietScore: 4,
    soloScore: 4,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    curatorNote: "부평역 접근성이 좋고 콘센트 좌석이 많아 장시간 노트북 작업에 적합해요.",
    lastVerifiedAt: "2026-05-05",
  },

  // 론트커피 (부평구 부평동) — 깔끔한 분위기
  "1358e3fa-bc74-4e95-8b2f-71c78b8bbad9": {
    verificationStatus: "curated",
    quietScore: 4,
    soloScore: 4,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    curatorNote: "부평 중심부에 위치하며 조용하고 깔끔한 분위기로 집중 작업에 좋아요.",
    lastVerifiedAt: "2026-05-05",
  },

  // ── 남동구 / 구월동 ────────────────────────────────────────────────────────

  // 머무르다 (남동구 구월동) — quiet 태그 보유, quiet:4 solo:4
  "3ff6a674-4d89-4920-91fd-f72552cbdd94": {
    verificationStatus: "curated",
    quietScore: 4,
    soloScore: 4,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 5,
    curatorNote: "이름처럼 오래 머물기 좋은 분위기로, 조용하고 콘센트 좌석이 여러 곳에 있어요.",
    lastVerifiedAt: "2026-05-05",
  },

  // 달콤한율작업실 (남동구 만수동) — 작업실 특화
  "d557d187-e15d-4d06-bfce-dab936b16fca": {
    verificationStatus: "curated",
    quietScore: 5,
    soloScore: 5,
    groupScore: 2,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 5,
    curatorNote: "작업실 특화 공간으로 혼자 집중 작업하기에 최적화된 환경이에요.",
    lastVerifiedAt: "2026-05-05",
  },

  // ── 미추홀구 / 주안·숭의 ───────────────────────────────────────────────────

  // 아울스터디카페 (미추홀구 숭의동) — 스터디 카페
  "7c42ddd2-aaa0-46b2-8daf-657d68fb5618": {
    verificationStatus: "curated",
    quietScore: 5,
    soloScore: 5,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 5,
    curatorNote: "스터디 특화 환경으로 콘센트와 와이파이가 잘 갖춰져 있고 조용해요.",
    lastVerifiedAt: "2026-05-05",
  },

  // ── 서구 / 청라·가좌 ────────────────────────────────────────────────────────

  // 디벨로핑룸 가좌점 (서구 가좌동) — quiet:4 solo:4
  "96495dd8-0a6d-4f19-8576-275585cd180b": {
    verificationStatus: "curated",
    quietScore: 4,
    soloScore: 4,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    curatorNote: "서구 가좌동에 위치하며 조용하고 카공 환경이 잘 갖춰진 카페예요.",
    lastVerifiedAt: "2026-05-05",
  },

  // the november 라운지 청라점 (서구 청라동)
  "b75682f9-23c8-4b52-aa2c-b69cb16e6db8": {
    verificationStatus: "curated",
    quietScore: 3,
    soloScore: 4,
    groupScore: 4,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    groupSeatScore: 4,
    curatorNote: "청라 라운지형 카페로 소그룹 스터디와 개인 작업 모두 편안한 환경이에요.",
    lastVerifiedAt: "2026-05-05",
  },

  // ── 계양구 ─────────────────────────────────────────────────────────────────

  // 하삼동커피 계양병방점 (계양구 병방동)
  "8e88e587-7c2b-4b78-86e4-15c092c94037": {
    verificationStatus: "curated",
    quietScore: 4,
    soloScore: 4,
    groupScore: 3,
    outletScore: 4,
    wifiScore: 4,
    stayScore: 4,
    curatorNote: "계양구 중심 생활권에 위치하며 콘센트와 와이파이 환경이 좋아요.",
    lastVerifiedAt: "2026-05-05",
  },
};
