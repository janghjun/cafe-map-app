import type { Coords } from "../utils/distance";
import "../styles/components.css";

const CANVAS_W = 300;
const CANVAS_H = 180;
const PADDING = 28;
const MIN_SPAN = 0.006; // ~600m 최소 span — 밀집된 경우에도 마커 분산

type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

function computeBounds(points: Coords[]): Bounds {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  if (maxLat - minLat < MIN_SPAN) {
    const c = (minLat + maxLat) / 2;
    minLat = c - MIN_SPAN / 2;
    maxLat = c + MIN_SPAN / 2;
  }
  if (maxLng - minLng < MIN_SPAN) {
    const c = (minLng + maxLng) / 2;
    minLng = c - MIN_SPAN / 2;
    maxLng = c + MIN_SPAN / 2;
  }

  const latPad = (maxLat - minLat) * 0.25;
  const lngPad = (maxLng - minLng) * 0.25;
  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  };
}

function toXY(point: Coords, bounds: Bounds): { x: number; y: number } {
  const innerW = CANVAS_W - PADDING * 2;
  const innerH = CANVAS_H - PADDING * 2;
  const x = PADDING + ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * innerW;
  const y = PADDING + ((bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)) * innerH;
  return { x: Math.round(x), y: Math.round(y) };
}

const MARKER_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  points: MapPoint[];
  userLocation?: Coords;
  onMarkerClick?: (id: string) => void;
  title?: string;
};

export function MiniMapPreview({
  points,
  userLocation,
  onMarkerClick,
  title = "추천 위치 미리보기",
}: Props) {
  if (points.length === 0) return null;

  const cafeCoords: Coords[] = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  const allCoords = userLocation ? [userLocation, ...cafeCoords] : cafeCoords;
  const bounds = computeBounds(allCoords);
  const userXY = userLocation ? toXY(userLocation, bounds) : null;

  return (
    <div className="mini-map">
      <p className="mini-map__title">{title}</p>

      <div className="mini-map__canvas">
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          width="100%"
          aria-label={`${title} — 카페 위치 도식`}
          role="img"
        >
          {/* Background */}
          <rect width={CANVAS_W} height={CANVAS_H} fill="#f5f0eb" rx="8" />
          {/* Inner border */}
          <rect
            x={PADDING - 2} y={PADDING - 2}
            width={CANVAS_W - PADDING * 2 + 4}
            height={CANVAS_H - PADDING * 2 + 4}
            fill="none" stroke="#d9c9b0" strokeWidth="1" rx="4"
          />

          {/* Café markers */}
          {points.map((point, idx) => {
            const { x, y } = toXY({ lat: point.lat, lng: point.lng }, bounds);
            const color = MARKER_COLORS[idx % MARKER_COLORS.length];
            return (
              <g
                key={point.id}
                onClick={onMarkerClick ? () => onMarkerClick(point.id) : undefined}
                style={onMarkerClick ? { cursor: "pointer" } : undefined}
                role={onMarkerClick ? "button" : undefined}
                aria-label={onMarkerClick ? `${point.name} 상세 보기` : undefined}
              >
                <circle cx={x} cy={y} r="13" fill={color} opacity="0.18" />
                <circle cx={x} cy={y} r="9" fill={color} />
                <text
                  x={x} y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="10"
                  fontWeight="700"
                  style={{ userSelect: "none" } as React.CSSProperties}
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* User marker */}
          {userXY && (
            <g>
              <circle cx={userXY.x} cy={userXY.y} r="11" fill="white" stroke="#6b4226" strokeWidth="2.5" />
              <text
                x={userXY.x} y={userXY.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#6b4226"
                fontSize="9"
                fontWeight="700"
                style={{ userSelect: "none" } as React.CSSProperties}
              >
                나
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mini-map__legend">
        {userXY && <span className="mini-map__legend-me">● 내 위치</span>}
        {points.map((point, idx) => (
          <span
            key={point.id}
            className="mini-map__legend-item"
            onClick={onMarkerClick ? () => onMarkerClick(point.id) : undefined}
            style={onMarkerClick ? { cursor: "pointer" } : undefined}
          >
            <span
              className="mini-map__legend-dot"
              style={{ backgroundColor: MARKER_COLORS[idx % MARKER_COLORS.length] }}
            >
              {idx + 1}
            </span>
            <span className="mini-map__legend-name">{point.name}</span>
          </span>
        ))}
      </div>

      <p className="mini-map__disclaimer">위치 미리보기 — 실제 지도가 아닙니다</p>
    </div>
  );
}
