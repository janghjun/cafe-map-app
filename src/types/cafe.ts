export type CafeStatus = "active" | "pending" | "closed";

/** 운영자가 직접 수집·확인한 검증 단계 */
export type CafeVerificationStatus =
  | "candidate"      // 후보 등록만 됨, 아직 확인 안 됨
  | "verified_basic" // 장소명·주소 수준 확인 완료
  | "curated"        // 운영자 직접 검수 완료 — 추천 노출 최우선
  | "needs_recheck"  // 폐업/이전 제보 등 재확인 필요 — 추천 우선순위 낮춤
  | "closed";        // 폐업/제외 — 추천에서 완전 제외

/** 검증에 활용된 출처 */
export type CafeVerificationSources = {
  naverLocal?: boolean;    // 네이버 지역 검색 API로 존재 확인
  kakaoLocal?: boolean;    // 카카오 로컬 API로 존재 확인
  manualCheck?: boolean;   // 운영자 직접 방문 또는 전화 확인
  userSuggestion?: boolean; // 사용자 제안 기반 등록
};

export type CafeTag =
  | "quiet"
  | "talkable"
  | "outlet"
  | "wifi"
  | "late_open"
  | "24hours"
  | "coffee"
  | "dessert"
  | "solo"
  | "group";

// All score fields: 0–5
export type CafeAttributes = {
  quietScore: number;
  soloScore: number;
  groupScore: number;
  outletScore: number;
  wifiScore: number;
  stayScore: number;
  coffeeScore: number;
  dessertScore: number;
  lateOpenScore: number;
  spaceScore: number;      // 공간 크기: 넓을수록 높음
  seatScore: number;       // 개인 좌석 편의성
  groupSeatScore: number;  // 단체석 가용성
};

export type Cafe = {
  id: string;
  name: string;
  district: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  summary: string;
  openHoursSummary?: string;
  openHours?: { open: number; close: number }; // 24h format; close < open means overnight (e.g. close=2 → 2am)
  is24Hours: boolean;
  wifiStatus?: "ok" | "slow";       // 운영자 기준 와이파이 상태
  lastWifiUpdateAt?: string;         // 운영자 마지막 확인 일시
  naverMapUrl?: string;
  status: CafeStatus;
  tags: CafeTag[];
  attributes: CafeAttributes;
  createdAt: string;
  updatedAt: string;
  verificationStatus?: CafeVerificationStatus;
  lastVerifiedAt?: string;
  verificationSources?: CafeVerificationSources;
  curatorNote?: string;
};

export type PeopleType = "solo" | "group_2_4" | "group_5_plus";

export type MoodType = "quiet" | "talkable";

export type UserPreference = {
  radius: 1 | 3 | 5;
  peopleType: PeopleType;
  mood: MoodType;
  needOutlet: boolean;
  needWifi: boolean;
  needLateOpen: boolean;
  need24Hours: boolean;
  careCoffee: boolean;
  careDessert: boolean;
};

export type RecommendationResult = {
  cafe: Cafe;
  score: number;
  distanceKm: number;
  matchReasons: string[];
};

export type CandidateSourceType =
  | "naver_blog"
  | "naver_cafe"
  | "naver_local"
  | "instagram"
  | "manual"
  | "user_suggestion";

export type CandidateReviewStatus = "pending" | "approved" | "rejected";

export type CafeCandidate = {
  id: string;
  sourceType: CandidateSourceType;
  sourceKeyword: string;
  candidateName: string;
  candidateAddress?: string;
  candidateUrl?: string;
  extractedKeywords: string[];
  confidenceScore: number;
  reviewStatus: CandidateReviewStatus;
  createdAt: string;
};
