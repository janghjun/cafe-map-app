import { MascotImage } from "./MascotImage";
import "../styles/components.css";

type Props = {
  message?: string;
};

export function LoadingState({ message = "카공냥이 자리를 찾고 있어요" }: Props) {
  return (
    <div className="loading-state">
      <MascotImage state="searching" size="md" decorative />
      <p className="loading-state__message">{message}</p>
      <span className="loading-state__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
