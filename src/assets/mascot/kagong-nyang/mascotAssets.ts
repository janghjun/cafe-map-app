import type { MascotState } from "../../../types/mascot";

import searching  from "./state/kagongnyang-searching.png";
import sitting    from "./state/kagongnyang-sitting.png";
import thinking   from "./state/kagongnyang-thinking.png";
import warning    from "./state/kagongnyang-warning.png";
import night      from "./state/kagongnyang-night.png";
import standing   from "./state/kagongnyang-standing.png";

import checking   from "./feature/kagongnyang-checking.png";
import wifi       from "./feature/kagongnyang-wifi.png";
import wifiBad    from "./feature/kagongnyang-wifi-bad.png";
import map        from "./feature/kagongnyang-map.png";
import laptop     from "./feature/kagongnyang-laptop.png";
import power      from "./feature/kagongnyang-power.png";
import firmly     from "./feature/kagongnyang-firmly.png";

import heroMain      from "./hero/kagongnyang-hero-main.png";
import emptyFavorite from "./empty/kagongnyang-empty-favorite.png";
import emptyCourse   from "./empty/kagongnyang-empty-course.png";
import emptyResult   from "./empty/kagongnyang-empty-result.png";

export const mascotAssetMap: Partial<Record<MascotState, string>> = {
  searching,
  sitting,
  thinking,
  warning,
  night,
  standing,
  checking,
  wifi,
  wifiBad,
  map,
  laptop,
  power,
  firmly,
  heroMain,
  emptyFavorite,
  emptyCourse,
  emptyResult,
};

export const mascotAltMap: Record<MascotState, string> = {
  searching:     "카공냥이 자리를 찾고 있어요",
  sitting:       "카공냥이 노트북 위에 앉아 있어요",
  thinking:      "카공냥이 어떤 카페가 좋을지 고민하고 있어요",
  warning:       "카공냥이 조건을 다시 확인하고 있어요",
  night:         "카공냥이 야간 카공 중이에요",
  standing:      "카공냥이 카공 카페 앞에 서 있어요",
  checking:      "카공냥이 체크리스트를 꼼꼼히 확인하고 있어요",
  wifi:          "카공냥이 노트북으로 빠른 와이파이를 즐기고 있어요",
  wifiBad:       "카공냥이 느린 와이파이에 실망하고 있어요",
  map:           "카공냥이 지도를 보며 카페를 탐색하고 있어요",
  laptop:        "카공냥이 노트북 앞에 앉아 카공 중이에요",
  power:         "카공냥이 콘센트를 찾고 있어요",
  firmly:        "카공냥이 체크리스트를 들고 확인 중이에요",
  heroMain:      "카공냥이 카공 카페를 추천할 준비가 됐어요",
  emptyFavorite: "카공냥이 편안하게 쉬고 있어요",
  emptyCourse:   "카공냥이 지도를 들고 카공 코스를 계획 중이에요",
  emptyResult:   "카공냥이 지도를 펼쳐 카페를 찾고 있어요",
};
