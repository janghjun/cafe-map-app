# 카공 어디가? 인천편 - Claude Code 바이브코딩 운영 문서

> 이 문서는 VSCode + Claude Code로 `카공 어디가? 인천편`을 개발하기 위한 프로젝트 기준 문서입니다.  
> Claude Code는 구현 엔진이며, 이 문서는 Claude가 프로젝트의 목적, 범위, 금지사항, 구현 순서, 테스트 기준을 항상 같은 기준으로 이해하도록 돕습니다.

---

## 0. 프로젝트 개요

### 앱명

- 카공 어디가? 인천편

### 서비스 한 줄 정의

- 인천에서 공부하기 좋은 카페를 사용자 위치와 카공 조건에 맞게 TOP 3~5로 추천하고, 구/동별 BEST 카페도 탐색할 수 있게 해주는 WebView 기반 Mini App입니다.

### 목표

- 단순 프로토타입이 아니라 앱인토스 심사 제출 가능한 MVP+를 만든다.
- 웹앱으로 먼저 배포한 뒤 앱인토스 등록을 준비한다.
- 초기에는 추천 시스템 직전 단계까지 디벨롭한다.
- 사용자 행동 로그와 즐겨찾기, 최근 본 카페, 조건 선택 이력을 쌓아 이후 개인화 추천으로 확장한다.

### 제품 성격

- 지도 앱이 아니다.
- 리뷰 복제 앱이 아니다.
- 전국 카페 플랫폼이 아니다.
- 인천 특화 카공 추천/탐색 Mini App이다.

---

## 1. Claude Code 역할

Claude Code는 다음 역할을 수행한다.

- 구현 엔진
- 리팩터링 도우미
- 테스트 작성 도우미
- 코드 리뷰어
- 앱인토스 WebView 대응 도우미
- 프론트엔드/백엔드 연결 보조
- 작은 단위 작업 실행자

Claude Code는 다음 역할을 하지 않는다.

- 기획을 임의로 바꾸지 않는다.
- 기능을 과도하게 확장하지 않는다.
- 외부 정책상 위험한 크롤링 코드를 임의로 추가하지 않는다.
- 사용자가 요청하지 않은 대규모 구조 변경을 하지 않는다.
- 한 번에 전체 앱을 구현하지 않는다.

---

## 2. 개발 원칙

### 2.1 작업 방식

- 반드시 작은 단위로 구현한다.
- 한 번에 전체 구현 금지.
- 각 작업마다 변경 파일을 명시한다.
- 각 작업마다 테스트 방법을 포함한다.
- 구현 전 현재 파일 구조를 먼저 확인한다.
- 구현 전 계획을 먼저 제시한다.
- 불확실한 부분은 질문하거나 안전한 기본값을 선택한다.
- 이미 있는 구조를 우선 존중한다.

### 2.2 Plan → Implement → Verify

모든 작업은 다음 순서로 진행한다.

1. Explore
   - 현재 파일 구조 확인
   - 관련 파일 읽기
   - 기존 구현 방식 파악

2. Plan
   - 수정할 파일 목록 제시
   - 구현 순서 제시
   - 위험 요소 제시

3. Implement
   - 작은 단위로 코드 작성
   - 불필요한 추상화 금지
   - 변경 범위 최소화

4. Verify
   - 타입 체크
   - 린트
   - 테스트
   - 수동 확인 방법 제시

5. Report
   - 변경 파일
   - 구현 내용
   - 테스트 결과
   - 남은 작업

---

## 3. 기술 스택 기본값

> 실제 프로젝트 스캐폴딩 이후 변경 가능하지만, Claude Code는 기본적으로 아래 스택을 기준으로 판단한다.

### Frontend

- React
- TypeScript
- Vite 또는 앱인토스 WebView 템플릿
- CSS Modules 또는 Tailwind CSS
- 단순 라우팅
- 최소 상태관리

### Backend / DB

- Supabase 우선 고려
- PostgreSQL
- Row Level Security는 MVP+ 이후 적용
- 초기에는 더미 JSON → Supabase 전환 가능

### 지도/길찾기

- 1차 출시:
  - 위도/경도 기반 거리 계산
  - 네이버 지도 검색/길찾기 링크 연결
- 2차:
  - 지도 내장
  - 선택 카페 마커 표시
- 3차:
  - 길찾기 API
  - 도보/차량/대중교통 ETA

### 앱인토스

- WebView 기반 Mini App
- 외부 로그인 금지
- 앱 내부 핵심 기능 완결
- 외부 지도 링크는 보조 기능
- 사용자 식별은 앱인토스 익명 식별키 연동 고려

---

## 4. 제품 기능 범위

## 4.1 MVP 범위

- 홈 화면
- 위치 권한 안내
- 반경 선택
  - 1km
  - 3km
  - 5km
- 조건 선택
  - 혼자
  - 2~4명
  - 5명 이상
  - 조용한 곳
  - 대화 가능한 곳
  - 콘센트
  - 와이파이
  - 늦게까지
  - 24시간
  - 커피
  - 디저트
- 위치 기반 TOP 3~5 추천
- 추천 결과 카드
- 카페 상세
- 네이버 지도 링크 연결
- 기본 카페 데이터

## 4.2 MVP+ 범위

- 인천 구/동별 BEST 3~5
- 즐겨찾기
- 최근 본 카페
- 카페 제안하기
- 이벤트 로그 구조
- 익명 사용자 식별 구조
- 후보 수집/검수 DB 구조

## 4.3 Phase 2

- 운영자 검수 페이지
- 자동 후보 수집 파이프라인
- 구/동 BEST 자동 보정
- 검색/정렬 고도화
- 지도 내장
- 도보 예상 시간

## 4.4 Phase 3

- 개인화 추천
- 시간대 추천
- 혼잡도 제보
- 차량/대중교통 ETA
- 지역 확장

---

## 5. 명확한 Out of Scope

아래 기능은 초기 구현에서 제외한다.

- 전국 서비스
- 실시간 좌석 수
- 실시간 혼잡도 자동 수집
- 사용자 공개 리뷰 커뮤니티
- 외부 리뷰 원문 복제
- 외부 평점/사진 복제
- 타 앱 데이터셋 그대로 이관
- 예약/결제
- 정교한 대중교통/차량 ETA 내장
- AI 추천 모델 1차 출시

---

## 6. 핵심 사용자 플로우

## 6.1 내 주변 추천 플로우

1. 앱 진입
2. 위치 권한 허용 또는 수동 지역 선택
3. 반경 선택
4. 카공 조건 선택
5. 추천 받기
6. TOP 3~5 확인
7. 상세 확인
8. 길찾기 또는 저장

### 목적

- 지금 갈 수 있는 카공 카페를 빠르게 결정한다.

---

## 6.2 인천 BEST 플로우

1. 홈 또는 결과 화면에서 인천 BEST 진입
2. 구 선택
3. 동 선택
4. BEST 3~5 확인
5. 상세 확인
6. 저장 또는 길찾기

### 목적

- 위치와 상관없이 인천 내 좋은 카공 카페를 탐색한다.

---

## 6.3 카페 제안 플로우

1. 카페 제안하기 진입
2. 카페명 입력
3. 주소 입력
4. 추천 이유 입력
5. 카공 조건 체크
6. 제출
7. 운영자 검수 대기

### 원칙

- 제출 즉시 공개 반영하지 않는다.
- 운영자 승인 후 반영한다.

---

## 7. 화면 구조

## 7.1 Home

### 목적

- 추천 시작을 가장 빠르게 만든다.

### 포함 요소

- 앱명
- 한 줄 설명
- 위치 권한 안내
- 반경 선택
- 인원 선택
- 분위기 선택
- 조건 선택
- 추천 받기 버튼
- 인천 BEST 보기 버튼

### UX 문구 예시

- 인천에서 공부하기 좋은 카페를 찾아드릴게요
- 내 주변에서 찾기
- 조용한 곳만 볼래요
- 콘센트 있는 카페가 필요해요
- 카공 카페 추천받기
- 인천 BEST 보기

---

## 7.2 RecommendationResult

### 목적

- 조건에 맞는 카페를 3~5개로 줄여 선택 피로를 낮춘다.

### 포함 요소

- 결과 요약
- 추천 카드 리스트
- 조건 수정
- 정렬
- 인천 BEST 진입

### 카드 정보

- 카페명
- 구/동
- 거리
- 카공 적합도
- 대표 태그
- 추천 이유
- 저장 버튼
- 상세 버튼

---

## 7.3 CafeDetail

### 목적

- 최종 방문 결정을 돕는다.

### 포함 요소

- 카페명
- 주소
- 구/동
- 거리
- 운영시간 요약
- 24시간 여부
- 카공 태그
- 1인 적합도
- 다인 적합도
- 커피/디저트 포인트
- 길찾기
- 저장
- 정보 수정 제안

---

## 7.4 DistrictBest

### 목적

- 구/동 기준으로 인천 카공 카페를 탐색하게 한다.

### 포함 요소

- 구 선택
- 동 선택
- BEST 3~5 리스트
- 선정 기준 안내
- 상세/저장/길찾기

---

## 7.5 Favorites

### 목적

- 다시 방문하고 싶은 카페를 저장한다.

---

## 7.6 RecentViews

### 목적

- 탐색 중 놓친 카페를 다시 볼 수 있게 한다.

---

## 7.7 SuggestCafe

### 목적

- 사용자가 알고 있는 카공 카페를 후보로 제출하게 한다.

### 정책

- 제출 즉시 공개 반영 금지.
- 운영자 검수 후 반영.

---

## 8. 데이터 모델 초안

## 8.1 Cafe

```ts
type Cafe = {
  id: string;
  name: string;
  district: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  summary: string;
  openHoursSummary?: string;
  is24Hours: boolean;
  naverMapUrl?: string;
  status: "active" | "pending" | "closed";
  tags: string[];
  attributes: CafeAttributes;
  createdAt: string;
  updatedAt: string;
};
```

## 8.2 CafeAttributes

```ts
type CafeAttributes = {
  quietScore: number;
  soloScore: number;
  groupScore: number;
  outletScore: number;
  wifiScore: number;
  stayScore: number;
  coffeeScore: number;
  dessertScore: number;
  lateOpenScore: number;
};
```

## 8.3 UserPreference

```ts
type UserPreference = {
  radius: 1 | 3 | 5;
  peopleType: "solo" | "group_2_4" | "group_5_plus";
  mood: "quiet" | "talkable";
  needOutlet: boolean;
  needWifi: boolean;
  needLateOpen: boolean;
  need24Hours: boolean;
  careCoffee: boolean;
  careDessert: boolean;
};
```

## 8.4 CafeCandidate

```ts
type CafeCandidate = {
  id: string;
  sourceType: "naver_blog" | "naver_cafe" | "naver_local" | "instagram" | "manual" | "user_suggestion";
  sourceKeyword: string;
  candidateName: string;
  candidateAddress?: string;
  candidateUrl?: string;
  extractedKeywords: string[];
  confidenceScore: number;
  reviewStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};
```

---

## 9. 추천 로직

## 9.1 위치 기반 추천 점수

총점 100점 기준.

- 거리 적합도: 30
- 인원 적합도: 20
- 분위기 적합도: 15
- 콘센트: 10
- 와이파이: 5
- 체류 적합성: 10
- 영업시간/24시간: 5
- 커피/디저트: 5

### 처리 순서

1. 사용자 위치 기준 반경 내 카페 필터링
2. 조건과 카페 속성 매칭
3. 점수 계산
4. TOP 3 기본 노출
5. 더보기 시 TOP 5 노출

---

## 9.2 인천 BEST 랭킹

### 초기

- 운영자 큐레이션 기반

### 이후

- 카공 적합도
- 저장 수
- 상세 조회 수
- 길찾기 클릭 수
- 최근 인기
- 구/동별 균형

### 주의

- 위치 기반 추천 점수와 인천 BEST 점수는 섞지 않는다.
- 위치 기반 추천은 개인 상황 중심이다.
- 인천 BEST는 지역 탐색 중심이다.

---

## 10. 데이터 수집/자동화 정책

## 10.1 자동화 목적

자동화의 목적은 외부 콘텐츠를 복제하는 것이 아니다.

자동화의 목적은 다음이다.

- 카공 후보 카페 발굴
- 중복 후보 정리
- 네이버 지도 존재 여부 검증
- 카공 속성 후보 추출
- 운영자 검수 큐 생성

## 10.2 사용할 수 있는 데이터 수집 방식

- 네이버 블로그 검색 API
- 네이버 카페글 검색 API
- 네이버 지역 검색 API
- Instagram Graph API 해시태그 검색
- 사용자가 직접 보내주는 카페명
- 운영자 수동 검색

## 10.3 자동화 키워드 예시

### 기본 키워드

- 인천 카공
- 인천 카페 공부
- 인천 공부하기 좋은 카페
- 인천 노트북 카페
- 인천 콘센트 카페
- 인천 24시간 카페
- 인천 스터디 카페 말고 카페

### 지역 키워드

- 송도 카공
- 부평 카공
- 구월동 카공
- 청라 카공
- 주안 카공
- 검단 카공
- 계양 카공
- 연수동 카공
- 동인천 카공
- 인하대 카공
- 인천대 카공

## 10.4 자동화 파이프라인

```text
키워드 생성
→ 공식 API 검색
→ 후보 카페명 추출
→ 중복 제거
→ 네이버 지역 검색으로 검증
→ 카공 속성 후보 추출
→ 운영자 검수 큐 등록
→ 승인 시 최종 DB 반영
```

## 10.5 반드시 피해야 할 것

- 네이버/구글 리뷰 원문 복사
- 외부 평점 그대로 복제
- 외부 사진 저장
- 타 앱 데이터셋 그대로 이관
- SNS 게시물 본문/이미지 무단 저장
- 비공식 크롤링에 핵심 데이터 의존

## 10.6 허용 가능한 방식

- 공식 API 기반 검색
- 공개 정보 참고
- 후보명/주소 확인
- 운영자 수동 검수
- 자체 속성 데이터로 재구성
- 사용자가 직접 제공한 카페명 반영

---

## 11. 이벤트 로그

## 11.1 핵심 이벤트

- home_view
- location_permission_allow
- location_permission_deny
- radius_selected
- filter_selected
- recommendation_requested
- recommendation_result_view
- cafe_card_click
- cafe_detail_view
- favorite_add
- favorite_remove
- direction_click
- district_best_view
- district_selected
- dong_selected
- suggestion_submit
- candidate_approved
- candidate_rejected

## 11.2 핵심 퍼널

- 홈 → 위치 허용 → 조건 선택 → 추천 결과 → 상세 → 길찾기
- 홈 → 인천 BEST → 구/동 선택 → 상세 → 저장
- 상세 → 저장 → 재방문

---

## 12. KPI

## 12.1 North Star Metric

- 추천 결과를 본 사용자 중 상세 또는 길찾기로 이어진 비율

## 12.2 핵심 KPI

- 추천 요청률
- 추천 결과 클릭률
- 상세 진입률
- 길찾기 클릭률
- 즐겨찾기 저장률
- 재방문률
- 인천 BEST 진입률
- 카페 제안 제출 수

## 12.3 데이터 품질 KPI

- 후보 수집 수
- 후보 승인율
- 중복 후보 비율
- 잘못된 정보 수정 요청 수
- 구/동별 카페 커버리지

---

## 13. 폴더 구조 제안

```text
src/
  app/
    App.tsx
    routes.tsx
  pages/
    HomePage.tsx
    RecommendationPage.tsx
    CafeDetailPage.tsx
    DistrictBestPage.tsx
    FavoritesPage.tsx
    RecentViewsPage.tsx
    SuggestCafePage.tsx
  components/
    CafeCard.tsx
    FilterChips.tsx
    RadiusSelector.tsx
    TagBadge.tsx
    EmptyState.tsx
  data/
    cafes.mock.ts
  types/
    cafe.ts
    user.ts
  utils/
    distance.ts
    recommendation.ts
    naverMap.ts
  services/
    cafeService.ts
    logService.ts
    userService.ts
  styles/
    globals.css
```

---

## 14. 테스트 기준

## 14.1 단위 테스트 대상

- 거리 계산 함수
- 추천 점수 계산 함수
- 반경 필터 함수
- 태그 매칭 함수
- 네이버 지도 URL 생성 함수

## 14.2 수동 테스트 대상

- 위치 권한 허용
- 위치 권한 거부
- 반경 선택
- 조건 선택
- 추천 결과 노출
- 결과 없음 처리
- 상세 이동
- 네이버 지도 링크 이동
- 즐겨찾기 추가/삭제
- 카페 제안 제출

---

## 15. Claude Code 프롬프트 운영 규칙

Claude Code에게 작업을 요청할 때는 반드시 아래 형식을 사용한다.

```md
## 작업 목표
무엇을 만들지 설명한다.

## 현재 상태
현재 구현된 파일/기능을 설명한다.

## 요구사항
구현해야 할 내용을 bullet로 적는다.

## 제한사항
하지 말아야 할 것을 적는다.

## 변경 예상 파일
수정/생성할 파일을 적는다.

## 테스트 방법
구현 후 확인할 방법을 적는다.

## 출력 형식
변경 요약, 파일 목록, 테스트 결과를 요구한다.
```

---

## 16. Claude Code 공통 금지사항

- 전체 앱을 한 번에 만들지 말 것.
- 임의로 스택을 바꾸지 말 것.
- 기획에 없는 기능을 추가하지 말 것.
- 외부 리뷰/사진/평점을 복제하는 크롤링 코드를 작성하지 말 것.
- 지도 API 키가 필요한 기능을 임의로 강제하지 말 것.
- 복잡한 상태관리 라이브러리를 임의로 추가하지 말 것.
- 대규모 리팩터링을 먼저 하지 말 것.
- 테스트 없이 완료 보고하지 말 것.

---

## 17. 첫 개발 순서

1. 프로젝트 초기화
2. 타입 정의
3. 더미 카페 데이터
4. 거리 계산 유틸
5. 추천 점수 계산 유틸
6. 홈 필터 UI
7. 추천 결과 화면
8. 카페 상세 화면
9. 네이버 지도 링크
10. 인천 BEST 화면
11. 즐겨찾기/최근 본 카페
12. 카페 제안하기
13. 이벤트 로그 구조
14. Supabase 연결
15. 앱인토스 연동 준비

---

## 18. Definition of Done

각 작업은 아래 조건을 만족해야 완료된다.

- 요구사항을 충족한다.
- 변경 파일이 명확하다.
- 타입 에러가 없다.
- 주요 함수 테스트 또는 수동 테스트 방법이 있다.
- 기존 기능을 깨지 않는다.
- 앱인토스 정책과 충돌하지 않는다.
- 데이터 복제/정책 리스크가 없다.
- 다음 작업으로 이어질 수 있다.
