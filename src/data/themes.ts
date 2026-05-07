export type ThemePick = {
  cafeId: string;
  reason: string;
};

export type ThemeCriteria = {
  is24Hours?: boolean;
  excludeUnmanned?: boolean;
  minGroupScore?: number;
  minGroupSeatScore?: number;
  minStayScore?: number;
  limit?: number;
};

export type CafeTheme = {
  id: string;
  icon: string;
  title: string;
  description: string;
  updatedAt: string;
  picks?: ThemePick[];       // 운영자 직접 지정 (weekly 전용)
  criteria?: ThemeCriteria;  // 동적 추천 기준 (night, teamwork)
};

export const CAFE_THEMES: CafeTheme[] = [
  {
    id: "weekly",
    icon: "✨",
    title: "이번 주 추천",
    description: "운영자가 직접 고른 이번 주 카공 스팟이에요.",
    updatedAt: "2026.05.07",
    picks: [
      { cafeId: "curated-002-cafe-comma-songdo", reason: "송도 IBS타워 초대형 북카페. 층고 높은 넓은 공간, 노트북 전용석·콘센트 완비." },
      { cafeId: "a1630a91-88dd-46a8-8841-0630af82f9fc", reason: "구월동 대표 카페. 자리가 넉넉해 오래 앉아 있기 편해요." },
      { cafeId: "eacd8529-aa2e-46c3-8149-a81a4f08b88a", reason: "서구 가좌동의 편안한 분위기 카공 카페예요." },
      { cafeId: "7b48c070-d94f-4342-80e9-1ebbbd0f6fbc", reason: "주안역 도보권. 이동 전후 짧은 카공에도 좋아요." },
    ],
  },
  {
    id: "night",
    icon: "🌙",
    title: "야간 카공",
    description: "늦은 시간에도 공부할 수 있는 카페를 모았어요.",
    updatedAt: "2026.05.07",
    criteria: {
      is24Hours: true,
      excludeUnmanned: true,
      minStayScore: 2,
      limit: 4,
    },
  },
  {
    id: "teamwork",
    icon: "🤝",
    title: "팀플 카페",
    description: "단체석이 넉넉하고 대화하기 편한 카페를 골랐어요.",
    updatedAt: "2026.05.07",
    criteria: {
      minGroupScore: 3,
      minGroupSeatScore: 3,
      minStayScore: 3,
      limit: 4,
    },
  },
];
