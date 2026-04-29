import { FilterChip } from "./FilterChip";

const RADIUS_OPTIONS = [1, 3, 5] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

type Props = {
  value: Radius;
  onChange: (radius: Radius) => void;
};

export function RadiusSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {RADIUS_OPTIONS.map((r) => (
        <FilterChip
          key={r}
          label={`${r}km`}
          selected={value === r}
          onClick={() => onChange(r)}
        />
      ))}
    </div>
  );
}
