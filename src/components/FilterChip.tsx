import "../styles/components.css";

type Props = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function FilterChip({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={`filter-chip${selected ? " filter-chip--selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
