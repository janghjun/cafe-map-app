import type { Cafe, CafeAttributes, CafeTag, CafeVerificationStatus, CafeVerificationSources } from "../types/cafe";

// Supabase DB row 타입 — 쿼리 결과와 1:1 대응
export type CafeRow = {
  id: string;
  name: string;
  district: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  summary: string | null;
  open_hours_summary: string | null;
  open_hours: { open: number; close: number } | null;
  is_24_hours: boolean;
  wifi_status: "ok" | "slow" | null;
  last_wifi_update_at: string | null;
  naver_map_url: string | null;
  verification_status: CafeVerificationStatus | null;
  last_verified_at: string | null;
  verification_sources: CafeVerificationSources | null;
  curator_note: string | null;
  status: "active" | "pending" | "closed";
  created_at: string;
  updated_at: string;
  cafe_attributes: AttributeRow | null;
  cafe_tags: { tag: string }[];
};

type AttributeRow = {
  quiet_score: number;
  solo_score: number;
  group_score: number;
  outlet_score: number;
  wifi_score: number;
  stay_score: number;
  coffee_score: number;
  dessert_score: number;
  late_open_score: number;
  space_score: number;
  seat_score: number;
  group_seat_score: number;
};

const DEFAULT_ATTRIBUTES: CafeAttributes = {
  quietScore: 0,
  soloScore: 0,
  groupScore: 0,
  outletScore: 0,
  wifiScore: 0,
  stayScore: 0,
  coffeeScore: 0,
  dessertScore: 0,
  lateOpenScore: 0,
  spaceScore: 0,
  seatScore: 0,
  groupSeatScore: 0,
};

function mapAttributes(row: AttributeRow | null): CafeAttributes {
  if (!row) return DEFAULT_ATTRIBUTES;
  return {
    quietScore: row.quiet_score,
    soloScore: row.solo_score,
    groupScore: row.group_score,
    outletScore: row.outlet_score,
    wifiScore: row.wifi_score,
    stayScore: row.stay_score,
    coffeeScore: row.coffee_score,
    dessertScore: row.dessert_score,
    lateOpenScore: row.late_open_score,
    spaceScore: row.space_score,
    seatScore: row.seat_score,
    groupSeatScore: row.group_seat_score,
  };
}

export function mapCafeRow(row: CafeRow): Cafe {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    dong: row.dong,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone ?? undefined,
    summary: row.summary ?? "",
    openHoursSummary: row.open_hours_summary ?? undefined,
    openHours: row.open_hours ?? undefined,
    is24Hours: row.is_24_hours,
    wifiStatus: row.wifi_status ?? undefined,
    lastWifiUpdateAt: row.last_wifi_update_at ?? undefined,
    naverMapUrl: row.naver_map_url ?? undefined,
    verificationStatus: row.verification_status ?? undefined,
    lastVerifiedAt: row.last_verified_at ?? undefined,
    verificationSources: row.verification_sources ?? undefined,
    curatorNote: row.curator_note ?? undefined,
    status: row.status,
    tags: row.cafe_tags.map((t) => t.tag as CafeTag),
    attributes: mapAttributes(row.cafe_attributes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
