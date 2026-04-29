export type CafeStatus = "active" | "pending" | "closed";

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
  is24Hours: boolean;
  naverMapUrl?: string;
  status: CafeStatus;
  tags: CafeTag[];
  attributes: CafeAttributes;
  createdAt: string;
  updatedAt: string;
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
