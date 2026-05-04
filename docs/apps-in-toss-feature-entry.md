# 앱인토스 앱 내 기능 등록 설계

> **목적**: 앱인토스 콘솔에서 "앱 내 기능" 등록 시 필요한 기능명·경로 후보 정리  
> **작성 기준**: 2026-04-29 / 현재 navStack 구조 기준  
> **주의**: 앱인토스 콘솔 실제 양식은 파트너 포털에서 확인 필요. 이 문서는 사전 설계안입니다.

---

## 1. 현재 앱 구조 요약

앱은 React Router를 사용하지 않으며, `navStack` 배열로 화면 전환을 관리합니다.  
모든 화면은 단일 URL(`https://cafemapapp.vercel.app/`)에서 서비스됩니다.

```
NavState 목록
├── home             ← 진입점 (카공 찾기)
├── recommendations  ← 추천 결과
├── cafeDetail       ← 카페 상세
├── districtBest     ← 인천 BEST
├── favorites        ← 즐겨찾기
├── recentViews      ← 최근 본 카페
├── suggestCafe      ← 카페 제안하기
└── serviceInfo      ← 서비스 안내
```

딥링크 기능은 현재 미구현입니다. 아래 설계에서 최소 구현 방안을 제시합니다.

---

## 2. 앱 내 기능 후보

### 기능 1 — 카공 찾기 (메인 기능)

| 항목 | 내용 |
|---|---|
| 한국어 기능명 | 카공 찾기 |
| 영문 기능명 후보 | Find Cafe Study Spot |
| 진입 경로 | `https://cafemapapp.vercel.app/` |
| URL 파라미터 | 없음 (앱 기본 진입점) |
| 현재 navStack 대응 | 기본 진입 — 별도 파라미터 없이 홈 화면 표시 |
| 구현 필요 여부 | ❌ 추가 구현 불필요 (현재 동작) |
| 기능 설명 (등록용 예시) | 위치 기반 카공 카페를 조건에 맞게 추천받아요 |

---

### 기능 2 — 인천 BEST

| 항목 | 내용 |
|---|---|
| 한국어 기능명 | 인천 BEST |
| 영문 기능명 후보 | Incheon Best Cafes |
| 진입 경로 | `https://cafemapapp.vercel.app/?entry=best` |
| URL 파라미터 | `entry=best` |
| 현재 navStack 대응 | 앱 마운트 시 `?entry=best` 감지 → `push({ page: "districtBest" })` |
| 구현 필요 여부 | ✅ **최소 구현 필요** (URL 파라미터 파싱, 아래 설계 참고) |
| 기능 설명 (등록용 예시) | 인천 구·동별 카공 카페 BEST를 탐색해요 |

---

### 기능 3 — 카페 제안하기

| 항목 | 내용 |
|---|---|
| 한국어 기능명 | 카페 제안하기 |
| 영문 기능명 후보 | Suggest a Cafe |
| 진입 경로 | `https://cafemapapp.vercel.app/?entry=suggest` |
| URL 파라미터 | `entry=suggest` |
| 현재 navStack 대응 | 앱 마운트 시 `?entry=suggest` 감지 → `push({ page: "suggestCafe" })` |
| 구현 필요 여부 | ✅ **최소 구현 필요** (기능 2와 동일한 파라미터 파싱으로 처리) |
| 기능 설명 (등록용 예시) | 알고 있는 카공 카페를 운영팀에 제안해요 |

---

## 3. 경로(URL 파라미터) 설계

### 설계 원칙
- React Router 미도입 원칙 유지
- 단일 진입 URL에 `?entry=` 쿼리 파라미터를 추가해 화면 분기
- 파라미터 파싱은 `App.tsx` 마운트 시 1회만 실행

### 파라미터 정의표

| `entry` 값 | 이동 화면 | navStack 상태 |
|---|---|---|
| (없음) | 홈 | `[{ page: "home" }]` |
| `best` | 인천 BEST | `[{ page: "home" }, { page: "districtBest" }]` |
| `suggest` | 카페 제안하기 | `[{ page: "home" }, { page: "suggestCafe" }]` |

> 홈을 navStack 기저로 유지해 뒤로가기 시 홈으로 복귀하도록 설계합니다.

### 구현 위치 및 코드 예시

`src/app/App.tsx`의 초기 `useEffect`에 추가 (기존 history/popstate 연동과 분리):

```ts
// 앱인토스 딥링크 진입 처리 — 마운트 시 1회 실행
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const entry = params.get("entry");
  if (entry === "best") push({ page: "districtBest" });
  else if (entry === "suggest") push({ page: "suggestCafe" });
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

> 이 useEffect는 `push` 함수가 안정적(렌더마다 재생성되지 않음)이어야 합니다.  
> 현재 구조에서 `push`는 매 렌더에 재생성되므로, Step 12-5에서 `useCallback`으로 감싸거나  
> 별도 처리 방식을 검토해야 합니다. (TODO)

---

## 4. 앱인토스 콘솔 등록 시 예상 입력값

> 실제 양식 항목명·글자수 제한은 파트너 포털에서 확인 필요

| 콘솔 항목 | 기능 1 (카공 찾기) | 기능 2 (인천 BEST) | 기능 3 (카페 제안) |
|---|---|---|---|
| 기능명 (KO) | 카공 찾기 | 인천 BEST | 카페 제안하기 |
| 기능명 (EN) | Find Cafe Study Spot | Incheon Best Cafes | Suggest a Cafe |
| 진입 URL | `/` | `/?entry=best` | `/?entry=suggest` |
| 설명 | 위치 기반 카공 카페 추천 | 구·동별 BEST 탐색 | 카페 운영팀 제안 |
| 아이콘 필요 여부 | 확인 필요 | 확인 필요 | 확인 필요 |

---

## 5. 확인 필요 항목

| # | 항목 | 확인 방법 |
|---|---|---|
| C-1 | 앱인토스 콘솔에서 "앱 내 기능" 최소 등록 개수 | 파트너 포털 확인 |
| C-2 | 기능명 글자수 제한 (한글/영문) | 파트너 포털 확인 |
| C-3 | 진입 URL이 전체 URL인지 path/query 부분만인지 | 파트너 포털 확인 |
| C-4 | 앱인토스 WebView가 `?entry=best` 형태의 쿼리 파라미터를 그대로 전달하는지 | 실기기 테스트 |
| C-5 | 기능별 아이콘 등록 필요 여부 및 규격 | 파트너 포털 확인 |
| C-6 | `push` 함수 안정성 — 딥링크 진입 시 이중 push 발생 여부 | 구현 후 테스트 |

---

## 6. 다음 Step 제안

| Step | 작업 | 선행 조건 |
|---|---|---|
| Step 12-5 | `?entry=` URL 파라미터 파싱 구현 (`App.tsx` 수정) | 이 문서 확정 |
| Step 12-6 | 앱인토스 파트너 포털에서 C-1~C-5 항목 직접 확인 | 파트너 포털 접근 권한 |
| Step 12-7 | 앱인토스 콘솔 기능 등록 실행 | Step 12-5 + 12-6 완료 |
