import { useEffect, useRef } from "react";
import type { Coords } from "../utils/distance";

// Leaflet CSS는 index.html <link> 또는 globals.css @import로 로드합니다.
// (import 'leaflet/dist/leaflet.css'는 번들 크기/캐시 효율을 위해 직접 링크 권장)

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

const MARKER_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

type Props = {
  points: MapPoint[];
  userLocation?: Coords;
  onMarkerClick?: (id: string) => void;
  height?: number;
};

export function MapView({ points, userLocation, onMarkerClick, height = 220 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      if (!containerRef.current) return;

      // Destroy existing map if re-initializing
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Calculate center
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      mapRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Cafe markers (numbered HTML divs)
      points.forEach((point, idx) => {
        const color = MARKER_COLORS[idx % MARKER_COLORS.length];
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:700;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            border:2px solid rgba(255,255,255,0.8);
            cursor:${onMarkerClick ? "pointer" : "default"};
          ">${idx + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([point.lat, point.lng], { icon })
          .bindPopup(`<strong>${point.name}</strong>`, { maxWidth: 160 })
          .addTo(map);

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(point.id));
        }
      });

      // User location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="
            width:24px;height:24px;border-radius:50%;
            background:#fff;color:#6b4226;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:700;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            border:2.5px solid #6b4226;
          ">나</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .bindPopup("내 위치", { maxWidth: 100 })
          .addTo(map);
      }

      // Fit bounds to show all markers with padding
      const cafeLatLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      if (cafeLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(cafeLatLngs), { padding: [32, 32] });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points, userLocation, onMarkerClick]);

  if (points.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height, borderRadius: "12px", overflow: "hidden" }}
      aria-label="카페 위치 지도"
    />
  );
}
