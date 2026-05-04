# 카공 카페 후보 수집 · 실존 검증 파이프라인

> **작성일**: 2026-05-02  
> **전제**: 공식 API만 사용. 비공식 크롤링·원문 복사·외부 평점 저장 전면 금지.  
> **관련 파일**: `src/types/candidate.ts`, `src/utils/placeMatch.ts`, `scripts/collect-naver-candidates.ts`

---

## 1. 전체 파이프라인 개요

```
[후보 수집]
  네이버 블로그/카페글 검색 API
  네이버 지역 검색 API
  수동 제보 (사용자 제안 · 운영자 직접 입력)
       ↓
[전처리]
  카페명 정규화 (HTML 태그 제거, 엔티티 디코딩)
  속성 키워드 추출 (원문 폐기, 키 + confidence만 보관)
  1차 중복 제거 (정규화된 이름 기준)
  confidence_score 계산
       ↓
[raw_cafe_candidates 저장]
  review_status: 'pending'
       ↓
[존재 검증]
  네이버 지역 검색 API로 이름·주소 매칭
  (보조) Google Places Text Search
  calculatePlaceMatchScore() → overallMatchScore
  decideExistenceStatus() → existence_status
       ↓
[place_verifications 저장]
  매칭 점수 + 상태값만 기록
  ⚠️ API 응답 원문 저장 금지
       ↓
[운영자 검수 큐]
  confirmed / likely → 우선 검토 후보
  uncertain → 운영자 직접 확인 후 판단
  not_found → 상태값 유지, 즉시 삭제 금지
  closed_suspected → 재확인 후 판단
       ↓
[cafes DB 최종 반영]
  운영자 approved 후 cafes 테이블 INSERT
  카공 속성 점수는 운영자가 직접 입력
  verificationStatus: 'curated' 또는 'verified_basic' 부여
```

---

## 2. 후보 수집 단계

### 2-1. 네이버 블로그 검색 API

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `https://openapi.naver.com/v1/search/blog.json` |
| 목적 | 카공 언급 게시물에서 카페명·속성 키워드 추출 |
| 저장 가능 | `title`, `description` — 속성 추출 즉시 폐기 |
| 저장 금지 | 게시물 본문 전체, 이미지 URL, 작성자 정보 |
| 수집 방식 | `generateCandidateSearchKeywords()` 키워드로 검색 |

### 2-2. 네이버 카페글 검색 API

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `https://openapi.naver.com/v1/search/cafearticle.json` |
| 목적 | 지역 커뮤니티에서 카공 카페 추천 게시물 탐색 |
| 저장 가능 | `title`, `description` — 속성 추출 즉시 폐기 |
| 저장 금지 | 게시물 본문 전체, 이미지, 커뮤니티 회원 정보 |

### 2-3. 네이버 지역 검색 API

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `https://openapi.naver.com/v1/search/local.json` |
| 목적 | 상호명·주소 수집 및 카테고리로 카페 여부 확인 |
| 저장 가능 | `title` (상호명), `address`, `roadAddress`, `telephone`, `category` |
| 저장 금지 | `description` (리뷰 발췌), 외부 별점, 이미지 |

---

## 3. 공식 API 사용 원칙

1. **공식 API만 사용** — 네이버 개발자 센터에서 발급된 Client ID/Secret 사용
2. **API 키 서버 사이드 보관** — `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 `VITE_` 접두사 없이 서버/스크립트에서만 사용
3. **Rate limit 준수** — 요청 간 최소 300ms 딜레이, 하루 최대 100개 키워드
4. **저장 필드 최소화** — 허용된 필드만 추출, 나머지는 즉시 참조 해제
5. **원문 저장 금지** — 게시물 본문·이미지·리뷰·외부 평점을 DB에 저장하지 않음
6. **자동 승인 금지** — 모든 수집 결과는 `review_status: 'pending'`으로 시작, 운영자 검수 필수

---

## 4. SNS 수동 보조 조사 원칙

공식 Instagram Graph API를 통한 해시태그 검색은 **수동 보조 수단**으로만 사용합니다.

| 허용 | 금지 |
|------|------|
| 공식 Graph API 해시태그 검색 | 비로그인 자동 스크래핑 |
| 게시물 위치 태그 기반 카페명 수집 | 게시물 이미지 저장 |
| 해시태그에서 카공 속성 키워드 추출 | 게시물 본문 전체 저장 |
| 공개 게시물 참고 (운영자 수동 확인) | 작성자 개인정보 수집 |

> Instagram Graph API는 비즈니스 계정 필요. 현재 파이프라인에서는 우선 순위 낮음.

---

## 5. 네이버 지역 검색 검증 방식

후보 카페를 네이버 지역 검색으로 검증하는 단계입니다.

### 검증 흐름

```
candidate_name, candidate_address로 네이버 지역 검색
  → 상위 5개 결과 수신
  → 각 결과에 대해 calculatePlaceMatchScore() 실행
  → 최고 overallMatchScore 결과 선택
  → decideExistenceStatus(overallMatchScore) 결정
  → place_verifications에 점수 + 상태만 저장
  → API 응답 원문 폐기
```

### 매칭 우선순위

1. `category`에 "카페", "커피숍" 포함 여부 확인
2. 주소가 인천광역시 기준인지 확인 (타 지역 필터링)
3. 이름 bigram Jaccard 유사도 계산
4. 주소 유사도 계산 (있을 경우)

---

## 6. Google Places Text Search 보조 검증 방식

네이버 지역 검색에서 `not_found` 또는 `uncertain`으로 나온 후보에 대해 보조 검증으로 사용합니다.

| 항목 | 내용 |
|------|------|
| API | Google Places API (Text Search) |
| 엔드포인트 | `https://maps.googleapis.com/maps/api/place/textsearch/json` |
| 환경 변수 | `GOOGLE_PLACES_API_KEY` (서버 사이드 전용) |
| 쿼리 형식 | `{카페명} 인천` |
| 저장 가능 | `name`, `formatted_address`, `types` 필드 |
| 저장 금지 | `reviews`, `photos`, `rating`, `user_ratings_total` |

> **현재 구현 범위 외** — 설계 문서 수준. 네이버 검증으로 커버 안 되는 후보에 대해 Phase 2 이후 추가 고려.

---

## 7. 매칭 점수 계산 방식

구현: `src/utils/placeMatch.ts`

### 이름 유사도: bigram Jaccard

```
normalizePlaceName(name)
  → HTML 태그 제거 → 엔티티 디코딩 → 공백 정리 → 소문자화

getBigrams("송도 카페베이")
  → ["송도", "도 ", " 카", "카페", "페베", "베이"]

Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

### 주소 유사도

```
정확히 같으면   → 1.0
부분 포함 관계  → 0.8
나머지         → bigram Jaccard 적용
```

### 종합 점수

```
주소 정보 있음:  overall = name × 0.7 + address × 0.3
주소 정보 없음:  overall = name × 1.0
```

---

## 8. 상태값 정의 (CafeExistenceStatus)

구현: `src/types/candidate.ts`, DB: `place_verifications.existence_status`

| 상태 | 점수 기준 | 의미 | 처리 |
|------|----------|------|------|
| `confirmed` | ≥ 0.85 | 이름·주소 모두 높은 일치 | 운영자 우선 검토 |
| `likely` | ≥ 0.65 | 높은 신뢰도로 존재 추정 | 운영자 확인 권장 |
| `uncertain` | ≥ 0.35 | 일치 낮음 · 불확실 | 운영자 직접 확인 필수 |
| `not_found` | < 0.35 | 검색 결과 없음 | **삭제 금지** — 상태값 보관 |
| `closed_suspected` | N/A | 폐업 의심 신호 | 운영자 판단 전용 — 자동 부여 금지 |
| `closed_confirmed` | N/A | 폐업 확정 | 운영자 직접 확인 후 부여 |

---

## 9. not_found / closed_suspected 처리 방식

```
not_found:
  → raw_cafe_candidates.review_status = 'pending' 유지
  → place_verifications.existence_status = 'not_found' 기록
  → 운영자 검수 큐에 낮은 우선순위로 보관
  → 주기 검증(예: 6개월 후 재검증) 대상 태그 부여
  → 즉시 삭제 금지 — 재수집 시 중복 방지, 이력 추적 목적

closed_suspected:
  → 자동으로 부여하지 않음
  → 운영자가 수동으로 플래그 설정
  → raw_cafe_candidates.review_status = 'rejected' 이전에 반드시 확인 절차
```

---

## 10. 운영자 검수 흐름

```
[검수 큐 진입]
  confirmed + likely → 우선 검토 풀
  uncertain          → 요주의 풀 (직접 방문 또는 전화 확인 권장)
  not_found          → 보류 풀 (재검증 일정 잡기)

[검수 항목]
  □ 카페명 실제 운영 여부 확인 (네이버 플레이스, 직접 방문)
  □ 주소 정확성 확인
  □ 카공 가능 여부 판단 (콘센트, 좌석, 분위기 등)
  □ 기존 cafes 테이블과 중복 여부 확인

[검수 결과]
  승인 → raw_cafe_candidates.review_status = 'approved'
         → cafes 테이블 INSERT 진행 (10번 참고)
  거부 → raw_cafe_candidates.review_status = 'rejected'
         → 이력은 보관 (삭제 금지)
  보류 → review_status 유지, reviewer_note에 사유 기록
```

---

## 11. 최종 cafes DB 반영 조건

모든 조건을 만족해야 `cafes` 테이블에 INSERT합니다.

| 조건 | 확인 방법 |
|------|----------|
| `raw_cafe_candidates.review_status = 'approved'` | 운영자 검수 완료 |
| `place_verifications.existence_status IN ('confirmed', 'likely')` | 또는 운영자 직접 방문 확인 |
| 인천광역시 주소 확인 | 주소 파싱으로 지역 검증 |
| 중복 없음 | 기존 cafes 테이블 대조 |
| 카공 속성 점수 입력 완료 | 운영자 직접 입력 (0~5 척도) |
| 운영자 메모(curatorNote) 작성 | 선택사항, 있으면 품질 높음 |

반영 후:
- `cafes.status = 'active'`
- `cafes.verification_status = 'curated'` 또는 `'verified_basic'`
- `cafes.last_verified_at` 설정

---

## 12. 데이터 저장 금지 항목 (재확인)

| 금지 항목 | 근거 |
|----------|------|
| 게시물 본문 전체 | 저작권 침해 |
| 이미지/사진 URL | 저작권 침해 |
| 외부 별점·평점 그대로 | 출처 오인, 데이터 왜곡 |
| 리뷰 원문 | 저작권 침해, 이용약관 위반 |
| `NAVER_CLIENT_SECRET` 클라이언트 포함 | 보안 키 노출 |
| 비로그인 자동 스크래핑 | 이용약관 위반 |
| SNS 개인 게시물 자동 수집 | 이용약관 위반, 개인정보 침해 |
