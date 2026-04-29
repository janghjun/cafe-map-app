# 카공 어디가? 인천편 - Claude Code Step별 프롬프트 팩

> 목적: 이 문서는 VSCode + Claude Code에서 `카공 어디가? 인천편`을 실제 구현하기 위한 Step별 프롬프트 모음입니다.  
> 사용 방식: 각 Step을 Claude Code에 순서대로 붙여 넣고, 한 Step이 완료되면 테스트 결과를 확인한 뒤 다음 Step으로 넘어갑니다.  
> 전제: 프로젝트 루트에 `CLAUDE.md`가 존재해야 합니다.

---

## 0. Claude Code 실행 전 준비

### 권장 순서

1. VSCode에서 프로젝트 폴더 열기
2. 프로젝트 루트에 `CLAUDE.md` 추가
3. Claude Code 실행
4. `/init` 실행
5. Plan Mode 사용
6. 아래 Step별 프롬프트를 하나씩 실행

### 공통 운영 원칙

- 한 번에 전체 앱을 만들지 않는다.
- 각 Step은 독립적으로 끝나야 한다.
- 각 Step마다 변경 파일과 테스트 방법을 보고해야 한다.
- 모르는 것은 추측하지 말고 먼저 현재 파일을 읽는다.
- 외부 리뷰/사진/평점 복제 기능은 구현하지 않는다.
- 공식 API 또는 사용자가 직접 제공한 데이터 기반 구조만 허용한다.
- 앱인토스 정책을 위반할 가능성이 있는 기능은 구현 전 리스크를 설명한다.

---

# Phase 0. 프로젝트 이해 및 작업 계획

## Step 0-1. 프로젝트 컨텍스트 읽기

```md
## 작업 목표
이 프로젝트의 목적과 구현 범위를 이해하고, 현재 코드베이스 상태를 파악해 주세요.

## 현재 상태
프로젝트 루트에 `CLAUDE.md`가 있습니다. 아직 구현이 시작되지 않았거나 초기 스캐폴딩 직후일 수 있습니다.

## 요구사항
- `CLAUDE.md`를 먼저 읽어 주세요.
- 현재 파일 구조를 확인해 주세요.
- 사용 중인 프레임워크, 빌드 도구, 패키지 매니저를 확인해 주세요.
- 앱 이름, 서비스 목적, MVP/MVP+ 범위, 금지사항을 요약해 주세요.
- 아직 코드는 수정하지 마세요.
- 다음 구현을 위한 전체 Phase 계획을 제안해 주세요.

## 제한사항
- 파일 수정 금지
- 패키지 설치 금지
- 기능 구현 금지
- 추측으로 스택을 단정하지 말 것

## 출력 형식
1. 현재 프로젝트 구조 요약
2. 확인한 기술 스택
3. 서비스 목적 요약
4. MVP 범위 요약
5. 주요 금지사항 요약
6. 추천 구현 순서
7. 다음 Step 제안
```

---

## Step 0-2. 프로젝트 스캐폴딩 계획 수립

```md
## 작업 목표
현재 프로젝트 상태를 기준으로, `카공 어디가? 인천편` MVP 개발을 위한 최소 스캐폴딩 계획을 세워 주세요.

## 현재 상태
이전 Step에서 프로젝트 구조를 확인했습니다.

## 요구사항
- 현재 스택이 React/Vite/TypeScript인지 확인해 주세요.
- 스캐폴딩이 안 되어 있다면 React + TypeScript 기준으로 필요한 생성 명령을 제안해 주세요.
- 이미 스캐폴딩이 되어 있다면 추가로 필요한 폴더 구조만 제안해 주세요.
- 아래 구조를 기준으로 하되, 기존 프로젝트와 충돌하지 않게 조정해 주세요.

```text
src/
  app/
  pages/
  components/
  data/
  types/
  utils/
  services/
  styles/
```

## 제한사항
- 아직 파일을 만들지 마세요.
- 먼저 계획만 작성해 주세요.
- 과도한 상태관리 라이브러리 추가 금지
- 지도 API SDK 설치 금지

## 출력 형식
1. 현재 상태 판단
2. 필요한 폴더 구조
3. 생성/수정 예정 파일
4. 구현 순서
5. 테스트 방법
6. 사용자 승인 후 실행할 작업
```

---

# Phase 1. 기본 프로젝트 구조와 타입

## Step 1-1. 기본 폴더 구조 생성

```md
## 작업 목표
`카공 어디가? 인천편` MVP 구현을 위한 기본 폴더 구조를 생성해 주세요.

## 현재 상태
스캐폴딩 계획은 확정되었습니다.

## 요구사항
- 아래 폴더를 생성해 주세요.
  - `src/app`
  - `src/pages`
  - `src/components`
  - `src/data`
  - `src/types`
  - `src/utils`
  - `src/services`
  - `src/styles`
- 기존 파일이 있다면 삭제하지 말고 유지해 주세요.
- 변경 범위는 폴더 생성과 필요한 placeholder 파일 정도로 제한해 주세요.
- 빈 폴더가 Git에 포함되지 않는 환경이면 `.gitkeep`을 추가해 주세요.

## 제한사항
- 기능 구현 금지
- UI 구현 금지
- 패키지 설치 금지
- 기존 파일 삭제 금지

## 변경 예상 파일
- `src/app/.gitkeep`
- `src/pages/.gitkeep`
- `src/components/.gitkeep`
- `src/data/.gitkeep`
- `src/types/.gitkeep`
- `src/utils/.gitkeep`
- `src/services/.gitkeep`
- `src/styles/.gitkeep`

## 테스트 방법
- 폴더 구조가 생성되었는지 확인
- 기존 앱 실행에 영향이 없는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일/폴더 목록
3. 테스트 방법
4. 다음 Step 제안
```

---

## Step 1-2. 핵심 TypeScript 타입 정의

```md
## 작업 목표
카페, 사용자 조건, 추천 결과, 후보 데이터에 대한 TypeScript 타입을 정의해 주세요.

## 현재 상태
기본 폴더 구조가 생성되어 있습니다.

## 요구사항
- `src/types/cafe.ts`를 생성해 주세요.
- 아래 타입을 정의해 주세요.
  - `Cafe`
  - `CafeAttributes`
  - `CafeStatus`
  - `CafeTag`
  - `UserPreference`
  - `PeopleType`
  - `MoodType`
  - `RecommendationResult`
  - `CafeCandidate`
- `CLAUDE.md`의 데이터 모델을 기준으로 하되, 실제 구현에 적합하게 정리해 주세요.
- 점수형 필드는 0~5 범위를 가정해 주세요.
- 반경은 1, 3, 5km만 허용해 주세요.

## 제한사항
- 런타임 로직 구현 금지
- UI 구현 금지
- 외부 라이브러리 추가 금지

## 변경 예상 파일
- `src/types/cafe.ts`

## 테스트 방법
- TypeScript 타입 에러가 없는지 확인
- 해당 타입을 import할 수 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 주요 타입 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 1-3. 인천 카페 Mock 데이터 생성

```md
## 작업 목표
개발 초기 추천 로직과 UI 테스트를 위한 인천 카페 Mock 데이터를 생성해 주세요.

## 현재 상태
`src/types/cafe.ts`에 핵심 타입이 정의되어 있습니다.

## 요구사항
- `src/data/cafes.mock.ts`를 생성해 주세요.
- `Cafe[]` 타입의 mock 데이터를 12개 이상 작성해 주세요.
- 지역은 인천 내 다양한 구/동이 포함되게 해 주세요.
  - 예: 송도, 부평, 구월동, 청라, 주안, 검단, 계양, 연수동, 동인천, 인하대 주변
- 각 카페는 아래 속성을 포함해야 합니다.
  - 이름
  - 구
  - 동
  - 주소
  - 위도/경도
  - 요약
  - 24시간 여부
  - 네이버 지도 URL
  - 태그
  - 카공 속성 점수
- 실제 리뷰 원문이나 외부 평점을 넣지 마세요.
- 데이터는 초기 개발용 샘플임을 주석으로 명시해 주세요.

## 제한사항
- 외부 리뷰/사진/평점 복제 금지
- 실제 운영 데이터처럼 단정하는 문구 금지
- 네이버/구글 데이터 무단 복제 금지

## 변경 예상 파일
- `src/data/cafes.mock.ts`

## 테스트 방법
- 타입 에러 없이 mock 데이터가 `Cafe[]`로 추론되는지 확인
- 각 데이터에 필수 필드가 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 데이터 개수 및 지역 분포
4. 테스트 방법
5. 다음 Step 제안
```

---

# Phase 2. 핵심 유틸 함수

## Step 2-1. 거리 계산 유틸 구현

```md
## 작업 목표
사용자 위치와 카페 위치 사이의 거리를 계산하는 유틸 함수를 구현해 주세요.

## 현재 상태
카페 타입과 mock 데이터가 있습니다.

## 요구사항
- `src/utils/distance.ts`를 생성해 주세요.
- Haversine 공식을 사용해 두 좌표 간 거리를 km 단위로 계산하는 함수를 작성해 주세요.
- 아래 함수를 포함해 주세요.
  - `calculateDistanceKm(from, to)`
  - `isWithinRadius(distanceKm, radiusKm)`
  - `formatDistance(distanceKm)`
- 좌표 타입은 간단히 `{ lat: number; lng: number }` 형태로 정의하거나 재사용해 주세요.
- 소수점 표시 규칙은 아래처럼 해 주세요.
  - 1km 미만: `850m`
  - 1km 이상: `1.2km`

## 제한사항
- 외부 라이브러리 사용 금지
- 지도 API 호출 금지
- UI 구현 금지

## 변경 예상 파일
- `src/utils/distance.ts`

## 테스트 방법
- 임의의 두 좌표로 거리 계산 결과 확인
- 1km 미만/이상 포맷 확인
- TypeScript 타입 체크

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 함수별 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 2-2. 네이버 지도 URL 유틸 구현

```md
## 작업 목표
카페 상세 화면에서 사용할 네이버 지도 검색/길찾기 URL 생성 유틸을 구현해 주세요.

## 현재 상태
카페 데이터에는 카페명, 주소, 위도/경도, naverMapUrl 후보가 있습니다.

## 요구사항
- `src/utils/naverMap.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `createNaverMapSearchUrl(cafeName: string, address?: string): string`
  - `createNaverMapDirectionUrl(params): string`
- 초기 버전은 안정성을 위해 검색 URL 중심으로 구현해 주세요.
- 카페명과 주소는 `encodeURIComponent`로 안전하게 처리해 주세요.
- `naverMapUrl`이 이미 있는 경우 우선 사용할 수 있도록 helper를 제공해 주세요.
  - `getCafeMapUrl(cafe)`

## 제한사항
- 네이버 지도 API 키 사용 금지
- 외부 SDK 설치 금지
- 위치/경로 API 호출 금지
- URL 문자열 생성만 구현

## 변경 예상 파일
- `src/utils/naverMap.ts`

## 테스트 방법
- 한글 카페명/주소가 URL 인코딩되는지 확인
- `naverMapUrl`이 있는 경우 우선 반환되는지 확인
- 타입 체크

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 함수별 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 2-3. 추천 점수 계산 유틸 구현

```md
## 작업 목표
사용자 조건과 카페 속성을 비교해 추천 점수를 계산하는 유틸 함수를 구현해 주세요.

## 현재 상태
- `Cafe`, `UserPreference`, `RecommendationResult` 타입이 있습니다.
- 거리 계산 유틸이 있습니다.
- mock 카페 데이터가 있습니다.

## 요구사항
- `src/utils/recommendation.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `scoreCafeByPreference(cafe, preference, distanceKm)`
  - `recommendCafes(cafes, preference, userLocation, limit?)`
  - `getRecommendationReason(cafe, preference)`
- 점수 기준은 아래를 따르세요.
  - 거리 적합도: 30
  - 인원 적합도: 20
  - 분위기 적합도: 15
  - 콘센트: 10
  - 와이파이: 5
  - 체류 적합성: 10
  - 영업시간/24시간: 5
  - 커피/디저트: 5
- 반경 밖 카페는 제외해 주세요.
- 기본 limit은 3, 더보기 시 5까지 가능하게 해 주세요.
- 결과에는 점수, 거리, 추천 이유가 포함되어야 합니다.

## 제한사항
- AI 추천 모델 사용 금지
- 외부 API 호출 금지
- UI 구현 금지
- 복잡한 최적화 금지

## 변경 예상 파일
- `src/utils/recommendation.ts`

## 테스트 방법
- 반경 밖 카페가 제외되는지 확인
- 조건과 잘 맞는 카페가 상위에 오는지 확인
- TOP 3/5 limit이 동작하는지 확인
- 추천 이유 문자열이 생성되는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 추천 로직 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

# Phase 3. UI 컴포넌트

## Step 3-1. 공통 Badge/Chip 컴포넌트 구현

```md
## 작업 목표
카공 조건과 태그를 표시할 공통 UI 컴포넌트를 구현해 주세요.

## 현재 상태
기본 타입과 유틸 함수가 있습니다.

## 요구사항
- `src/components/TagBadge.tsx`를 생성해 주세요.
- `src/components/FilterChip.tsx`를 생성해 주세요.
- TagBadge는 카페 태그 표시용입니다.
- FilterChip은 선택 가능한 조건 버튼입니다.
- 접근성을 위해 button에는 `type="button"`을 명시해 주세요.
- 선택 상태가 시각적으로 구분되도록 className을 분기해 주세요.
- 스타일은 기존 프로젝트 스타일 방식을 따르세요.
- 스타일 방식이 없다면 간단한 CSS class 기반으로 구현해 주세요.

## 제한사항
- UI 라이브러리 추가 금지
- 복잡한 디자인 시스템 구축 금지
- 상태관리 라이브러리 추가 금지

## 변경 예상 파일
- `src/components/TagBadge.tsx`
- `src/components/FilterChip.tsx`
- 필요 시 스타일 파일

## 테스트 방법
- 컴포넌트가 import 가능한지 확인
- 선택 상태/비선택 상태 렌더링 확인
- TypeScript 타입 체크

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 컴포넌트 props 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 3-2. RadiusSelector 구현

```md
## 작업 목표
1km, 3km, 5km 반경을 선택하는 컴포넌트를 구현해 주세요.

## 현재 상태
FilterChip 컴포넌트가 있습니다.

## 요구사항
- `src/components/RadiusSelector.tsx`를 생성해 주세요.
- 선택 가능한 값은 1, 3, 5만 허용해 주세요.
- props:
  - `value`
  - `onChange`
- 내부적으로 FilterChip을 재사용해 주세요.
- 라벨은 `1km`, `3km`, `5km`로 표시해 주세요.

## 제한사항
- 다른 반경 옵션 추가 금지
- 지도 API 사용 금지

## 변경 예상 파일
- `src/components/RadiusSelector.tsx`

## 테스트 방법
- 1/3/5 선택이 동작하는지 확인
- 잘못된 값이 들어가지 않는지 타입으로 제한되는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 테스트 방법
4. 다음 Step 제안
```

---

## Step 3-3. CafeCard 구현

```md
## 작업 목표
추천 결과와 인천 BEST 리스트에서 재사용할 CafeCard 컴포넌트를 구현해 주세요.

## 현재 상태
- Cafe 타입이 있습니다.
- RecommendationResult 타입이 있습니다.
- TagBadge 컴포넌트가 있습니다.
- 네이버 지도 URL 유틸이 있습니다.

## 요구사항
- `src/components/CafeCard.tsx`를 생성해 주세요.
- props:
  - `cafe`
  - `distanceLabel?`
  - `score?`
  - `reason?`
  - `onClick`
  - `onFavoriteClick?`
  - `isFavorite?`
- 카드에 아래 정보를 표시해 주세요.
  - 카페명
  - 구/동
  - 거리
  - 대표 태그 3~5개
  - 추천 이유
  - 저장 버튼
  - 상세 보기 유도
- 외부 지도 링크는 카드에서는 열지 말고 상세 화면에서만 다루는 구조로 해 주세요.

## 제한사항
- 카드 클릭 시 바로 외부 링크 이동 금지
- 이미지 사용 금지
- 외부 리뷰 텍스트 표시 금지

## 변경 예상 파일
- `src/components/CafeCard.tsx`

## 테스트 방법
- mock 데이터로 카드 렌더링 확인
- 태그 3~5개 표시 확인
- 클릭 핸들러 호출 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. UI 표시 항목
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 3-4. EmptyState 컴포넌트 구현

```md
## 작업 목표
추천 결과 없음, 즐겨찾기 없음, 최근 본 카페 없음 상태에서 사용할 EmptyState 컴포넌트를 구현해 주세요.

## 현재 상태
공통 컴포넌트 일부가 있습니다.

## 요구사항
- `src/components/EmptyState.tsx`를 생성해 주세요.
- props:
  - `title`
  - `description`
  - `actionLabel?`
  - `onAction?`
- 추천 결과 없음 상황에서는 조건 완화/반경 확대를 안내할 수 있게 해 주세요.

## 제한사항
- 복잡한 일러스트/이미지 추가 금지
- 외부 라이브러리 추가 금지

## 변경 예상 파일
- `src/components/EmptyState.tsx`

## 테스트 방법
- title/description 렌더링 확인
- actionLabel이 있을 때 버튼 표시 확인
- onAction 호출 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 테스트 방법
4. 다음 Step 제안
```

---

# Phase 4. 페이지 구현

## Step 4-1. HomePage 구현

```md
## 작업 목표
사용자가 위치 기반 카공 추천을 시작할 수 있는 HomePage를 구현해 주세요.

## 현재 상태
- 타입, mock 데이터, 추천 유틸, 공통 컴포넌트가 있습니다.

## 요구사항
- `src/pages/HomePage.tsx`를 생성 또는 수정해 주세요.
- 아래 입력 UI를 포함해 주세요.
  - 반경 선택: 1km / 3km / 5km
  - 인원: 혼자 / 2~4명 / 5명 이상
  - 분위기: 조용한 곳 / 대화 가능한 곳
  - 조건: 콘센트 / 와이파이 / 늦게까지 / 24시간 / 커피 / 디저트
- CTA:
  - `카공 카페 추천받기`
  - `인천 BEST 보기`
- 위치 권한은 이 Step에서는 실제 구현하지 말고, 임시 위치 값을 사용해도 됩니다.
- 선택된 조건을 부모 또는 라우팅으로 전달할 수 있는 구조를 고려해 주세요.
- 현재 프로젝트에 라우터가 없다면 페이지 컴포넌트만 구현하고 연결은 다음 Step으로 미뤄 주세요.

## 제한사항
- 실제 위치 권한 요청 구현은 아직 하지 말 것
- Supabase 연결 금지
- 외부 API 호출 금지
- 과도한 상태관리 금지

## 변경 예상 파일
- `src/pages/HomePage.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 조건 선택 UI가 렌더링되는지 확인
- 각 Chip 선택/해제가 동작하는지 확인
- CTA 클릭 시 console 또는 callback으로 선택값 확인
- TypeScript 타입 체크

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 상태 구조 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 4-2. RecommendationPage 구현

```md
## 작업 목표
사용자 조건을 기반으로 추천 결과 TOP 3~5를 보여주는 RecommendationPage를 구현해 주세요.

## 현재 상태
- HomePage에서 조건 선택이 가능합니다.
- mock 카페 데이터와 추천 유틸이 있습니다.
- CafeCard와 EmptyState 컴포넌트가 있습니다.

## 요구사항
- `src/pages/RecommendationPage.tsx`를 생성 또는 수정해 주세요.
- 임시 사용자 위치를 사용해 추천 결과를 계산해 주세요.
- 기본 TOP 3을 보여주세요.
- `더 보기` 클릭 시 TOP 5까지 보여주세요.
- 추천 결과가 없으면 EmptyState를 보여주세요.
- 결과 요약 문구를 표시해 주세요.
  - 예: `내 주변 3km 안에서 조건에 맞는 카페 3곳을 찾았어요`
- 각 카드 클릭 시 상세 화면으로 이동할 수 있는 구조를 만들어 주세요.
- 라우터가 아직 없다면 선택된 cafeId를 상태로 관리하거나 다음 Step으로 미뤄도 됩니다.

## 제한사항
- 외부 API 호출 금지
- 지도 이동 금지
- 즐겨찾기 저장은 아직 구현하지 말 것
- 결과 카드를 너무 많이 보여주지 말 것

## 변경 예상 파일
- `src/pages/RecommendationPage.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 조건에 따라 결과 순서가 바뀌는지 확인
- TOP 3/5 전환 확인
- 빈 결과 상태 확인
- 카드 클릭 이벤트 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 추천 결과 표시 방식
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 4-3. CafeDetailPage 구현

```md
## 작업 목표
선택한 카페의 상세 정보를 보여주고 네이버 지도 링크로 이동할 수 있는 CafeDetailPage를 구현해 주세요.

## 현재 상태
- 추천 결과 카드에서 cafeId를 선택할 수 있는 구조가 있습니다.
- 카페 mock 데이터가 있습니다.
- 네이버 지도 URL 유틸이 있습니다.

## 요구사항
- `src/pages/CafeDetailPage.tsx`를 생성 또는 수정해 주세요.
- 아래 정보를 표시해 주세요.
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
  - 한 줄 요약
- CTA:
  - `네이버 지도에서 보기`
  - `저장하기`
  - `정보 수정 제안`
- 네이버 지도 CTA는 새 창 또는 현재 WebView 정책에 맞는 방식으로 열 수 있게 구현하되, 안전하게 `window.open` 또는 anchor를 사용해 주세요.
- 외부 링크가 보조 기능임을 UI상 과하게 강조하지 마세요.

## 제한사항
- 외부 리뷰/사진 표시 금지
- 지도 SDK 추가 금지
- 실제 저장 기능은 다음 Step에서 구현

## 변경 예상 파일
- `src/pages/CafeDetailPage.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- cafeId로 상세 데이터 조회 확인
- 없는 cafeId 처리 확인
- 네이버 지도 URL 생성 확인
- CTA 클릭 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 상세 화면 구성
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 4-4. DistrictBestPage 구현

```md
## 작업 목표
인천 구/동별 BEST 3~5 카페를 탐색하는 DistrictBestPage를 구현해 주세요.

## 현재 상태
- 카페 mock 데이터가 있습니다.
- CafeCard 컴포넌트가 있습니다.

## 요구사항
- `src/pages/DistrictBestPage.tsx`를 생성 또는 수정해 주세요.
- 구 선택 UI를 구현해 주세요.
- 선택한 구에 해당하는 동 목록을 보여주세요.
- 구/동 선택 후 BEST 3~5를 보여주세요.
- 초기 랭킹은 아래 기준을 단순 합산해도 됩니다.
  - 카공 적합도
  - 조용함
  - 콘센트
  - 체류 적합성
  - 커피/디저트
- 결과가 없으면 EmptyState를 보여주세요.
- 이 화면은 위치 기반 추천과 분리된 탐색 화면으로 구성해 주세요.

## 제한사항
- 위치 기반 추천 점수와 섞지 말 것
- 외부 API 호출 금지
- 사용자 행동 기반 자동 랭킹은 아직 구현하지 말 것

## 변경 예상 파일
- `src/pages/DistrictBestPage.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 구 선택 시 동 목록이 바뀌는지 확인
- 동 선택 시 BEST 리스트가 나오는지 확인
- 결과 없음 상태 확인
- 카드 클릭 시 상세 이동 구조 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. BEST 산정 방식
4. 테스트 방법
5. 다음 Step 제안
```

---

# Phase 5. 앱 상태와 로컬 저장

## Step 5-1. 간단한 라우팅/화면 전환 구조 정리

```md
## 작업 목표
Home, Recommendation, CafeDetail, DistrictBest 화면을 이동할 수 있는 최소 라우팅 또는 상태 기반 화면 전환 구조를 구현해 주세요.

## 현재 상태
각 페이지 컴포넌트가 생성되어 있습니다.

## 요구사항
- 현재 프로젝트에 React Router가 이미 있다면 그것을 사용해 주세요.
- 없다면 MVP 단계에서는 간단한 상태 기반 화면 전환으로 구현해도 됩니다.
- 필요한 화면:
  - home
  - recommendations
  - cafeDetail
  - districtBest
- 선택된 조건과 선택된 cafeId를 전달할 수 있어야 합니다.
- 구조가 커지지 않게 최소 구현으로 진행해 주세요.

## 제한사항
- 라우팅 라이브러리를 새로 설치하려면 먼저 이유를 설명하고 승인받을 것
- 복잡한 전역 상태관리 추가 금지
- URL 설계 고도화는 후순위

## 변경 예상 파일
- `src/app/App.tsx`
- 필요 시 `src/app/routes.tsx`
- 관련 page 파일

## 테스트 방법
- 홈 → 추천 결과 이동
- 추천 결과 → 상세 이동
- 홈 → 인천 BEST 이동
- 인천 BEST → 상세 이동
- 뒤로 가기 또는 홈 이동 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 화면 전환 방식 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 5-2. 즐겨찾기 기능 구현

```md
## 작업 목표
사용자가 카페를 즐겨찾기에 저장하고 삭제할 수 있게 구현해 주세요.

## 현재 상태
CafeDetailPage와 CafeCard가 있습니다.
아직 Supabase는 연결하지 않습니다.

## 요구사항
- localStorage 기반으로 즐겨찾기를 구현해 주세요.
- `src/services/favoriteService.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `getFavorites()`
  - `isFavorite(cafeId)`
  - `addFavorite(cafeId)`
  - `removeFavorite(cafeId)`
  - `toggleFavorite(cafeId)`
- `src/pages/FavoritesPage.tsx`를 생성해 주세요.
- 즐겨찾기한 카페 목록을 표시해 주세요.
- CafeCard 또는 CafeDetailPage에서 저장/삭제가 가능하게 연결해 주세요.

## 제한사항
- Supabase 연결 금지
- 로그인 구현 금지
- 복잡한 전역 상태관리 금지

## 변경 예상 파일
- `src/services/favoriteService.ts`
- `src/pages/FavoritesPage.tsx`
- `src/pages/CafeDetailPage.tsx`
- `src/components/CafeCard.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 저장하기 클릭 시 localStorage에 반영 확인
- 다시 클릭 시 삭제 확인
- 즐겨찾기 화면에 목록 표시 확인
- 새로고침 후 유지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 저장 방식 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 5-3. 최근 본 카페 기능 구현

```md
## 작업 목표
사용자가 상세 화면에서 본 카페를 최근 본 카페 목록에 저장해 주세요.

## 현재 상태
상세 화면과 localStorage 기반 서비스 패턴이 있습니다.

## 요구사항
- `src/services/recentViewService.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `getRecentViews()`
  - `addRecentView(cafeId)`
  - `clearRecentViews()`
- 최대 20개까지만 저장해 주세요.
- 중복 조회 시 최신 위치로 이동시켜 주세요.
- `src/pages/RecentViewsPage.tsx`를 생성해 주세요.
- CafeDetailPage 진입 시 최근 본 카페에 저장되게 해 주세요.

## 제한사항
- 서버 저장 금지
- 로그인 구현 금지
- 너무 많은 데이터 저장 금지

## 변경 예상 파일
- `src/services/recentViewService.ts`
- `src/pages/RecentViewsPage.tsx`
- `src/pages/CafeDetailPage.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 상세 진입 시 최근 본 카페 저장 확인
- 중복 진입 시 최신 순서 변경 확인
- 최대 20개 제한 확인
- 전체 삭제 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 저장 정책 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

# Phase 6. 제안하기 및 로그

## Step 6-1. 카페 제안하기 기능 구현

```md
## 작업 목표
사용자가 카공하기 좋은 카페를 제안할 수 있는 화면과 localStorage 기반 임시 저장 구조를 구현해 주세요.

## 현재 상태
기본 페이지와 localStorage 서비스 패턴이 있습니다.

## 요구사항
- `src/pages/SuggestCafePage.tsx`를 생성해 주세요.
- 입력 항목:
  - 카페명
  - 주소
  - 추천 이유
  - 추천 태그
- `src/services/suggestionService.ts`를 생성해 주세요.
- 제출된 제안은 localStorage에 `pending` 상태로 저장해 주세요.
- 제출 완료 메시지를 보여주세요.
- 안내 문구:
  - `제안해주신 카페는 검수 후 반영돼요.`
- 간단한 필수값 검증을 추가해 주세요.

## 제한사항
- 제출 즉시 cafes mock 데이터에 반영하지 말 것
- 외부 API 호출 금지
- 서버 전송 금지
- 리뷰 원문 복사 유도 금지

## 변경 예상 파일
- `src/pages/SuggestCafePage.tsx`
- `src/services/suggestionService.ts`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 필수값 누락 시 에러 표시
- 정상 제출 시 localStorage 저장 확인
- 제출 완료 메시지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 검수 대기 정책 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

## Step 6-2. 이벤트 로그 서비스 구현

```md
## 작업 목표
MVP+에서 사용자 행동 데이터를 쌓기 위한 이벤트 로그 서비스를 구현해 주세요.

## 현재 상태
주요 화면과 사용자 액션이 구현되어 있습니다.
아직 서버 전송은 하지 않습니다.

## 요구사항
- `src/services/logService.ts`를 생성해 주세요.
- 아래 타입 또는 유사 구조를 정의해 주세요.
  - `LogEventName`
  - `LogEventPayload`
- 아래 함수를 구현해 주세요.
  - `trackEvent(name, payload?)`
  - `getLocalEvents()`
  - `clearLocalEvents()`
- 초기에는 localStorage 또는 console 기반으로 동작하게 해 주세요.
- 주요 화면/액션에 최소한의 이벤트를 연결해 주세요.
  - home_view
  - recommendation_requested
  - recommendation_result_view
  - cafe_card_click
  - cafe_detail_view
  - favorite_add
  - direction_click
  - district_best_view
  - suggestion_submit

## 제한사항
- 외부 analytics SDK 추가 금지
- 개인정보 저장 금지
- 위치 좌표를 로그에 직접 저장하지 말 것
- 서버 전송 금지

## 변경 예상 파일
- `src/services/logService.ts`
- 관련 page/component 파일

## 테스트 방법
- 각 액션 시 이벤트가 기록되는지 확인
- 개인정보가 포함되지 않는지 확인
- localStorage/console에서 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 기록 이벤트 목록
4. 개인정보 보호 방식
5. 테스트 방법
6. 다음 Step 제안
```

---

# Phase 7. 위치 권한과 사용자 위치

## Step 7-1. 위치 권한 처리 구현

```md
## 작업 목표
브라우저 Geolocation API를 사용해 사용자 위치를 가져오고, 실패 시 안전한 fallback을 제공해 주세요.

## 현재 상태
추천 로직은 임시 위치를 사용하고 있습니다.

## 요구사항
- `src/services/locationService.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `getCurrentLocation()`
  - `getFallbackLocation()`
- 위치 권한 허용 시 현재 위치를 사용해 주세요.
- 위치 권한 거부/실패 시 인천 중심 좌표 또는 수동 선택 안내로 fallback해 주세요.
- HomePage 또는 추천 시작 시 위치를 가져오도록 연결해 주세요.
- 위치 권한 상태에 따른 안내 문구를 표시해 주세요.

## 제한사항
- 위치 좌표를 로그에 직접 저장하지 말 것
- 서버 전송 금지
- 앱인토스 전용 위치 API는 아직 사용하지 말 것
- 권한 요청을 반복적으로 강제하지 말 것

## 변경 예상 파일
- `src/services/locationService.ts`
- `src/pages/HomePage.tsx`
- `src/pages/RecommendationPage.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 위치 허용 시 현재 위치 기반 추천 확인
- 위치 거부 시 fallback 동작 확인
- 브라우저에서 권한 상태 변경 테스트
- 로그에 좌표가 저장되지 않는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 권한 처리 흐름
4. fallback 정책
5. 테스트 방법
6. 다음 Step 제안
```

---

# Phase 8. Supabase 전환 준비

## Step 8-1. Supabase 스키마 초안 작성

```md
## 작업 목표
현재 local/mock 기반 구조를 Supabase/PostgreSQL로 전환하기 위한 SQL 스키마 초안을 작성해 주세요.

## 현재 상태
프론트엔드 MVP 기능이 local/mock 기반으로 동작합니다.

## 요구사항
- `docs/supabase-schema.sql` 파일을 생성해 주세요.
- 아래 테이블을 포함해 주세요.
  - cafes
  - cafe_attributes
  - cafe_tags
  - favorites
  - recent_views
  - filter_logs
  - district_best_rankings
  - user_suggestions
  - raw_cafe_candidates
- 각 테이블에 primary key와 created_at을 포함해 주세요.
- 외래키 관계를 정의해 주세요.
- status/review_status는 enum 또는 check constraint로 제한해 주세요.
- RLS는 주석으로 TODO를 남겨 주세요.

## 제한사항
- 실제 Supabase 연결 코드는 아직 작성하지 말 것
- 마이그레이션 실행 금지
- 민감정보 컬럼 추가 금지

## 변경 예상 파일
- `docs/supabase-schema.sql`

## 테스트 방법
- SQL 문법 검토
- 테이블 간 관계 검토
- 현재 TypeScript 타입과 매핑 가능한지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 테이블 목록
4. 타입 매핑 설명
5. 테스트 방법
6. 다음 Step 제안
```

---

## Step 8-2. CafeService 추상화

```md
## 작업 목표
현재 mock 데이터를 직접 import하는 구조를 서비스 레이어로 감싸서, 나중에 Supabase로 쉽게 전환할 수 있게 해 주세요.

## 현재 상태
여러 페이지에서 `cafes.mock.ts`를 직접 사용할 수 있습니다.

## 요구사항
- `src/services/cafeService.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `getCafes()`
  - `getCafeById(id)`
  - `getCafesByDistrict(district, dong?)`
- 내부 구현은 현재 mock 데이터를 사용해 주세요.
- 기존 페이지에서 mock 데이터를 직접 import하고 있다면 cafeService 사용으로 바꿔 주세요.

## 제한사항
- Supabase 연결 금지
- API fetch 구현 금지
- 복잡한 repository 패턴 금지

## 변경 예상 파일
- `src/services/cafeService.ts`
- 관련 page/util 파일

## 테스트 방법
- 기존 추천 결과가 동일하게 동작하는지 확인
- 상세 조회가 동작하는지 확인
- 인천 BEST가 동작하는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 서비스 추상화 설명
4. 테스트 방법
5. 다음 Step 제안
```

---

# Phase 9. 데이터 후보 수집 자동화 설계

## Step 9-1. 후보 수집 자동화 설계 문서 작성

```md
## 작업 목표
SNS/네이버 검색 기반 카공 후보 수집 자동화 설계 문서를 작성해 주세요.

## 현재 상태
서비스의 데이터 수집 원칙은 `CLAUDE.md`에 정의되어 있습니다.

## 요구사항
- `docs/candidate-collection-plan.md`를 생성해 주세요.
- 아래 내용을 포함해 주세요.
  - 자동화 목적
  - 허용 가능한 데이터 소스
  - 금지되는 수집 방식
  - 키워드 생성 전략
  - 후보 정규화 방식
  - 중복 제거 방식
  - 네이버 지역 검색 검증 방식
  - 카공 속성 후보 추출 방식
  - 운영자 검수 큐 흐름
  - 최종 DB 반영 기준
- 공식 API 기반 수집과 수동 검수를 전제로 작성해 주세요.
- 비공식 크롤링이나 원문 복제는 금지한다고 명시해 주세요.

## 제한사항
- 실제 크롤러 코드 작성 금지
- 외부 리뷰/사진/평점 저장 금지
- SNS 게시물 본문/이미지 저장 금지

## 변경 예상 파일
- `docs/candidate-collection-plan.md`

## 테스트 방법
- 문서가 실제 DB 구조와 일치하는지 검토
- 금지/허용 범위가 명확한지 검토
- 운영자 검수 흐름이 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 자동화 범위 요약
4. 금지사항 요약
5. 다음 Step 제안
```

---

## Step 10-3. 앱인토스 심사 리스크 자체 점검 보고서 작성

```md
## 작업 목표
현재 구현과 문서를 기준으로 앱인토스 제출 전 심사 리스크를 자체 점검해 주세요.

## 현재 상태
- Phase 9.5 개선이 끝났습니다.
- `docs/apps-in-toss-checklist.md`가 있습니다.
- 앱 주요 화면과 기능이 구현되어 있습니다.

## 요구사항
- 현재 코드와 문서를 읽어 주세요.
- 바로 수정하지 말고 `docs/apps-in-toss-risk-review.md`를 생성해 리스크 보고서를 작성해 주세요.
- 아래 관점으로 점검해 주세요.
  - 핵심 기능 앱 내부 완결성
  - 외부 지도 링크 의존성
  - 외부 로그인/자사 로그인 여부
  - 위치 권한 안내와 fallback
  - 개인정보/로그 저장
  - 외부 데이터 복제 위험
  - 브랜드 혼동 위험
  - UX Writing 일관성
  - 다크패턴 가능성
  - 모바일 WebView/Safe Area
  - Empty/Loading/Error 상태
- 각 리스크를 `High / Medium / Low / 확인 필요`로 분류해 주세요.
- High 리스크는 Phase 10 안에서 해결할 수정 프롬프트를 제안해 주세요.
- Medium/Low는 Phase 11 또는 출시 후 개선으로 분리해 주세요.

## 제한사항
- 정책을 확정적으로 단정하지 말 것
- 불확실한 항목은 `확인 필요`로 둘 것
- 코드 수정 금지
- 대규모 리팩터링 제안 금지

## 변경 예상 파일
- `docs/apps-in-toss-risk-review.md`

## 테스트 방법
- 리스크가 기능/문서 기준으로 근거 있게 작성되었는지 확인
- High 항목이 실제 수정 가능한 단위로 나뉘었는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. High 리스크
4. Medium 리스크
5. Low 리스크
6. 확인 필요 항목
7. 수정 제안 Step
```

---

## Step 10-4. 위치 권한/외부 링크/데이터 정책 문구 점검 및 최소 수정

```md
## 작업 목표
앱인토스 제출 전 사용자 신뢰에 영향을 주는 문구를 점검하고, 필요한 부분만 최소 수정해 주세요.

## 현재 상태
- 위치 권한 안내 문구가 있습니다.
- 네이버 지도 링크 CTA가 있습니다.
- 카페 제안/데이터 기준 안내 문구가 있습니다.
- 앱인토스 리스크 보고서가 있습니다.

## 요구사항
- 아래 문구를 점검해 주세요.
  - 위치 권한 요청 문구
  - 위치 권한 거부 시 안내 문구
  - 네이버 지도 링크 버튼 문구
  - 카페 제안 제출 완료 문구
  - 추천 기준 안내 문구
  - 데이터 기준 안내 문구
- 문구가 해요체인지 확인해 주세요.
- 버튼 문구가 클릭 후 행동을 예측 가능하게 만드는지 확인해 주세요.
- 필요한 경우에만 최소 수정해 주세요.
- 예시:
  - `네이버 지도에서 보기`
  - `위치를 허용하면 가까운 카페를 추천해드려요`
  - `위치를 허용하지 않아도 인천 BEST를 볼 수 있어요`
  - `제안해주신 카페는 검수 후 반영돼요`
  - `추천은 카공 조건과 거리 기준으로 계산해요`

## 제한사항
- 기능 변경 금지
- 디자인 전체 변경 금지
- 과장 문구 추가 금지
- 외부 링크를 핵심 기능처럼 보이게 하지 말 것

## 변경 예상 파일
- 관련 page/component 파일
- 필요 시 `docs/app-submission-copy.md`

## 테스트 방법
- 문구가 해요체인지 확인
- CTA 의미가 명확한지 확인
- 위치 거부 상태에서 사용자가 막히지 않는지 확인
- 네이버 지도 링크가 보조 기능으로 보이는지 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 수정한 문구 목록
4. 수정 이유
5. 테스트 방법
6. 다음 Step 제안
```

---

# Phase 11. 품질 개선

## Phase 11 목표

- 앱인토스 WebView 환경에서 사용자가 불편 없이 핵심 플로우를 완료할 수 있게 한다.
- 모바일 UX, 접근성, 긴 텍스트, 빈 상태, 오류 상태, localStorage 안정성을 점검한다.
- 출시 전 필요한 최소 리팩터링 계획을 세운다.
- 바로 대규모 수정하지 않고, 위험도가 높은 항목부터 작은 단위로 개선한다.

---

## Step 11-1. 접근성/모바일 UX 점검 및 최소 수정

```md
## 작업 목표
현재 구현된 화면의 모바일 UX와 접근성 문제를 점검하고, 필요한 부분만 최소 수정해 주세요.

## 현재 상태
- 주요 MVP/MVP+ 화면이 구현되어 있습니다.
- Phase 9.5에서 추천 카드, 상세, 제보, 저장 UX가 개선되었습니다.
- Phase 10에서 앱인토스 체크리스트와 리스크 보고서가 작성되었습니다.

## 요구사항
- 먼저 현재 주요 화면을 확인해 주세요.
  - HomePage
  - RecommendationPage
  - CafeDetailPage
  - DistrictBestPage
  - FavoritesPage
  - RecentViewsPage
  - SuggestCafePage
- 아래 항목을 점검해 주세요.
  - 버튼에 접근 가능한 텍스트 또는 aria-label이 있는지
  - 터치 영역이 모바일에서 충분한지
  - 긴 카페명/주소가 줄바꿈/말줄임 처리되는지
  - EmptyState가 모든 빈 상태에서 표시되는지
  - LoadingState가 필요한 상황에 표시되는지
  - Error fallback이 있는지
  - 위치 권한 거부 시 사용자가 막히지 않는지
  - 하단 CTA가 Safe Area를 침범하지 않는지
  - 키보드 탐색이 기본적으로 가능한지
  - 색상만으로 상태를 구분하지 않는지
- 개선이 필요한 부분만 최소 수정해 주세요.
- 수정 전 간단한 점검 결과를 먼저 작성하고, 그 다음 수정해 주세요.

## 제한사항
- 디자인 전체 개편 금지
- 새 UI 라이브러리 추가 금지
- 기능 추가 금지
- 라우팅 구조 대규모 변경 금지
- 상태관리 라이브러리 추가 금지

## 변경 예상 파일
- 관련 component/page/style 파일
- 예:
  - `src/components/CafeCard.tsx`
  - `src/components/EmptyState.tsx`
  - `src/components/LoadingState.tsx`
  - `src/pages/*`
  - `src/styles/globals.css`

## 테스트 방법
- 360px 모바일 viewport에서 확인
- 키보드 tab 이동 기본 확인
- 위치 권한 거부 상태 확인
- 추천 결과 없음 상태 확인
- 즐겨찾기 없음 상태 확인
- 긴 카페명/주소 표시 확인
- 하단 CTA Safe Area 확인

## 출력 형식
1. 점검 결과
2. 수정한 항목
3. 변경 파일
4. 테스트 방법
5. 남은 개선 사항
```

---

## Step 11-2. localStorage 안정성 및 예외 처리 개선

```md
## 작업 목표
즐겨찾기, 최근 본 카페, 제안, 이벤트 로그에서 사용하는 localStorage 접근을 안정적으로 처리해 주세요.

## 현재 상태
- favoriteService, recentViewService, suggestionService, logService 등이 localStorage를 사용할 수 있습니다.

## 요구사항
- localStorage 접근 서비스들을 점검해 주세요.
- 아래 상황에서 앱이 깨지지 않게 처리해 주세요.
  - localStorage 사용 불가
  - JSON parse 실패
  - 저장 데이터 형식이 예상과 다름
  - 저장 용량 초과
  - 기존 버전 데이터와 충돌
- 공통 storage helper가 없다면 `src/utils/safeStorage.ts`를 생성해도 됩니다.
- 기존 서비스에서 중복된 try/catch가 많다면 helper로 최소 정리해 주세요.
- 사용자에게 노출되는 에러는 간단하고 안전한 문구를 사용해 주세요.
- 개인정보나 위치 좌표를 localStorage에 저장하지 않는지 확인해 주세요.

## 제한사항
- 서버 저장으로 전환하지 말 것
- Supabase 연결 금지
- 대규모 리팩터링 금지
- 기존 저장 데이터 강제 삭제 금지

## 변경 예상 파일
- `src/utils/safeStorage.ts`
- `src/services/favoriteService.ts`
- `src/services/recentViewService.ts`
- `src/services/suggestionService.ts`
- `src/services/logService.ts`

## 테스트 방법
- localStorage 데이터가 깨진 JSON일 때 앱이 멈추지 않는지 확인
- 즐겨찾기 저장/삭제 정상 확인
- 최근 본 카페 정상 확인
- 제안 제출 정상 확인
- 이벤트 로그 정상 확인
- 개인정보/좌표 저장 여부 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 예외 처리 방식
4. 개인정보/좌표 저장 점검 결과
5. 테스트 방법
6. 남은 개선 사항
```

---

## Step 11-3. 외부 링크 안전성 점검 및 개선

```md
## 작업 목표
네이버 지도 링크 등 외부 링크가 안전하고 예측 가능한 방식으로 동작하는지 점검하고 개선해 주세요.

## 현재 상태
- CafeDetailPage에서 네이버 지도 링크를 제공합니다.
- getCafeMapUrl 또는 naverMap 유틸이 있습니다.

## 요구사항
- 외부 링크 생성 유틸을 점검해 주세요.
- 카페명/주소가 URL 인코딩되는지 확인해 주세요.
- 링크가 없는 경우 fallback 검색 URL을 생성해 주세요.
- 외부 링크 버튼 문구가 명확한지 확인해 주세요.
  - `네이버 지도에서 보기`
- 새 창을 여는 경우 보안 속성을 적용해 주세요.
  - `target="_blank"`
  - `rel="noopener noreferrer"`
- WebView 환경에서 새 창이 부적절하면 현재 구조에 맞는 안전한 anchor 방식을 제안해 주세요.
- 링크 클릭 이벤트 로그에는 cafeId 정도만 저장하고 좌표는 저장하지 않게 해 주세요.

## 제한사항
- 지도 SDK 추가 금지
- 길찾기 API 추가 금지
- 외부 앱 설치 유도 금지
- 좌표를 로그에 저장하지 말 것

## 변경 예상 파일
- `src/utils/naverMap.ts`
- `src/pages/CafeDetailPage.tsx`
- `src/services/logService.ts`

## 테스트 방법
- 한글 카페명/주소 URL 인코딩 확인
- naverMapUrl이 있을 때 우선 사용 확인
- fallback 검색 URL 확인
- target/rel 속성 확인
- direction_click 로그에 좌표가 없는지 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 외부 링크 처리 방식
4. 보안 속성 적용 여부
5. 테스트 방법
6. 남은 개선 사항
```

---

## Step 11-4. 전체 코드 리뷰 및 리팩터링 계획

```md
## 작업 목표
현재 MVP/MVP+ 코드 전체를 리뷰하고, 출시 전 필요한 최소 리팩터링 계획을 세워 주세요.

## 현재 상태
- Phase 9.5와 Phase 10~11 일부가 진행되었습니다.
- 주요 기능은 구현되어 있습니다.

## 요구사항
- 먼저 코드를 읽고 구조를 파악해 주세요.
- 바로 수정하지 말고 리팩터링 계획만 작성해 주세요.
- 아래 관점으로 검토해 주세요.
  - 타입 안정성
  - 중복 코드
  - 추천 로직 분리
  - CafeCard 재사용성
  - AttributeSummary/ScoreLabel 일관성
  - 서비스 레이어 분리
  - localStorage 에러 처리
  - 외부 링크 안전성
  - 앱인토스 제출 리스크
  - 모바일 UX
  - 문구 일관성
  - 데이터 정책 준수
- 수정 필요도를 High / Medium / Low로 나눠 주세요.
- High 항목은 작은 Step 단위로 쪼개 주세요.
- 사용자 승인을 받은 뒤 High 항목부터 수정한다고 명시해 주세요.

## 제한사항
- 즉시 대규모 리팩터링 금지
- 기능 변경 금지
- 스택 변경 금지
- 라이브러리 추가 금지
- 코드 수정 금지

## 출력 형식
1. 코드 구조 요약
2. 리스크 목록
3. 리팩터링 후보
4. 우선순위
5. 수정 시 변경 예상 파일
6. 테스트 계획
7. 다음 승인 요청 문구
```

---

## Step 11-5. High Priority 리팩터링 실행

```md
## 작업 목표
Step 11-4에서 정리한 High Priority 리팩터링 항목 중 사용자 승인을 받은 항목만 최소 범위로 수정해 주세요.

## 현재 상태
- 전체 코드 리뷰 및 리팩터링 계획이 작성되었습니다.
- 사용자가 수정할 High Priority 항목을 승인했습니다.

## 요구사항
- 승인된 High Priority 항목만 수정해 주세요.
- 각 수정은 작게 나누어 진행해 주세요.
- 기능 동작을 바꾸지 말고 안정성과 가독성만 개선해 주세요.
- 수정 후 관련 수동 테스트와 타입 체크를 수행해 주세요.
- 수정 중 새 문제가 발견되면 임의로 확장하지 말고 보고해 주세요.

## 제한사항
- 승인되지 않은 항목 수정 금지
- 대규모 파일 이동 금지
- 새 라이브러리 추가 금지
- UX/기획 변경 금지
- 추천 알고리즘 변경 금지

## 변경 예상 파일
- Step 11-4에서 승인된 파일만

## 테스트 방법
- 관련 기능 수동 테스트
- typecheck
- build 가능 시 build
- 주요 플로우 회귀 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 수정 전/후 차이
4. 테스트 결과
5. 남은 리스크
6. Phase 12 진입 가능 여부
```

---

# 부록 A. Phase 10~11 완료 보고 형식

```md
## 완료 보고 형식

1. 변경 요약
2. 생성/수정/삭제 파일
3. 구현 또는 문서 상세
4. 테스트 결과
5. 앱인토스/데이터 정책 준수 여부
6. 확인 필요 항목
7. 다음 추천 작업
```

---

# 부록 B. Phase 10~11 공통 상기 문장

```md
이 프로젝트는 `카공 어디가? 인천편`입니다.
지도 앱이 아니라 인천 특화 카공 추천 Mini App입니다.
핵심은 위치 기반 TOP 3~5 추천과 구/동별 BEST 탐색입니다.
외부 리뷰/사진/평점 복제는 금지입니다.
네이버 지도 링크는 보조 기능입니다.
앱인토스 제출 전에는 브랜드, UX Writing, 다크패턴, Safe Area, 위치 권한, 외부 링크, 로그 저장을 반드시 점검하세요.
한 번에 전체 수정하지 말고 현재 Step 범위만 진행하세요.
```

---

# 부록 C. Phase 10 시작 전 통합 프롬프트

```md
프로젝트 루트의 `CLAUDE.md`와 Phase 9.5 완료 결과를 읽고, Phase 10 앱인토스 등록 준비를 시작해 주세요.

지금은 `docs/apps-in-toss-checklist.md`를 작성하는 Step 10-1만 진행합니다.

중요 원칙:
- 이 프로젝트는 `카공 어디가? 인천편`입니다.
- 지도 앱이 아니라 인천 특화 카공 추천 Mini App입니다.
- 핵심은 위치 기반 TOP 3~5 추천과 구/동별 BEST 탐색입니다.
- 네이버 지도 링크는 보조 기능입니다.
- 외부 리뷰/사진/평점 복제는 금지입니다.
- 불확실한 앱인토스 정책 항목은 완료 처리하지 말고 `확인 필요`로 표시하세요.

먼저 현재 구현 상태를 간단히 확인한 뒤, 체크리스트 문서를 생성해 주세요.
```
