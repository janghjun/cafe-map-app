import "../styles/components.css";
import type { CafeTag } from "../types/cafe";

const TAG_LABELS: Record<CafeTag, string> = {
  quiet: "조용한",
  talkable: "대화 가능",
  outlet: "콘센트",
  wifi: "와이파이",
  late_open: "늦게까지",
  "24hours": "24시간",
  coffee: "커피",
  dessert: "디저트",
  solo: "1인",
  group: "그룹",
};

type Props = {
  tag: CafeTag;
};

export function TagBadge({ tag }: Props) {
  return (
    <span className={`tag-badge tag-badge--${tag}`}>
      {TAG_LABELS[tag]}
    </span>
  );
}
