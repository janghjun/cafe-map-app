# 카공 어디가? 인천편 — 앱인토스 심사 리스크 자체 점검 보고서

> **주의:** 이 문서는 정책 확정 보고서가 아니라 제출 전 자체 점검 문서입니다.  
> 앱인토스 정책은 공식 문서를 기준으로 재확인하세요.  
> 작성 기준: Phase 9.5 완료 코드 + `docs/apps-in-toss-checklist.md` 실코드 대조  
> 코드 수정은 이 문서를 참고하여 별도 Step에서 진행하세요.

---

## 요약 테이블

| 구분 | High | Medium | Low | 확인 필요 |
|------|------|--------|-----|-----------|
| 리스크 수 | 2 | 6 | 4 | 5 |

---

## High 리스크 (Phase 10 안에 해결 권장)

### H-1. Safe Area CSS 미적용

**근거**  
`src/styles/globals.css`에 `env(safe-area-inset-*)` CSS가 없음.  
`#root`의 `min-height: 100dvh`와 각 페이지 하단 `padding: 40~48px`이 있으나  
iOS 노치, Dynamic Island, 홈 인디케이터 영역을 명시적으로 회피하지 않음.

**영향**  
iPhone에서 하단 CTA 버튼("카공 카페 추천받기", "네이버 지도에서 보기", "제안 제출하기")이  
홈 인디케이터와 겹치거나 그 뒤로 가려질 수 있음.  
최악의 경우 주요 CTA가 탭 불가능한 상태로 표시됨.

**위치**  
`src/styles/globals.css` — `#root` 하단 패딩 없음  
`src/styles/pages.css` — `.detail-page`, `.home-page`, `.district-page` 등 하단 padding

**수정 방향** (Step 10-4 참고)  
```css
#root {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```
또는 하단 CTA가 있는 페이지에 `padding-bottom: max(48px, env(safe-area-inset-bottom))` 적용.

---

### H-2. Android 하드웨어 뒤로 가기 미처리

**근거**  
앱 내비게이션이 `navStack` 배열(React state)로만 구현되어 있음.  
`src/app/App.tsx`에 `window.addEventListener("popstate", ...)` 없음.  
Android WebView에서 하드웨어 뒤로 가기 버튼이 navStack pop과  
연결되지 않으면, 내비게이션을 한 단계 뒤로 가는 대신 미니앱 자체가 종료될 수 있음.

**영향**  
사용자가 카페 상세 화면에서 하드웨어 뒤로 가기를 탭하면 앱이 닫힘.  
Android 사용자에게 앱이 불안정하게 느껴지거나 사용 중단으로 이어질 수 있음.

**위치**  
`src/app/App.tsx` — `push/pop` 내비게이션 구조

**수정 방향** (Step 10-5 참고)  
```ts
// App.tsx에 추가
useEffect(() => {
  const handlePopState = () => pop();
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);
```
단, 앱인토스 WebView가 `popstate` 이벤트를 발행하는지 먼저 확인 필요.  
발행하지 않는 경우 앱인토스 브리지 API 사용 방법을 별도로 확인해야 함.

---

## Medium 리스크 (Phase 11 또는 배포 직전 해결 권장)

### M-1. `target="_blank"` 외부 링크 WebView 동작 불확실

**근거**  
`src/pages/CafeDetailPage.tsx`의 "네이버 지도에서 보기" 버튼이  
`<a href=... target="_blank" rel="noopener noreferrer">` 형태.  
WebView 환경에서 `target="_blank"` 처리 방식은 브라우저와 다를 수 있음.

**영향**  
네이버 지도 링크가 WebView 내부에서 열려 앱을 벗어나지 못하거나,  
반대로 시스템 브라우저를 열어 앱 컨텍스트를 잃을 수 있음.  
두 경우 모두 예상치 못한 UX가 발생함.

**수정 방향**  
앱인토스 WebView의 외부 링크 처리 정책 확인 후,  
필요 시 `window.open(url)` 또는 앱인토스 브리지 링크 열기 API로 교체.

---

### M-2. Permissions API WebView 지원 불확실

**근거**  
`src/pages/HomePage.tsx`에서 `navigator.permissions.query({ name: "geolocation" })`을  
사용해 권한이 이미 허용된 경우 자동으로 위치를 수집하는 로직이 있음.  
Permissions API는 일부 WebView에서 지원되지 않을 수 있으며,  
현재 `catch(() => {})` 처리로 조용히 무시하여 동작 자체는 안정적이나  
자동 위치 수집이 의도대로 동작하지 않을 수 있음.

**영향**  
위치 권한을 이전에 허용한 사용자도 매번 수동으로 "내 위치 허용하기" 버튼을 눌러야 할 수 있음.  
추천 UX는 여전히 동작하나 자동 수집이 빠져 사용 편의가 줄어듦.

**수정 방향**  
WebView 환경 확인 후 Permissions API 미지원 시 fallback 동작 명시.  
또는 자동 수집 로직 없이 버튼 클릭으로만 위치 수집하도록 단순화 검토.

---

### M-3. `index.html` 메타 오류 — 타이틀·언어 속성 누락

**근거**  
실 코드(`index.html`) 확인 결과 두 가지 오류 발견.

```html
<!-- 현재 -->
<html lang="en">
  <title>cafe_map_app</title>

<!-- 필요 -->
<html lang="ko">
  <title>카공 어디가? 인천편</title>
```

1. `lang="en"` — 한국어 서비스이나 문서 언어가 영어로 선언됨. 스크린 리더, WebView 접근성 엔진, 일부 검색/분류 시스템에 영향.  
2. `<title>cafe_map_app</title>` — 브랜드명 미노출. WebView 작업 전환 화면, 일부 OS 레이어에서 앱명 대신 개발 코드명이 표시됨.

**영향**  
앱인토스 심사 시 스크린샷 또는 자동 크롤링에서 타이틀이 "cafe_map_app"으로 노출될 수 있음.  
브랜드 일관성 감점 요인이 될 수 있음.

**위치**  
`index.html` — 1행 `<html lang>`, 7행 `<title>`

**수정 방향** (Step 10-6 참고, 1분 이내 수정 가능)  
```html
<html lang="ko">
  ...
  <title>카공 어디가? 인천편</title>
```

---

### M-4. 버튼 문구 명사형과 본문 해요체 혼용

**근거**  
본문/안내 문구는 "해요체"로 통일되어 있으나,  
버튼 문구는 "추천받기", "보기", "삭제", "뒤로" 등 명사형/동사원형 혼용.  
예: "카공 카페 추천받기" / "인천 BEST 보기" / "저장하기" (이미 ~하기 형태로 일부 통일)

**영향**  
문구 일관성 측면에서 미미한 수준. 앱인토스 심사에서 명시적 감점 사유로 분류되는지는 불확실.  
"저장하기/저장됨"처럼 일부 버튼은 이미 ~하기 형태로 통일되어 있음.

**수정 방향**  
주요 CTA는 "~하기" 형태로 통일 검토.  
"인천 BEST 보기" → 유지 가능 (탐색 성격 버튼이므로 명사형도 무방).

---

### M-5. 개인정보처리방침 또는 서비스 이용약관 부재

**근거**  
앱 내에 개인정보처리방침 또는 이용약관 링크/화면이 없음.  
현재 저장 항목: `kagong_favorites` / `kagong_recent_views` / `kagong_suggestions` / `kagong_events`  
위치 정보(좌표)는 로컬에서만 사용되고 저장되지 않으나, 이를 명시하는 정책 문서가 없음.

**영향**  
앱인토스/토스가 개인정보처리방침 등록을 요구하는 경우 제출 불가.  
사용자 입장에서 데이터 처리 방식을 확인할 방법이 없음.

**수정 방향**  
최소한의 "데이터 처리 방침" 안내 화면 또는 링크 추가 검토.  
앱인토스 정책에서 별도 약관 등록이 필요한지 확인 필요.

---

### M-6. 주요 내비게이션·보조 버튼 터치 영역 미달

**근거**  
모바일 UX 기준 최소 터치 영역은 44×44px.  
실 CSS 확인 결과 아래 버튼들이 기준 미달.

| 버튼 | CSS 클래스 | 추정 높이 |
|------|-----------|----------|
| 뒤로가기 ("← 뒤로", "← 다시 선택") | `.btn-back` | `padding: 4px 0` + `font-size: 14px` → **약 28px** |
| 텍스트 링크 ("인천 BEST도 보고 싶어요 →" 등) | `.btn-text` | padding 없음 + `font-size: 13px` → **약 18px** |
| 카드 즐겨찾기 아이콘 (★ / ☆) | `.cafe-card__favorite` | `padding: 0 4px` + `font-size: 20px` → **약 24px** |

`btn-primary` / `btn-secondary`는 `padding: 14px`으로 기준 충족.

**영향**  
`.btn-back`은 모든 서브 페이지의 유일한 뒤로가기 수단(H-2와 복합 작용).  
H-2(Android 하드웨어 뒤로가기)가 미처리 상태이므로,  
뒤로가기 버튼의 작은 터치 영역이 사용자를 화면에 가두는 결과를 낼 수 있음.

**위치**  
`src/styles/pages.css` — `.btn-back`, `.btn-text`  
`src/styles/components.css` — `.cafe-card__favorite`

**수정 방향** (Step 10-7 참고)  
```css
.btn-back {
  padding: 12px 0;   /* 4px → 12px */
  min-height: 44px;
}
.btn-text {
  padding: 8px 4px;
  min-height: 44px;
}
.cafe-card__favorite {
  padding: 10px 8px; /* 0 4px → 10px 8px */
  min-height: 44px;
}
```

---

## Low 리스크 (출시 후 또는 Phase 11 개선)

### L-1. 앱인토스 익명 식별키 미연동

**근거**  
`src/types/user.ts`에 `AnonUser` 타입이 정의되어 있으나 실제 연동 없음.  
현재 localStorage 기반 익명 식별이 유일한 사용자 구분 방법.

**영향**  
앱인토스 내 사용자 행동 데이터 연동 불가.  
Phase 11 개인화 추천 구현 시 식별키 연동이 필요해짐.

---

### L-2. 네트워크 오류 처리 미구현

**근거**  
현재 mock 데이터 기반으로 동작하므로 네트워크 오류가 발생하지 않음.  
Supabase 연결 이후에는 API 오류, 타임아웃, 오프라인 상태 처리가 필요해짐.

**영향**  
Supabase 전환 전까지는 실질적 영향 없음.  
전환 시 별도 에러 상태 처리 구현 필요.

---

### L-3. localStorage 데이터 보존 정책 미안내

**근거**  
앱 내 즐겨찾기, 최근 본 카페, 제안 데이터가 localStorage에 저장되나  
사용자에게 이를 안내하는 화면이 없음.  
"최근 본 카페 전체 삭제" 기능은 있으나 즐겨찾기 일괄 삭제는 없음.

**영향**  
저장 기간, 삭제 방법에 대한 안내가 부족.  
앱인토스 심사에서 직접적인 감점 사유는 아닐 가능성이 높으나, 사용자 경험 차원에서 개선 여지가 있음.

---

### L-4. 프로덕션 빌드 및 수동 QA 미완료

**근거**  
`npm run build` 미실행 (TypeScript 타입 체크만 통과).  
실기기(iOS/Android) WebView 수동 QA 미완료.

**영향**  
빌드 타임 오류가 잠재적으로 존재할 수 있음.  
실기기에서만 발생하는 UI 깨짐, 이벤트 처리 문제 미발견 상태.

---

## 확인 필요 항목

| # | 항목 | 확인 방법 |
|---|------|-----------|
| C-1 | 앱인토스 WebView에서 `target="_blank"` 동작 방식 | 앱인토스 개발 문서 또는 실기기 테스트 |
| C-2 | 앱인토스 WebView에서 `popstate` 이벤트 지원 여부 | 앱인토스 브리지 API 문서 확인 |
| C-3 | 앱인토스 미니앱 개인정보처리방침 등록 의무 여부 | 앱인토스 심사 가이드 확인 |
| C-4 | 앱인토스 미니앱 등록 양식 — 스크린샷/소개 문구 요구사항 | 앱인토스 파트너 포털 확인 |
| C-5 | 앱인토스 WebView Safe Area 자동 처리 여부 | 실기기 테스트 또는 앱인토스 렌더링 환경 문서 확인 |

---

## Phase 10 수정 Step 제안

### Step 10-4. Safe Area CSS 적용

```md
## 작업 목표
iPhone 홈 인디케이터/노치 영역과 CTA 버튼 충돌을 방지하기 위해
globals.css 및 주요 페이지 하단 영역에 Safe Area padding을 적용해 주세요.

## 요구사항
- `src/styles/globals.css`의 `#root`에 `padding-bottom: env(safe-area-inset-bottom, 0px)` 적용
- 하단 고정 CTA가 있는 페이지(`.detail-page`, `.suggest-page`)의
  마지막 섹션 또는 하단 패딩에 `max(기존값, env(safe-area-inset-bottom))` 적용
- 상단 노치 대비: `padding-top: env(safe-area-inset-top, 0px)` 검토

## 제한사항
- 기존 레이아웃 padding을 크게 변경하지 말 것
- Safe Area 미지원 환경에서도 기존 padding이 fallback으로 동작하게 유지

## 변경 파일
- `src/styles/globals.css`
- `src/styles/pages.css` (detail-page, suggest-page, home-page)
```

---

### Step 10-5. Android 하드웨어 뒤로 가기 대응

```md
## 작업 목표
Android WebView에서 하드웨어 뒤로 가기 버튼이 앱을 종료하지 않고
navStack을 pop하도록 처리해 주세요.

## 현재 상태
- App.tsx의 navStack은 React state로만 관리됨
- window history와 연동되어 있지 않음

## 요구사항
- navStack push 시 `history.pushState(null, "")` 호출
- `window` 'popstate' 이벤트 리스너에서 `pop()` 호출
- navStack이 홈(길이 1)일 때는 popstate를 무시 (앱 종료는 시스템에 위임)

## 제한사항
- 앱인토스 WebView가 popstate를 지원하지 않는 경우 동작하지 않을 수 있음
- 이 경우 앱인토스 브리지 API 확인 후 별도 처리 필요
- history.back() 직접 호출 금지 (무한 루프 위험)

## 변경 파일
- `src/app/App.tsx`
```

---

### Step 10-6. index.html 메타 수정

```md
## 작업 목표
index.html의 lang 속성과 title을 서비스 정체성에 맞게 수정해 주세요.

## 요구사항
- `<html lang="en">` → `<html lang="ko">`
- `<title>cafe_map_app</title>` → `<title>카공 어디가? 인천편</title>`

## 제한사항
- 다른 부분은 수정하지 말 것

## 변경 파일
- `index.html`
```

---

### Step 10-7. 소형 버튼 터치 영역 확보

```md
## 작업 목표
`.btn-back`, `.btn-text`, `.cafe-card__favorite` 버튼의 터치 영역을
모바일 기준(44px 이상)에 맞게 조정해 주세요.

## 요구사항
- `.btn-back`: `padding: 4px 0` → `padding: 12px 0`, `min-height: 44px`
- `.btn-text`: padding 없음 → `padding: 8px 4px`, `min-height: 44px`
- `.cafe-card__favorite`: `padding: 0 4px` → `padding: 10px 8px`, `min-height: 44px`

## 제한사항
- 버튼 시각적 크기(텍스트 크기, 색상)는 변경하지 말 것
- 레이아웃 전체 흐름이 깨지지 않는지 확인

## 변경 파일
- `src/styles/pages.css` (btn-back, btn-text)
- `src/styles/components.css` (cafe-card__favorite)
```

---

## 부록 — 기존 문서 대비 변경 사항

| 변경 내용 | 이유 |
|-----------|------|
| M-3 (`maximum-scale=1.0`) 항목 제거 | 실 코드(`index.html`) 확인 결과 해당 속성이 존재하지 않음. 잘못된 항목이었음 |
| M-3 신규: index.html 메타 오류 | 실 코드에서 `lang="en"`, `<title>cafe_map_app</title>` 오류 발견 |
| M-6 신규: 터치 영역 미달 | 실 CSS 측정 결과 `.btn-back` ~28px, `.btn-text` ~18px, `.cafe-card__favorite` ~24px 확인 |
| Step 10-6, 10-7 추가 | 신규 발견 항목에 대한 수정 Step |

---

*최종 업데이트: Phase 9.5 완료 코드 실대조 기준 (2026-04-29) / 앱인토스 공식 정책 대조 전 자체 점검용*
