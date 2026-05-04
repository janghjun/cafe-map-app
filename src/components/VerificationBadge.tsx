import type { CafeVerificationStatus } from "../types/cafe";
import "../styles/components.css";

const STATUS_CONFIG: Record<
  Exclude<CafeVerificationStatus, "candidate" | "closed">,
  { label: string; className: string }
> = {
  curated:        { label: "✓ 운영 확인됨",  className: "verification-badge--curated" },
  verified_basic: { label: "장소 확인됨",    className: "verification-badge--basic" },
  needs_recheck:  { label: "재확인 중",      className: "verification-badge--recheck" },
};

type Props = {
  status: CafeVerificationStatus | undefined;
  size?: "sm" | "md";
};

export function VerificationBadge({ status, size = "md" }: Props) {
  if (!status || status === "candidate" || status === "closed") return null;

  const config = STATUS_CONFIG[status];
  return (
    <span className={`verification-badge verification-badge--${size} ${config.className}`}>
      {config.label}
    </span>
  );
}
