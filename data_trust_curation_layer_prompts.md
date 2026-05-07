# 카공 어디가? 인천편 — 카공냥 Asset 적용 최종 Claude Code 프롬프트

> 목적: 현재 프로젝트 루트의 `img/` 폴더에 임시 저장된 카공냥 이미지를 실제 서비스용 asset 구조로 정리하고, 기존 화면에 UX 목적에 맞게 적용합니다.  
> 기준: 카공냥은 장식 이미지가 아니라 `추천 신뢰도`, `탐색 상태`, `빈 상태`, `카공 속성`을 설명하는 UI 보조 요소입니다.  
> 진행 원칙: 한 번에 전체 화면을 무리하게 바꾸지 말고, Step 단위로 작게 적용하세요.

---

# 0. 프로젝트 전제

## 현재 상태

- 프로젝트 루트에 `img/` 폴더가 있습니다.
- `img/` 안에 카공냥 이미지가 임시로 모여 있습니다.
- 현재 이미지 파일명 예시는 아래와 같습니다.

```txt
img/
  cafe-app-checking-img.png
  cafe-app-checklist-img.png
  cafe-app-enjoying-img.png
  cafe-app-firmly-img.png
  cafe-app-folded-img.png
  cafe-app-looking-img.png
  cafe-app-map-img.png
  cafe-app-night-img.png
  cafe-app-power-img.png
  cafe-app-searching-img.png
  cafe-app-sitting main-img.png
  cafe-app-sitting-img.png
  cafe-app-slightly-img.png
  cafe-app-sniffing-img.png
  cafe-app-standing-img.png
  cafe-app-thinking-img.png
  cafe-app-warning-img.png
  cafe-app-wifi-img.png
```

## 카공냥 정의

- 이름: `카공냥`
- 한 줄 정의: 인천에서 조용하고 콘센트 있는 카공 자리를 찾아주는 둥근 자리 탐색 고양이
- 외형:
  - 스코티쉬폴드/먼치킨 계열의 둥글고 낮은 체형
  - 크림 베이지 몸통
  - 따뜻한 브라운 포인트
  - 반쯤 뜬 집중형 눈
  - 플러그 모양 꼬리
  - 무심하지만 친절한 표정
- UX 역할:
  - `searching`: 탐색 중
  - `sitting`: 추천 확정 / 좋은 자리 확보
  - `thinking`: 조건 검토 중
  - `warning`: 결과 없음 / 조건 완화 필요
  - `night`: 야간 카공
  - `checking`: 기준 확인 / 큐레이션
  - `power`: 콘센트 강점
  - `map`: 위치 기반 탐색
  - `wifi`: 와이파이 상태
  - `empty`: 저장/코스 없음

---

# 1. 최종 Asset 구조

아래 구조를 생성하고, `img/`의 이미지를 복사 또는 이동해 주세요.

```txt
src/assets/mascot/kagong-nyang/
  hero/
    kagongnyang-hero-main.png
    kagongnyang-hero-map.png
    kagongnyang-hero-cafe.png

  state/
    kagongnyang-searching.png
    kagongnyang-sitting.png
    kagongnyang-thinking.png
    kagongnyang-warning.png
    kagongnyang-night.png

  feature/
    kagongnyang-power.png
    kagongnyang-wifi.png
    kagongnyang-checking.png
    kagongnyang-map.png
    kagongnyang-laptop.png

  empty/
    kagongnyang-empty-favorite.png
    kagongnyang-empty-course.png
    kagongnyang-empty-result.png

  icon/
    kagongnyang-icon-seat.png
```

---

# 2. 현재 파일명 → 최종 파일명 매핑

## 반드시 매핑

| 현재 파일명 | 최종 경로 |
|---|---|
| `img/cafe-app-searching-img.png` | `src/assets/mascot/kagong-nyang/state/kagongnyang-searching.png` |
| `img/cafe-app-sitting-img.png` | `src/assets/mascot/kagong-nyang/state/kagongnyang-sitting.png` |
| `img/cafe-app-thinking-img.png` | `src/assets/mascot/kagong-nyang/state/kagongnyang-thinking.png` |
| `img/cafe-app-warning-img.png` | `src/assets/mascot/kagong-nyang/state/kagongnyang-warning.png` |
| `img/cafe-app-night-img.png` | `src/assets/mascot/kagong-nyang/state/kagongnyang-night.png` |
| `img/cafe-app-power-img.png` | `src/assets/mascot/kagong-nyang/feature/kagongnyang-power.png` |
| `img/cafe-app-wifi-img.png` | `src/assets/mascot/kagong-nyang/feature/kagongnyang-wifi.png` |
| `img/cafe-app-checking-img.png` | `src/assets/mascot/kagong-nyang/feature/kagongnyang-checking.png` |
| `img/cafe-app-map-img.png` | `src/assets/mascot/kagong-nyang/feature/kagongnyang-map.png` |
| `img/cafe-app-looking-img.png` | `src/assets/mascot/kagong-nyang/feature/kagongnyang-laptop.png` |
| `img/cafe-app-sitting main-img.png` | `src/assets/mascot/kagong-nyang/hero/kagongnyang-hero-main.png` |
| `img/cafe-app-enjoying-img.png` | `src/assets/mascot/kagong-nyang/empty/kagongnyang-empty-favorite.png` |
| `img/cafe-app-standing-img.png` | `src/assets/mascot/kagong-nyang/empty/kagongnyang-empty-course.png` |
| `img/cafe-app-slightly-img.png` | `src/assets/mascot/kagong-nyang/empty/kagongnyang-empty-result.png` |

## 보류 파일

아래 파일은 의미가 중복될 가능성이 있으므로 `docs/mascot-asset-import-guide.md`에 보류 목록으로 기록하고, 코드에서는 바로 import하지 마세요.

```txt
img/cafe-app-firmly-img.png
img/cafe-app-folded-img.png
img/cafe-app-sniffing-img.png
img/cafe-app-checklist-img.png
```

필요하다면 추후 아래처럼 재분류할 수 있습니다.

- `folded` → `checking` 대체 후보
- `checklist` → `checking` 대체 후보
- `sniffing` → `searching` 대체 후보
- `firmly` → `seatIcon` 대체 후보

---

# 3. Step 1 — 이미지 asset 폴더 정리

```md
## 작업 목표
프로젝트 루트의 `img/` 폴더에 임시 저장된 카공냥 이미지를 실제 서비스 asset 구조로 정리해 주세요.

## 요구사항
1. 아래 폴더를 생성해 주세요.

```txt
src/assets/mascot/kagong-nyang/
  hero/
  state/
  feature/
  empty/
  icon/
```

2. `img/` 폴더의 이미지를 위의 매핑표에 따라 복사 또는 이동해 주세요.
3. 원본 `img/` 폴더는 삭제하지 말고 보존해 주세요.
4. 최종 asset 파일명은 모두 kebab-case를 사용해 주세요.
5. 파일명에는 한글, 공백, 대문자를 사용하지 마세요.
6. `cafe-app-sitting main-img.png`처럼 공백이 있는 파일은 반드시 새 파일명으로 정리해 주세요.
7. 보류 파일은 코드에서 import하지 말고 문서에만 기록해 주세요.
8. `docs/mascot-asset-import-guide.md`를 생성해 아래 내용을 기록해 주세요.
   - 원본 파일명
   - 최종 파일명
   - 사용 화면
   - 상태
   - 보류 파일 목록
   - 추후 삭제 가능 여부

## 제한사항
- 이미지 내용 수정 금지
- 이미지 압축/리사이징 금지
- 기존 UI 컴포넌트 수정 금지
- 없는 파일 import 금지
- `img/` 원본 폴더 삭제 금지

## 변경 예상 파일
- `src/assets/mascot/kagong-nyang/**`
- `docs/mascot-asset-import-guide.md`

## 테스트 방법
- 최종 폴더 구조 확인
- 파일명에 공백/한글/대문자가 없는지 확인
- 이미지가 정상적으로 열리는지 확인
- 보류 파일이 코드에서 import되지 않았는지 확인

## 출력 형식
1. 변경 요약
2. 생성한 폴더
3. 이동/복사한 파일 목록
4. 보류한 파일 목록
5. 누락된 파일
6. 다음 Step 제안
```

---

# 4. Step 2 — 카공냥 타입 및 asset map 생성

```md
## 작업 목표
카공냥 이미지를 React 컴포넌트에서 상태 기반으로 사용할 수 있도록 TypeScript 타입과 asset map을 생성해 주세요.

## 요구사항
1. `src/types/mascot.ts`를 생성해 주세요.
2. 아래 타입을 정의해 주세요.

```ts
export type MascotState =
  | "searching"
  | "sitting"
  | "thinking"
  | "warning"
  | "night"
  | "checking"
  | "power"
  | "wifi"
  | "map"
  | "laptop"
  | "emptyFavorite"
  | "emptyCourse"
  | "emptyResult"
  | "seatIcon"
  | "heroMain";

export type MascotSize = "xs" | "sm" | "md" | "lg" | "hero";
```

3. `src/assets/mascot/kagong-nyang/mascotAssets.ts`를 생성해 주세요.
4. 정리된 asset을 import하고 `mascotAssetMap`으로 export해 주세요.
5. 상태별 alt 텍스트도 `mascotAltMap`으로 관리해 주세요.
6. `seatIcon` 이미지가 아직 확정되지 않았다면 `seatIcon`은 import하지 말고 TODO 주석으로 남겨 주세요.
7. 없는 파일을 억지로 import하지 마세요.

## 권장 alt 텍스트
```ts
searching: "카공냥이 카공 자리를 찾고 있어요"
sitting: "카공냥이 추천 자리에 앉아 있어요"
thinking: "카공냥이 조건에 맞는 카페를 고민하고 있어요"
warning: "카공냥이 조건을 다시 확인하고 있어요"
night: "카공냥이 야간 카공 자리를 찾고 있어요"
checking: "카공냥이 추천 기준을 확인하고 있어요"
power: "카공냥이 콘센트가 있는 자리를 찾았어요"
wifi: "카공냥이 와이파이 상태를 확인하고 있어요"
map: "카공냥이 지도에서 카페 위치를 살펴보고 있어요"
laptop: "카공냥이 노트북 작업을 하고 있어요"
emptyFavorite: "카공냥이 저장할 카페를 기다리고 있어요"
emptyCourse: "카공냥이 카공 코스를 기다리고 있어요"
emptyResult: "카공냥이 조건에 맞는 카페를 찾지 못했어요"
heroMain: "카공냥이 카공 카페를 추천해드릴 준비를 하고 있어요"
```

## 제한사항
- 없는 파일 import 금지
- dynamic import 사용 금지
- 보류 파일 import 금지
- alt 텍스트를 모두 빈 문자열로 처리 금지

## 변경 예상 파일
- `src/types/mascot.ts`
- `src/assets/mascot/kagong-nyang/mascotAssets.ts`

## 테스트 방법
- TypeScript typecheck
- import 경로 오류 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. MascotState 목록
4. import한 asset 목록
5. TODO 상태
6. 테스트 결과
```

---

# 5. Step 3 — MascotImage 공통 컴포넌트 생성

```md
## 작업 목표
카공냥 이미지를 화면에서 일관되게 렌더링할 수 있는 공통 컴포넌트를 생성해 주세요.

## 요구사항
1. `src/components/MascotImage.tsx`를 생성해 주세요.
2. props는 아래를 지원해 주세요.

```ts
type MascotImageProps = {
  state: MascotState;
  size?: MascotSize;
  className?: string;
  decorative?: boolean;
};
```

3. size별 권장 크기를 적용해 주세요.
   - xs: 32px
   - sm: 56px
   - md: 96px
   - lg: 144px
   - hero: clamp(140px, 34vw, 220px)
4. `decorative=true`이면 `alt=""`, `aria-hidden=true`를 적용해 주세요.
5. `decorative=false`이면 `mascotAltMap[state]`를 사용해 주세요.
6. asset이 없는 state는 안전하게 `null`을 반환해 주세요.
7. layout shift를 줄이기 위해 width/height 또는 CSS size class를 지정해 주세요.
8. CSS는 기존 스타일 시스템을 따르고, 새 UI 라이브러리를 추가하지 마세요.

## 제한사항
- 새 UI 라이브러리 추가 금지
- 버튼 내부에 캐릭터 삽입 금지
- 모든 화면에 무분별하게 삽입 금지
- 이미지가 없을 때 오류 throw 금지

## 변경 예상 파일
- `src/components/MascotImage.tsx`
- 필요 시 `src/styles/globals.css`

## 테스트 방법
- 각 size 렌더링 확인
- decorative alt 처리 확인
- 없는 state fallback 확인
- 모바일 360px 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. props 설명
4. 접근성 처리
5. 테스트 결과
```

---

# 6. Step 4 — EmptyState에 카공냥 적용

```md
## 작업 목표
기존 EmptyState의 일반 아이콘 또는 커피컵 아이콘을 카공냥 이미지로 교체해 서비스 정체성을 강화해 주세요.

## 요구사항
1. `EmptyState` 컴포넌트가 `mascotState?: MascotState` prop을 받을 수 있게 확장해 주세요.
2. `mascotState`가 있으면 기존 icon 대신 `MascotImage`를 표시해 주세요.
3. 페이지별 매핑:
   - 즐겨찾기 없음 → `emptyFavorite`
   - 카공 코스 없음 → `emptyCourse`
   - 추천 결과 없음 → `emptyResult` 또는 `warning`
   - 최근 본 카페 없음 → `emptyFavorite` 또는 `emptyResult`
4. 기존 title, description, action button은 유지해 주세요.
5. 캐릭터 이미지는 중앙 정렬하되 CTA보다 더 강하게 보이지 않게 해 주세요.
6. 권장 크기:
   - 일반 EmptyState: md
   - 추천 결과 없음: lg
7. 이미지가 없으면 기존 icon fallback을 유지해 주세요.

## 제한사항
- 빈 상태 문구 대폭 변경 금지
- CTA 버튼 위치 변경 금지
- EmptyState 레이아웃 대규모 변경 금지
- 없는 asset import 금지

## 변경 예상 파일
- `src/components/EmptyState.tsx`
- `src/pages/FavoritesPage.tsx`
- `src/pages/RecommendationPage.tsx`
- `src/pages/RecentViewsPage.tsx`

## 테스트 방법
- 즐겨찾기 빈 상태 확인
- 코스 빈 상태 확인
- 추천 결과 없음 상태 확인
- 최근 본 카페 없음 상태 확인
- 모바일 레이아웃 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 적용한 EmptyState 목록
4. fallback 방식
5. 테스트 결과
```

---

# 7. Step 5 — LoadingState에 searching 카공냥 적용

```md
## 작업 목표
로딩 상태를 단순 spinner가 아니라 “카공냥이 자리를 찾는 중”이라는 서비스 경험으로 개선해 주세요.

## 요구사항
1. `LoadingState`에 `MascotImage state="searching"`을 적용해 주세요.
2. 문구는 아래 중 하나를 사용해 주세요.
   - `카공냥이 자리를 찾고 있어요`
   - `조건에 맞는 카페를 살펴보는 중이에요`
3. 기존 로딩 애니메이션이 있다면 과하지 않게 유지하거나 제거해 주세요.
4. 이미지 크기는 `md` 또는 `lg`를 사용해 주세요.
5. 로딩 화면의 전체 높이가 과도하게 커지지 않도록 해 주세요.

## 제한사항
- 로딩 시간을 인위적으로 늘리지 말 것
- 복잡한 animation 추가 금지
- 화면 전체를 과하게 차지하지 말 것
- 로딩 로직 변경 금지

## 변경 예상 파일
- `src/components/LoadingState.tsx`

## 테스트 방법
- 추천 로딩 상태 확인
- 데이터 fetch 로딩 상태 확인
- 모바일 레이아웃 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 변경 문구
4. 테스트 결과
```

---

# 8. Step 6 — 추천 결과 섹션에 카공냥 적용

```md
## 작업 목표
추천 결과 화면에서 카공냥을 추천 신뢰도와 추천 종류를 설명하는 보조 UI로 적용해 주세요.

## 요구사항
1. 운영자 추천 섹션 헤더 옆에 `MascotImage state="sitting" size="sm"` 또는 `checking`을 표시해 주세요.
2. 조건 기반 추천 섹션 헤더 옆에는 `MascotImage state="thinking" size="sm"`을 선택적으로 표시해 주세요.
3. 추천 결과 없음은 EmptyState의 `emptyResult` 또는 `warning`으로 처리해 주세요.
4. 개별 CafeCard마다 캐릭터를 반복해서 크게 넣지 마세요.
5. 추천 1순위 카드에만 아주 작게 `seatIcon` 또는 `sitting`을 넣을 수 있지만, 정보 가독성이 떨어지면 생략하세요.
6. 캐릭터는 추천 카드 정보보다 눈에 띄면 안 됩니다.
7. “운영자 추천”은 curated 또는 운영자 큐레이션 섹션에만 연결하세요.

## 제한사항
- 모든 카드에 캐릭터 반복 금지
- 카드 내부 레이아웃 대규모 변경 금지
- 추천 알고리즘 변경 금지
- 광고처럼 보이는 문구 금지
- curated가 아닌 카페를 운영자 추천처럼 보이게 하지 말 것

## 변경 예상 파일
- `src/pages/RecommendationPage.tsx`
- 필요 시 `src/components/RecommendationSection.tsx`
- 필요 시 `src/components/CafeCard.tsx`

## 테스트 방법
- 운영자 추천 섹션 표시 확인
- 조건 기반 추천 섹션 표시 확인
- 추천 결과 없음 표시 확인
- 모바일에서 카드 정보 가독성 확인
- 캐릭터 반복 과다 여부 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 캐릭터 적용 위치
4. 적용하지 않은 위치와 이유
5. 테스트 결과
```

---

# 9. Step 7 — HomePage hero에 카공냥 적용

```md
## 작업 목표
홈 화면의 첫인상을 강화하기 위해 카공냥 hero 이미지를 조심스럽게 적용해 주세요.

## 요구사항
1. hero 영역 하단 또는 오른쪽 하단에 `MascotImage state="heroMain"` 또는 `map` 이미지를 배치해 주세요.
2. 텍스트 가독성을 방해하지 않게 size, opacity, 위치를 조정해 주세요.
3. 모바일 360px에서 hero가 너무 길어지지 않게 하세요.
4. 권장 방식:
   - 이미지 높이 96~140px
   - absolute 배치 또는 hero 하단 보조 일러스트
   - hero 텍스트 오른쪽/하단에 배치
5. 빠른 선택 영역과 겹치지 않게 해 주세요.
6. hero 이미지가 준비되지 않았다면 이 Step은 TODO로 남기고 무리하게 import하지 마세요.

## 제한사항
- hero 텍스트 변경 금지
- CTA 영역 밀림 과다 금지
- 배경이 복잡해지지 않게 할 것
- 이미지가 텍스트보다 더 강하게 보이지 않게 할 것

## 변경 예상 파일
- `src/pages/HomePage.tsx`
- 필요 시 `src/styles/globals.css`

## 테스트 방법
- 360px/390px/480px viewport 확인
- hero 텍스트 가독성 확인
- 빠른 선택 영역 겹침 없음 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. hero 적용 방식
4. 모바일 확인 결과
5. 다음 Step 제안
```

---

# 10. Step 8 — CafeDetailPage 속성 섹션에 feature 카공냥 적용

```md
## 작업 목표
카페 상세 화면에서 콘센트/와이파이/카공 적합도 같은 핵심 속성을 카공냥 이미지로 보조 설명해 주세요.

## 요구사항
1. 콘센트 점수가 높거나 콘센트 태그가 있으면 `MascotImage state="power" size="sm"`을 작은 안내 카드에 표시해 주세요.
2. 와이파이 제보 섹션에는 `MascotImage state="wifi" size="sm"`을 선택적으로 표시해 주세요.
3. 카공 적합도 섹션에는 `MascotImage state="laptop" size="sm"` 또는 `sitting`을 작은 크기로 표시해 주세요.
4. 이미지가 상세 정보보다 우선되지 않도록 섹션 보조 이미지로만 배치해 주세요.
5. 하단 Sticky CTA와 겹치지 않게 해 주세요.
6. 한 상세 화면 안에 캐릭터가 2개를 초과하면 과해 보일 수 있으니 최대 1~2개로 제한해 주세요.

## 제한사항
- 상세 페이지에 이미지를 너무 많이 넣지 말 것
- 점수/태그 로직 변경 금지
- 와이파이 제보 기능 변경 금지
- 네이버 지도 CTA 위치 변경 금지
- Sticky CTA와 겹침 금지

## 변경 예상 파일
- `src/pages/CafeDetailPage.tsx`
- 필요 시 `src/components/AttributeSummary.tsx`
- 필요 시 `src/components/WifiReportSection.tsx`

## 테스트 방법
- 콘센트 좋은 카페에서 power 이미지 표시 확인
- 와이파이 섹션 표시 확인
- 카공 적합도 섹션 가독성 확인
- Sticky CTA 겹침 없음 확인
- 모바일 스크롤 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 상세 화면 적용 위치
4. 조건부 표시 규칙
5. 테스트 결과
```

---

# 11. Step 9 — ThemeCafesPage에 카공냥 적용

```md
## 작업 목표
테마 카공 추천 화면에 카공냥을 큐레이션/야간/팀플 맥락에 맞게 적용해 주세요.

## 요구사항
1. `이번 주 추천` 탭 상단에는 `MascotImage state="checking" size="md"`를 사용해 운영자 큐레이션 느낌을 주세요.
2. `야간 카공` 탭 상단에는 `MascotImage state="night" size="md"`를 사용해 주세요.
3. `팀플 카페` 탭에는 이미지 적용을 생략하거나 `thinking`을 작게만 사용해 주세요.
4. 테마 카드마다 이미지를 반복하지 마세요.
5. 탭 설명 영역에만 1개 이미지 사용을 권장합니다.
6. 탭 전환 시 이미지가 자연스럽게 바뀌도록 조건부 렌더링해 주세요.

## 제한사항
- 탭 구조 변경 금지
- 카드 레이아웃 변경 최소화
- 이미지 반복 금지
- 야간 이미지를 다른 탭에 사용하지 말 것
- 이미지가 리스트보다 더 중요해 보이지 않게 할 것

## 변경 예상 파일
- `src/pages/ThemeCafesPage.tsx`

## 테스트 방법
- 각 탭 상단 이미지 확인
- 탭 전환 시 이미지 변경 확인
- 모바일 레이아웃 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 탭별 이미지 매핑
4. 테스트 결과
```

---

# 12. Step 10 — 적용 후 캐릭터 사용 QA 문서 작성

```md
## 작업 목표
카공냥 asset 적용이 UX를 보조하고 있는지 점검하는 QA 문서를 작성해 주세요.

## 요구사항
- `docs/mascot-ui-qa.md`를 생성해 주세요.
- 아래 항목을 점검해 주세요.
  - 캐릭터가 모든 화면에 과도하게 반복되지 않는가?
  - EmptyState에서 CTA를 방해하지 않는가?
  - LoadingState에서 서비스 정체성을 강화하는가?
  - 추천 결과에서 신뢰도 표현을 돕는가?
  - CafeDetail에서 속성 이해를 돕는가?
  - Home hero에서 텍스트 가독성을 해치지 않는가?
  - ThemeCafesPage에서 탭 맥락에 맞게 보이는가?
  - 이미지 alt가 적절한가?
  - decorative 이미지가 aria-hidden 처리되었는가?
  - 360px 모바일에서 깨지지 않는가?
  - build가 통과했는가?
- 남은 개선 사항을 Must / Should / Later로 분류해 주세요.
- Phase 18 앱인토스 제출 패키지에 반영할 문구를 작성해 주세요.

## 제한사항
- 코드 수정 금지
- 완료되지 않은 항목을 완료로 표시하지 말 것
- 모바일 미확인 항목은 확인 필요로 표시할 것

## 변경 예상 파일
- `docs/mascot-ui-qa.md`

## 출력 형식
1. QA 요약
2. 화면별 적용 상태
3. 접근성 점검
4. 모바일 점검
5. 남은 Must
6. 남은 Should
7. Later
8. Phase 18 반영 문구
```

---

# 13. 최종 화면별 권장 매핑

| 화면 | 적용 이미지 | 상태 | 적용 강도 |
|---|---|---|---|
| HomePage hero | `heroMain` 또는 `map` | hero/map | Should |
| LoadingState | `searching` | searching | Must |
| RecommendationPage 운영자 추천 | `sitting` 또는 `checking` | sitting/checking | Must |
| RecommendationPage 조건 추천 | `thinking` | thinking | Should |
| RecommendationPage 추천 없음 | `emptyResult` 또는 `warning` | warning | Must |
| CafeDetailPage 콘센트 | `power` | power | Should |
| CafeDetailPage 와이파이 | `wifi` | wifi | Should |
| CafeDetailPage 카공 적합도 | `laptop` 또는 `sitting` | laptop/sitting | Should |
| ThemeCafesPage 이번 주 추천 | `checking` | checking | Should |
| ThemeCafesPage 야간 | `night` | night | Should |
| FavoritesPage 빈 상태 | `emptyFavorite` | empty | Must |
| Course 빈 상태 | `emptyCourse` | empty | Must |
| 추천 기준 보기 | `checking` | checking | Later |

---

# 14. 최종 원칙

- 카공냥은 화면의 주인공이 아니라 판단을 도와주는 조용한 큐레이터입니다.
- 캐릭터 이미지는 한 화면에 1개만 사용하는 것을 기본으로 합니다.
- 추천 카드마다 반복하지 않습니다.
- Empty, Loading, 추천 섹션처럼 사용자가 맥락을 잃기 쉬운 곳에 우선 배치합니다.
- 카공냥은 귀여움보다 서비스 이해도를 높이는 방향으로 사용합니다.
- 버튼 내부에는 캐릭터를 넣지 않습니다.
- 이미지가 CTA보다 더 강하게 보이면 안 됩니다.
