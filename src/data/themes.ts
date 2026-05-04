export type ThemePick = {
  cafeId: string;
  reason: string; // 운영자 큐레이션 코멘트
};

export type CafeTheme = {
  id: string;
  icon: string;
  title: string;
  description: string;
  updatedAt: string; // 운영자 마지막 업데이트 표시용
  picks: ThemePick[];
};

export const CAFE_THEMES: CafeTheme[] = [
  {
    id: "weekly",
    icon: "✨",
    title: "이번 주 추천",
    description: "운영자가 직접 고른 이번 주 카공 스팟이에요.",
    updatedAt: "2026.05.03",
    picks: [
      { cafeId: "fe3c7ef9-07c5-41df-a623-4e86f6c8a97c", reason: "송도 한복판 접근성 좋은 카페. 넓은 공간으로 집중하기 좋아요." },
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
    updatedAt: "2026.05.03",
    picks: [
      { cafeId: "356eec95-d31f-4f8a-9ac9-46b8357c9810", reason: "계양구 24시간 운영. 새벽 카공도 언제든 가능해요." },
      { cafeId: "2c7f9471-c1f6-4916-9867-5c7cac93cf29", reason: "남동구 구월동 24시간. 시험 기간에도 자리 걱정 없어요." },
      { cafeId: "17cc72a6-2efd-4e2a-a8b4-8930dcb14587", reason: "부평 24시간 카페. 부평역 인근이라 교통도 편해요." },
      { cafeId: "9e4f7712-38f4-4e62-a0f5-23f04cbc19f7", reason: "무인 24시간 운영. 혼자 조용히 공부하기 좋아요." },
    ],
  },
  {
    id: "teamwork",
    icon: "🤝",
    title: "팀플 카페",
    description: "단체석이 넉넉하고 대화하기 편한 카페를 골랐어요.",
    updatedAt: "2026.05.03",
    picks: [
      { cafeId: "98b22288-cc32-4298-ad7f-4817c5656899", reason: "계양구 대형 카페. 단체석이 많아 팀플 시 자리 걱정 없어요." },
      { cafeId: "d13abb7d-703e-4901-82f8-312136638311", reason: "송도 세련된 공간. 소모임이나 팀 카공에 어울려요." },
      { cafeId: "85364d35-24d2-4d4b-812a-b3092cc90cf4", reason: "청라 넓은 카페. 탁 트인 공간에서 팀플하기 좋아요." },
      { cafeId: "65009d36-1377-40bd-aa4b-94bfe16428da", reason: "남동구 도림동 조용한 분위기. 소그룹 공부 모임에 적합해요." },
    ],
  },
];
