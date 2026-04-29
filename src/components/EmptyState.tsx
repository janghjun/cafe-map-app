import "../styles/components.css";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">☕</span>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__description">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
