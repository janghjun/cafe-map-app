import { MapView, type MapPoint } from "./MapView";
import type { Coords } from "../utils/distance";
import "../styles/components.css";

const MARKER_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

export type { MapPoint };

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
  title = "카페 위치 미리보기",
}: Props) {
  if (points.length === 0) return null;

  return (
    <div className="mini-map">
      <p className="mini-map__title">{title}</p>

      <div className="mini-map__canvas mini-map__canvas--leaflet">
        <MapView
          points={points}
          userLocation={userLocation}
          onMarkerClick={onMarkerClick}
          height={220}
        />
      </div>

      <p className="mini-map__osm-credit">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
      </p>

      <div className="mini-map__legend">
        {userLocation && <span className="mini-map__legend-me">● 내 위치</span>}
        {points.map((point, idx) => (
          <span
            key={point.id}
            className="mini-map__legend-item"
            onClick={onMarkerClick ? () => onMarkerClick(point.id) : undefined}
            style={onMarkerClick ? { cursor: "pointer" } : undefined}
          >
            <span
              className="mini-map__legend-bar"
              style={{ backgroundColor: MARKER_COLORS[idx % MARKER_COLORS.length] }}
            />
            <span className="mini-map__legend-name">
              <span className="mini-map__legend-rank">{idx + 1}.</span>
              {point.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
