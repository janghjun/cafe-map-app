// 인천 카공 카페 후보 수집용 검색 키워드 생성 유틸
// 실제 API 호출을 포함하지 않습니다.
// 생성된 키워드는 scripts/collect-candidates.ts 등 서버 사이드 수집 스크립트에서 사용합니다.

/** 카공 의도를 나타내는 기본 키워드 */
export function getBaseCandidateKeywords(): string[] {
  return [
    "카공",
    "공부하기 좋은 카페",
    "노트북 카페",
    "콘센트 카페",
    "24시간 카페",
    "조용한 카페",
    "스터디 카페 말고 카페",
    "공부 카페",
    "작업하기 좋은 카페",
  ];
}

/** 인천 지역별 접두어 목록 (구 · 동 · 랜드마크) */
export function getIncheonAreaKeywords(): string[] {
  return [
    // 대표 지역어
    "인천",
    // 구 단위
    "연수구",
    "부평구",
    "남동구",
    "서구",
    "미추홀구",
    "계양구",
    "중구",
    "강화",
    // 주요 동/지구
    "송도",
    "청라",
    "검단",
    "구월동",
    "주안",
    "부평",
    "간석동",
    "논현동",
    "용현동",
    "학익동",
    "가좌동",
    "석남동",
    "신현동",
    "부개동",
    "삼산동",
    "계산동",
    "작전동",
    "동인천",
    "신포동",
    "연수동",
    // 대학가
    "인하대",
    "인천대",
    "가천대 메디컬캠퍼스",
    "경인교대",
  ];
}

/**
 * 지역어 × 카공 의도어 조합으로 전체 검색 키워드 배열을 생성합니다.
 * 중복은 자동으로 제거됩니다.
 */
export function generateCandidateSearchKeywords(): string[] {
  const areas = getIncheonAreaKeywords();
  const bases = getBaseCandidateKeywords();

  const combined = new Set<string>();

  for (const area of areas) {
    for (const base of bases) {
      combined.add(`${area} ${base}`);
    }
    // 단순 조합 외 단축형도 추가 (예: "송도 카공")
    combined.add(`${area} 카공`);
  }

  // 지역 한정 단독 키워드 (카공 의도가 충분히 포함된 경우)
  combined.add("인천 카공 카페 추천");
  combined.add("인천 노트북 작업");
  combined.add("인천 1인 카페");
  combined.add("인천 장시간 카페");
  combined.add("인천 새벽 카페");
  combined.add("인천 와이파이 카페");

  return [...combined];
}
