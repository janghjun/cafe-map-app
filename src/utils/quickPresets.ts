import type { MoodType, PeopleType } from "../types/cafe";

type PresetFilters = {
  peopleType: PeopleType;
  mood: MoodType;
  needOutlet: boolean;
  needWifi: boolean;
  needLateOpen: boolean;
  need24Hours: boolean;
  careCoffee: boolean;
  careDessert: boolean;
};

export type QuickPreset = {
  id: string;
  label: string;
  filters: PresetFilters;
};

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "solo_focus",
    label: "혼자 집중",
    filters: {
      peopleType: "solo", mood: "quiet",
      needOutlet: true,  needWifi: false,
      needLateOpen: false, need24Hours: false,
      careCoffee: false, careDessert: false,
    },
  },
  {
    id: "team_study",
    label: "팀플",
    filters: {
      peopleType: "group_2_4", mood: "talkable",
      needOutlet: true,  needWifi: true,
      needLateOpen: false, need24Hours: false,
      careCoffee: false, careDessert: false,
    },
  },
  {
    id: "laptop_work",
    label: "노트북 작업",
    filters: {
      peopleType: "solo", mood: "quiet",
      needOutlet: true,  needWifi: true,
      needLateOpen: false, need24Hours: false,
      careCoffee: false, careDessert: false,
    },
  },
  {
    id: "night_study",
    label: "야간 집중",
    filters: {
      peopleType: "solo", mood: "quiet",
      needOutlet: true, needWifi: false,
      needLateOpen: true, need24Hours: false,
      careCoffee: false, careDessert: false,
    },
  },
  {
    id: "dessert_matters",
    label: "디저트도 중요",
    filters: {
      peopleType: "solo", mood: "talkable",
      needOutlet: false, needWifi: false,
      needLateOpen: false, need24Hours: false,
      careCoffee: false, careDessert: true,
    },
  },
];
