// 카공 속성 후보 추출 유틸
//
// 입력: 게시물 제목·요약 발췌 등 짧은 텍스트 (최대 수백 자)
// 출력: 속성 키와 confidence 점수 (0~1)
//
// ⚠️ 원문 저장 금지 원칙
//   - 이 함수는 원문 텍스트를 반환하지 않습니다.
//   - 반환값에는 속성 키와 점수만 포함됩니다.
//   - 입력 텍스트는 속성 추출 즉시 참조를 끊고 저장하지 마세요.
//   - 게시물 본문 전체를 이 함수에 넘기지 마세요. API 응답의 title/description 발췌만 사용하세요.

export type CandidateAttributeKey =
  | "quiet"
  | "outlet"
  | "wifi"
  | "solo"
  | "group"
  | "lateOpen"
  | "twentyFourHours"
  | "dessert"
  | "coffee"
  | "spacious"
  | "seat";

export type ExtractedAttribute = {
  key: CandidateAttributeKey;
  confidence: number; // 0~1
};

// 속성별 매칭 키워드 및 가중치
// 각 항목: [키워드, confidence 점수]
const ATTRIBUTE_RULES: Array<{
  key: CandidateAttributeKey;
  patterns: Array<[string, number]>;
}> = [
  {
    key: "quiet",
    patterns: [
      ["조용", 0.9],
      ["조용한", 0.9],
      ["조용함", 0.9],
      ["소음 없", 0.8],
      ["시끄럽지 않", 0.8],
      ["집중", 0.5],
      ["공부하기 좋", 0.5],
    ],
  },
  {
    key: "outlet",
    patterns: [
      ["콘센트", 0.95],
      ["충전", 0.7],
      ["플러그", 0.9],
      ["멀티탭", 0.85],
      ["전기", 0.5],
    ],
  },
  {
    key: "wifi",
    patterns: [
      ["와이파이", 0.95],
      ["wifi", 0.95],
      ["인터넷", 0.6],
      ["무선", 0.6],
    ],
  },
  {
    key: "solo",
    patterns: [
      ["1인", 0.9],
      ["혼자", 0.85],
      ["혼카", 0.85],
      ["혼공", 0.9],
      ["1인석", 0.95],
      ["개인 좌석", 0.9],
      ["독립 좌석", 0.9],
      ["바 좌석", 0.7],
    ],
  },
  {
    key: "group",
    patterns: [
      ["단체", 0.9],
      ["모임", 0.8],
      ["그룹", 0.8],
      ["스터디 그룹", 0.9],
      ["여럿", 0.7],
      ["팀", 0.6],
      ["단체석", 0.95],
      ["긴 테이블", 0.8],
    ],
  },
  {
    key: "lateOpen",
    patterns: [
      ["늦게까지", 0.9],
      ["심야", 0.85],
      ["새벽", 0.85],
      ["밤늦게", 0.9],
      ["자정", 0.8],
      ["12시 이후", 0.85],
      ["밤 12시", 0.85],
      ["밤 11시", 0.75],
      ["밤 10시", 0.6],
    ],
  },
  {
    key: "twentyFourHours",
    patterns: [
      ["24시간", 0.98],
      ["24h", 0.95],
      ["24hour", 0.95],
      ["연중무휴", 0.7],
      ["밤새", 0.7],
    ],
  },
  {
    key: "dessert",
    patterns: [
      ["디저트", 0.9],
      ["케이크", 0.8],
      ["베이글", 0.75],
      ["샌드위치", 0.6],
      ["빵", 0.5],
      ["마카롱", 0.75],
      ["타르트", 0.75],
    ],
  },
  {
    key: "coffee",
    patterns: [
      ["커피", 0.85],
      ["스페셜티", 0.9],
      ["에스프레소", 0.85],
      ["핸드드립", 0.85],
      ["원두", 0.8],
      ["라떼", 0.7],
      ["아메리카노", 0.7],
    ],
  },
  {
    key: "spacious",
    patterns: [
      ["넓은", 0.85],
      ["넓다", 0.85],
      ["넓어요", 0.85],
      ["공간이 넓", 0.9],
      ["넓직", 0.8],
      ["탁 트인", 0.8],
      ["대형", 0.75],
      ["2층", 0.5],
      ["3층", 0.5],
    ],
  },
  {
    key: "seat",
    patterns: [
      ["좌석", 0.8],
      ["자리", 0.6],
      ["자리가 많", 0.85],
      ["좌석이 많", 0.85],
      ["테이블", 0.5],
      ["소파", 0.6],
      ["의자", 0.5],
    ],
  },
];

/**
 * 텍스트에서 카공 속성 후보를 추출합니다.
 *
 * @param text - API 응답의 title 또는 description 발췌 (원문 전체 금지)
 * @returns 감지된 속성 키와 confidence 배열 (원문 미포함)
 */
export function extractCandidateAttributes(text: string): ExtractedAttribute[] {
  if (!text || text.length === 0) return [];

  const lower = text.toLowerCase();
  const results: ExtractedAttribute[] = [];

  for (const rule of ATTRIBUTE_RULES) {
    let maxConfidence = 0;

    for (const [pattern, score] of rule.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        if (score > maxConfidence) maxConfidence = score;
      }
    }

    if (maxConfidence > 0) {
      results.push({ key: rule.key, confidence: maxConfidence });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 여러 텍스트(제목 + 요약 등)를 합쳐 속성을 추출합니다.
 * 동일 속성이 여러 소스에서 감지되면 최고 confidence를 사용합니다.
 *
 * @param texts - 속성 추출용 텍스트 배열 (원문 저장 금지, 추출 후 참조 해제 필수)
 */
export function extractCandidateAttributesFromMany(texts: string[]): ExtractedAttribute[] {
  const merged = new Map<CandidateAttributeKey, number>();

  for (const text of texts) {
    for (const attr of extractCandidateAttributes(text)) {
      const existing = merged.get(attr.key) ?? 0;
      if (attr.confidence > existing) merged.set(attr.key, attr.confidence);
    }
  }

  return [...merged.entries()]
    .map(([key, confidence]) => ({ key, confidence }))
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * 추출된 속성 키만 문자열 배열로 반환합니다 (Supabase extracted_keywords 컬럼용).
 * confidence 임계값 미만 항목은 제외합니다.
 */
export function toExtractedKeywordList(
  attrs: ExtractedAttribute[],
  minConfidence = 0.6
): string[] {
  return attrs.filter((a) => a.confidence >= minConfidence).map((a) => a.key);
}
