# WebView 내비게이션 테스트 체크리스트

> Step 12-1 구현 후 실기기 검증이 필요한 항목  
> 브라우저에서 확인 가능한 항목과 실기기 필수 항목을 분리합니다.

---

## 브라우저에서 확인 가능한 항목

| # | 시나리오 | 기대 동작 | 확인 |
|---|---|---|---|
| B-1 | 홈 → 추천 결과 → "← 뒤로" 클릭 | 홈으로 즉시 이동 | |
| B-2 | 홈 → 추천 결과 → 상세 → "← 뒤로" 두 번 | 추천 결과 → 홈 순서로 이동 | |
| B-3 | 홈 → 인천 BEST → 상세 → 브라우저 뒤로가기 버튼 | 상세 → 인천 BEST 순서로 이동 | |
| B-4 | 홈에서 브라우저 뒤로가기 버튼 | 앱이 깨지지 않음 (홈 유지 또는 이전 탭/페이지로 이동) | |
| B-5 | 홈 → 즐겨찾기 → 카페 상세 → "← 뒤로" 두 번 | 즐겨찾기 → 홈 순서로 이동 | |
| B-6 | 홈 → 카페 제안하기 → "← 뒤로" | 홈으로 이동 | |
| B-7 | UI 뒤로가기를 빠르게 두 번 클릭 | 한 단계만 이동 (이중 pop 없음) | |

---

## 앱인토스 Android WebView 실기기 확인 항목

| # | 확인 항목 | 중요도 | 비고 |
|---|---|---|---|
| A-1 | Android 하드웨어 뒤로가기 버튼이 `popstate` 이벤트를 발생시키는지 | **필수** | 미발생 시 하드웨어 뒤로가기로 앱이 종료됨 |
| A-2 | 화면 이동 중 하드웨어 뒤로가기를 누르면 navStack이 pop되는지 | **필수** | B-1~B-6과 동일한 시나리오 |
| A-3 | 홈에서 하드웨어 뒤로가기를 누르면 앱이 종료되는지 (정상 종료) | **필수** | 무한 루프로 홈에 갇히지 않는지 확인 |
| A-4 | UI 뒤로가기 버튼과 하드웨어 뒤로가기를 교대로 사용했을 때 이중 pop이 없는지 | 권장 | suppressNextPopState 동작 검증 |
| A-5 | 앱인토스 WebView가 별도 브리지 API로 뒤로가기 이벤트를 제공하는지 | 확인 필요 | 제공 시 popstate 대신 브리지 API 사용 |

---

## A-1이 실패하는 경우 (popstate 미발생) 대응 방안

1. **앱인토스 브리지 API 확인**: 앱인토스 개발 문서에서 뒤로가기 이벤트 브리지 API 검색
2. **브리지 API 있는 경우**: `App.tsx`의 `window.addEventListener("popstate", ...)` 부분을 브리지 API 이벤트로 교체
3. **브리지 API 없는 경우**: 현재 구현 유지 (UI 뒤로가기 버튼은 정상 동작하므로 사용자 경험에는 문제 없음)

---

## 구현 방식 요약 (Step 12-1)

```
화면 진입 시: history.replaceState(null, "") — 홈 기준점 확보
push() 호출 시: history.pushState(null, "") + navStack push
UI 뒤로가기 버튼 (pop()) 호출 시:
  1. navStack 즉시 pop (UI 즉각 반응)
  2. suppressNextPopState = true
  3. history.back() 호출 (history 동기화)
  4. 발생하는 popstate는 suppress 처리

Android 하드웨어 뒤로가기 (popstate 발생 시):
  1. suppressNextPopState가 false인지 확인
  2. navStack pop
```

> 파일: `src/app/App.tsx` — `suppressNextPopState` ref + `useEffect` popstate 리스너
