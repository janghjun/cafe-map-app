import type { Coords } from "../utils/distance";

export type LocationSource = "gps" | "fallback";
export type LocationStatus = "idle" | "loading" | "granted" | "denied" | "fallback";

export type LocationResult = {
  coords: Coords;
  source: LocationSource;
};

// 위치 권한 거부/실패 시 fallback으로 사용하는 인천시청 좌표
const INCHEON_CITY_CENTER: Coords = { lat: 37.4563, lng: 126.7052 };

export function getFallbackLocation(): Coords {
  return INCHEON_CITY_CENTER;
}

export function getCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: getFallbackLocation(), source: "fallback" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          source: "gps",
        });
      },
      () => {
        resolve({ coords: getFallbackLocation(), source: "fallback" });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}
