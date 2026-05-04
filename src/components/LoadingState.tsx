import "../styles/components.css";

type Props = {
  message?: string;
};

export function LoadingState({ message = "카공 카페를 찾는 중이에요..." }: Props) {
  return (
    <div className="loading-state">
      <span className="loading-state__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <p className="loading-state__message">{message}</p>
    </div>
  );
}
