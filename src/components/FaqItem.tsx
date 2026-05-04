import type { ReactNode } from "react";
import "../styles/components.css";

type Props = {
  question: string;
  children: ReactNode;
};

export function FaqItem({ question, children }: Props) {
  return (
    <details className="faq-item">
      <summary className="faq-item__q">{question}</summary>
      <div className="faq-item__a">{children}</div>
    </details>
  );
}
