import { useEffect, useState } from "react";

type Props = {
  message: string;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), 2000);
    const remove = setTimeout(onDismiss, 2350);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "16px"})`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.22s ease, transform 0.22s ease",
        background: "rgba(26, 15, 8, 0.88)",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 600,
        padding: "10px 20px",
        borderRadius: "9999px",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
      }}
    >
      {message}
    </div>
  );
}
