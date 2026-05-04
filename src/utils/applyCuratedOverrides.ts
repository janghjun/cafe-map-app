import type { Cafe } from "../types/cafe";
import { curatedCafeOverrides } from "../data/curatedOverrides";

/**
 * 운영자 확인 데이터(curatedOverrides)를 카페 배열에 적용합니다.
 * mock 모드와 Supabase 모드 모두에서 사용합니다.
 *
 * - override가 있는 카페: 해당 필드를 덮어씁니다.
 * - override가 없는 카페: 원본 그대로 반환합니다.
 * - 원본 데이터를 직접 수정하지 않습니다 (spread로 새 객체 생성).
 */
export function applyCuratedOverrides(cafes: Cafe[]): Cafe[] {
  if (Object.keys(curatedCafeOverrides).length === 0) return cafes;

  return cafes.map((cafe) => {
    const override = curatedCafeOverrides[cafe.id];
    if (!override) return cafe;

    const { curatorNote, lastVerifiedAt, verificationStatus, ...scoreOverrides } = override;

    return {
      ...cafe,
      verificationStatus: verificationStatus ?? cafe.verificationStatus,
      ...(curatorNote !== undefined && { curatorNote }),
      ...(lastVerifiedAt !== undefined && { lastVerifiedAt }),
      attributes: {
        ...cafe.attributes,
        ...(scoreOverrides.quietScore !== undefined && { quietScore: scoreOverrides.quietScore }),
        ...(scoreOverrides.soloScore !== undefined && { soloScore: scoreOverrides.soloScore }),
        ...(scoreOverrides.groupScore !== undefined && { groupScore: scoreOverrides.groupScore }),
        ...(scoreOverrides.outletScore !== undefined && { outletScore: scoreOverrides.outletScore }),
        ...(scoreOverrides.wifiScore !== undefined && { wifiScore: scoreOverrides.wifiScore }),
        ...(scoreOverrides.stayScore !== undefined && { stayScore: scoreOverrides.stayScore }),
        ...(scoreOverrides.coffeeScore !== undefined && { coffeeScore: scoreOverrides.coffeeScore }),
        ...(scoreOverrides.dessertScore !== undefined && { dessertScore: scoreOverrides.dessertScore }),
        ...(scoreOverrides.lateOpenScore !== undefined && { lateOpenScore: scoreOverrides.lateOpenScore }),
        ...(scoreOverrides.spaceScore !== undefined && { spaceScore: scoreOverrides.spaceScore }),
        ...(scoreOverrides.seatScore !== undefined && { seatScore: scoreOverrides.seatScore }),
        ...(scoreOverrides.groupSeatScore !== undefined && { groupSeatScore: scoreOverrides.groupSeatScore }),
      },
    };
  });
}
