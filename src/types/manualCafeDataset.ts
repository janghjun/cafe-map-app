export type ManualCafePriority = "high" | "normal" | "low";
export type ManualCafeReviewStatus = "pending" | "verified" | "merged" | "rejected" | "needs_review";
export type ManualCafeVerificationStatus =
  | "needs_check"
  | "verified_basic"
  | "duplicate_candidate"
  | "not_found"
  | "ambiguous";

export type ManualKagongCafeRecord = {
  id: string;
  name: string;
  areaGroup?: string;
  district?: string;
  dong?: string;
  addressHint?: string;
  sourceScore?: number | null;
  sourceRating?: number | null;
  sourceReviewCount?: number | null;
  categories?: string[];
  sourceTags?: string[];
  openStatusText?: string;
  rawReviewMemo?: string;
  operatorSummaryDraft?: string;
  studySignals?: string[];
  suggestedTags?: string[];
  suggestedScores?: Partial<{
    quietScore: number;
    outletScore: number;
    wifiScore: number;
    stayScore: number;
    soloScore: number;
    groupScore: number;
    groupSeatScore: number;
    coffeeScore: number;
    dessertScore: number;
    lateOpenScore: number;
  }>;
  verificationStatus?: ManualCafeVerificationStatus | string;
  reviewStatus?: ManualCafeReviewStatus | string;
  sourceType?: string;
  priority?: ManualCafePriority | string;
  notes?: string;
};

export type ManualKagongCafeDataset = {
  meta?: {
    name?: string;
    version?: string;
    createdAt?: string;
    recordCount?: number;
    usage?: string;
    policyNote?: string;
  };
  records: ManualKagongCafeRecord[];
};
