import type { MascotState } from "../types/mascot";
import { MascotImage } from "./MascotImage";
import "../styles/components.css";

type FallbackItem = {
  label: string;
  description: string;
  onApply: () => void;
};

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  fallbacks?: FallbackItem[];
  mascotState?: MascotState;
};

export function EmptyState({ title, description, actionLabel, onAction, fallbacks, mascotState }: Props) {
  return (
    <div className="empty-state">
      {mascotState ? (
        <MascotImage
          state={mascotState}
          size={mascotState === "warning" || mascotState === "emptyResult" ? "lg" : "md"}
          decorative
        />
      ) : (
        <span className="empty-state__icon">☕</span>
      )}
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__description">{description}</p>
      {fallbacks && fallbacks.length > 0 && (
        <div className="empty-state__fallbacks">
          <p className="empty-state__fallback-hint">이렇게 바꿔볼까요?</p>
          {fallbacks.map((fb) => (
            <button
              key={fb.label}
              type="button"
              className="empty-state__fallback-btn"
              onClick={fb.onApply}
            >
              <span className="empty-state__fallback-label">{fb.label}</span>
              <span className="empty-state__fallback-desc">{fb.description}</span>
            </button>
          ))}
        </div>
      )}
      {actionLabel && onAction && (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
