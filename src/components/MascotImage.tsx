import type { MascotState, MascotSize } from "../types/mascot";
import { mascotAssetMap, mascotAltMap } from "../assets/mascot/kagong-nyang/mascotAssets";

const SIZE_PX: Record<MascotSize, string> = {
  xs:   "32px",
  sm:   "56px",
  md:   "96px",
  lg:   "144px",
  hero: "clamp(180px, 48vw, 280px)",
};

// 가로로 긴 이미지: width만 고정하고 height는 auto로 자연 비율 표시
const WIDE_STATES = new Set<MascotState>([
  "heroMain", "searching", "night", "standing", "laptop",
]);

type Props = {
  state: MascotState;
  size?: MascotSize;
  className?: string;
  decorative?: boolean;
};

export function MascotImage({ state, size = "md", className, decorative = false }: Props) {
  const src = mascotAssetMap[state];
  if (!src) return null;

  const px = SIZE_PX[size];
  const isWide = WIDE_STATES.has(state);

  const style = isWide
    ? { width: px, height: "auto", display: "block", flexShrink: 0 }
    : { width: px, height: px, objectFit: "contain" as const, display: "block", flexShrink: 0 };

  return (
    <img
      src={src}
      alt={decorative ? "" : mascotAltMap[state]}
      aria-hidden={decorative ? true : undefined}
      className={`mascot-img${className ? ` ${className}` : ""}`}
      style={style}
      draggable={false}
    />
  );
}
