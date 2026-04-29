const EARTH_RADIUS_KM = 6371;

export type Coords = { lat: number; lng: number };

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceKm(from: Coords, to: Coords): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadius(distanceKm: number, radiusKm: number): boolean {
  return distanceKm <= radiusKm;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}
