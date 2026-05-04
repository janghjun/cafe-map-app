import type { Cafe } from "../types/cafe";

export type OpenStatus = "open" | "night" | "closed";

export function getOpenStatus(cafe: Cafe, now = new Date()): OpenStatus | null {
  if (cafe.is24Hours) return "night";
  if (!cafe.openHours) return null;

  const h = now.getHours();
  const { open, close } = cafe.openHours;
  const isOvernight = close < open; // e.g. open=8, close=2 → closes at 2am
  const isOpen = isOvernight
    ? h >= open || h < close
    : h >= open && h < close;

  if (!isOpen) return "closed";
  return isOvernight || close >= 23 ? "night" : "open";
}

const CONFIG: Record<OpenStatus, { icon: string; label: string; cls: string }> = {
  open:   { icon: "🟢", label: "지금 영업 중", cls: "status-badge--open"   },
  night:  { icon: "🌙", label: "야간 가능",    cls: "status-badge--night"  },
  closed: { icon: "🔴", label: "영업 종료",    cls: "status-badge--closed" },
};

type Props = { status: OpenStatus };

export function StatusBadge({ status }: Props) {
  const { icon, label, cls } = CONFIG[status];
  return (
    <span className={`status-badge ${cls}`} aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
