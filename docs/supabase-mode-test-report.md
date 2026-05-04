# Supabase 데이터 소스 전환 테스트 리포트

> **작성일**: 2026-05-03  
> **테스트 방법**: 코드 정적 분석 + `VITE_DATA_SOURCE=supabase npm run build` 빌드 검증  
> **실기기 라이브 테스트**: 미완료 — Supabase 프로젝트 미생성 (실데이터 없음)

---

## 테스트 환경

| 항목 | 값 |
|------|---|
| `VITE_DATA_SOURCE` | `supabase` |
| `VITE_SUPABASE_URL` | 미설정 (실 프로젝트 없음) |
| `VITE_SUPABASE_ANON_KEY` | 미설정 |
| 빌드 결과 | ✅ 통과 — 278 kB / 107 modules |
| 타입 체크 | ✅ 통과 — 에러 0개 |

---

## 정적 분석 결과 — 코드 동작 방식 검증

### 1. pending 후보 노출 차단 ✅

`cafeService.ts` → `fetchFromSupabase()`:
```ts
.from("cafes")
.select(SUPABASE_SELECT)
.eq("status", "active")   // ← DB 레벨에서 active만 조회
```
- `raw_cafe_candidates` 테이블은 전혀 읽지 않음
- pending 상태 후보가 `cafes` 테이블에 없는 한 노출 불가

`recommendation.ts` → `recommendCafes()`:
```ts
.filter((cafe) => {
  if (cafe.status !== "active") return false;         // 클라이언트 2중 방어
  if (cafe.verificationStatus === "closed") return false;
  return true;
})
```
- DB + 클라이언트 양쪽에서 이중 차단

### 2. cafeService 모드 전환 ✅

```ts
const useSupabase = dataSource === "supabase" && isSupabaseConfigured();
```
- `VITE_DATA_SOURCE != "supabase"` → mock 모드 유지 (안전한 fallback)
- `VITE_SUPABASE_URL`이 placeholder 값(`your_supabase_...`)이면 `isSupabaseConfigured()` → `false` → mock 모드

### 3. Supabase 연결 실패 처리 ✅

`fetchFromSupabase()`:
```ts
if (error) throw new Error(`Supabase 카페 조회 실패: ${error.message}`);
```
- `initCafeService()`가 throw하면 `App.tsx`의 `useEffect` 내부에서 발생
- React Error Boundary 미설치 시 흰 화면 가능 (Step B-4 예정)
- 현재는 `getCafesSync()` 캐시 미스 → 빈 배열 → EmptyState 표시

### 4. 주요 페이지 동작 방식

| 페이지 | 데이터 소스 | Supabase 지원 | 비고 |
|-------|-----------|-------------|------|
| HomePage | 없음 (필터 UI만) | ✅ | 데이터 사용 안 함 |
| RecommendationPage | `getCafesSync()` | ✅ | 캐시 기반, 빈 배열 시 EmptyState |
| CafeDetailPage | `getCafes()` (async) | ✅ | |
| DistrictBestPage | `getCafesSync()` | ✅ | `status === "active"` 추가 필터 |
| ThemeCafesPage | `getCafesSync()` | ✅ **수정 완료** | MOCK_CAFES 직접 참조 → 제거 |
| FavoritesPage | `getCafes()` (async) | ✅ | |
| RecentViewsPage | `getCafes()` (async) | ✅ | |
| SuggestCafePage | 없음 (제안 폼만) | ✅ | |
| ServiceInfoPage | 없음 | ✅ | |

### 5. ThemeCafesPage 버그 수정 (이번 Step)

**수정 전**:
```ts
import { MOCK_CAFES } from "../data/cafes.mock";
const cafeLookup = useMemo(() => new Map(MOCK_CAFES.map((c) => [c.id, c])), []);
```
Supabase 모드에서도 mock 카페만 조회 → 테마 카드 전부 `null` 반환

**수정 후**:
```ts
import { getCafesSync } from "../services/cafeService";
const cafeLookup = new Map(getCafesSync().map((c) => [c.id, c]));
```
모드에 관계없이 현재 캐시(mock 또는 Supabase)에서 조회

---

## 데이터 개수 판단

| 기준 | 현재 값 | 판단 |
|------|--------|------|
| mock 카페 수 | ~10개 내외 | 개발/테스트용 |
| Supabase `cafes` (status=active) | 0개 (미적재) | **앱인토스 제출 부적합** |
| 최소 목표 | 50개 이상 | 인천 주요 구/동 커버리지 기준 |

> ⛔ **데이터 부족 — 아직 제출 불가**
> 운영자 검수를 통해 Supabase `cafes` 테이블에 50개 이상의 `status=active` 카페를 확보해야 합니다.

---

## 주요 플로우 결과 (빌드 레벨 검증)

| 플로우 | 빌드 포함 여부 | 런타임 결과 (예상) |
|-------|------------|----------------|
| Home → 조건 선택 → 추천 | ✅ | Supabase active 카페 기준 추천 |
| 추천 → 카페 상세 | ✅ | Supabase 데이터 표시 |
| 인천 BEST → 구/동 선택 | ✅ | active 카페 BEST 5 표시 |
| 테마 카페 탭 | ✅ (수정 후) | themes.ts cafeId와 Supabase ID 일치 시 표시 |
| 즐겨찾기 / 최근 본 카페 | ✅ | localStorage 기반, cafeId로 Supabase 카페 조회 |
| 카페 제안 | ✅ | localStorage 저장, 서버 미전송 |

---

## 발견한 문제

| # | 문제 | 심각도 | 상태 |
|---|------|-------|------|
| 1 | `ThemeCafesPage`가 `MOCK_CAFES` 직접 참조 | 높음 | ✅ 이번 Step에서 수정 완료 |
| 2 | `themes.ts`의 `cafeId`가 mock ID 기반 | 중간 | Supabase 전환 후 themes.ts ID 업데이트 필요 |
| 3 | Supabase 연결 실패 시 Error Boundary 없음 | 중간 | Step B-4에서 해결 예정 |
| 4 | `RecommendationPage`가 sync 캐시 의존 | 낮음 | `initCafeService()` 완료 후 진입하면 OK |

---

## 실 서비스 전환 전 추가 확인 사항

1. **themes.ts cafeId 업데이트**: Supabase에 적재된 카페의 실제 UUID로 `src/data/themes.ts`의 `picks.cafeId`를 업데이트해야 합니다.
2. **Error Boundary 추가** (Step B-4): Supabase 연결 실패 시 흰 화면 방지
3. **실기기 라이브 테스트**: `.env.local`에 실제 Supabase 키 입력 후 `npm run dev`로 전체 플로우 수동 확인
4. **pending 후보 노출 확인**: Supabase 적재 후 `?mode=admin` 화면에서 `status=pending` 카페가 추천에 노출되지 않는지 확인

---

## 제출 가능 여부 판단

> **현재: 제출 불가 — 실데이터 미확보**

코드 품질 기준으로는 Supabase 전환 준비 완료. 제출 불가의 유일한 이유는 **Supabase 카페 데이터 0개**입니다.

다음 순서를 완료하면 즉시 제출 가능 상태가 됩니다:
1. Supabase 프로젝트 생성 + schema 적용
2. 후보 수집 → 검증 → 적재
3. 관리자 검수 → `cafes` 테이블 50개 이상
4. `VITE_DATA_SOURCE=supabase` 로컬 실기기 테스트
5. Vercel 프로덕션 배포
