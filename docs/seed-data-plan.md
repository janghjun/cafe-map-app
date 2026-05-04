# Supabase Seed Data 계획

> **작성일**: 2026-04-29  
> **목적**: `src/data/cafes.mock.ts`의 더미 데이터를 Supabase 테이블로 이식하는 절차와 기준 정리

---

## 1. 현재 mock 데이터 현황

| 항목 | 내용 |
|---|---|
| 파일 | `src/data/cafes.mock.ts` |
| 카페 수 | 16개 |
| 커버 구 | 연수구 3, 서구 3, 부평구 2, 남동구 2, 미추홀구 2, 중구 2, 계양구 2 |
| 상태 | 전체 `status: "active"` |
| 특이사항 | 실제 카페명·주소가 아닌 개발용 픽션 데이터 |

---

## 2. 이식 대상 테이블

mock → Supabase 이식 시 아래 3개 테이블에 동시 삽입합니다.

```
MOCK_CAFES[].{기본 필드}   →  cafes
MOCK_CAFES[].attributes    →  cafe_attributes  (cafe_id FK)
MOCK_CAFES[].tags[]        →  cafe_tags        (cafe_id FK, tag당 1행)
```

---

## 3. 필드 매핑표

### cafes 테이블

| TypeScript (Cafe) | SQL (cafes) | 비고 |
|---|---|---|
| `id` | `id` (UUID) | mock의 `"cafe-001"` 형식은 UUID로 재생성 |
| `name` | `name` | |
| `district` | `district` | |
| `dong` | `dong` | |
| `address` | `address` | |
| `lat` | `lat` | |
| `lng` | `lng` | |
| `phone` | `phone` | mock에 없으면 NULL |
| `summary` | `summary` | |
| `openHoursSummary` | `open_hours_summary` | |
| `is24Hours` | `is_24_hours` | |
| `naverMapUrl` | `naver_map_url` | |
| `status` | `status` | |
| `createdAt` | `created_at` | |
| `updatedAt` | `updated_at` | |

### cafe_attributes 테이블

| TypeScript (CafeAttributes) | SQL (cafe_attributes) |
|---|---|
| `quietScore` | `quiet_score` |
| `soloScore` | `solo_score` |
| `groupScore` | `group_score` |
| `outletScore` | `outlet_score` |
| `wifiScore` | `wifi_score` |
| `stayScore` | `stay_score` |
| `coffeeScore` | `coffee_score` |
| `dessertScore` | `dessert_score` |
| `lateOpenScore` | `late_open_score` |
| `spaceScore` | `space_score` |
| `seatScore` | `seat_score` |
| `groupSeatScore` | `group_seat_score` |

### cafe_tags 테이블

`tags: string[]` 배열의 각 원소가 `(cafe_id, tag)` 행 1개에 대응합니다.

---

## 4. seed SQL 생성 방법 (제안)

mock 데이터에서 seed SQL을 자동 생성하는 Node.js 스크립트를 작성하는 방법을 권장합니다.

```
scripts/generate-seed.ts
  → docs/seed.sql  (Supabase SQL Editor에서 실행)
```

### 스크립트 로직 개요

```ts
import { MOCK_CAFES } from "../src/data/cafes.mock";
import { randomUUID } from "crypto";

for (const cafe of MOCK_CAFES) {
  const uuid = randomUUID();
  // INSERT INTO cafes ...
  // INSERT INTO cafe_attributes (cafe_id, ...) VALUES (uuid, ...)
  // for (const tag of cafe.tags) INSERT INTO cafe_tags ...
}
```

> 스크립트는 Step 14(Supabase 실제 연결) 시점에 작성합니다.

---

## 5. seed 실행 절차

1. Supabase 대시보드에서 `supabase-schema.sql` 실행 (테이블 생성)
2. `scripts/generate-seed.ts` 실행 → `docs/seed.sql` 생성
3. `docs/seed.sql` 내용 검수 (카페명, 좌표 등 확인)
4. Supabase SQL Editor에서 `seed.sql` 실행
5. `.env`에서 `VITE_DATA_SOURCE=supabase`로 변경 후 개발 서버 재시작
6. 앱이 Supabase 데이터를 정상적으로 표시하는지 수동 확인

---

## 6. 주의사항

- `docs/seed.sql`은 개발/테스트용이며 Git에 커밋해도 무방합니다 (픽션 데이터).
- 실제 카페 데이터 seed 시에는 `naver_map_url` 유효성 검증 후 삽입하세요.
- `cafe-001` 형식의 mock ID는 Supabase에서 UUID로 재생성해야 합니다.
- RLS 적용 전에 seed를 실행해야 합니다 (INSERT 권한 필요).

---

## 7. 다음 단계 (Step 14)

| Step | 작업 |
|---|---|
| 14-1 | Supabase 프로젝트 생성 및 `supabase-schema.sql` 적용 |
| 14-2 | `scripts/generate-seed.ts` 작성 및 `seed.sql` 생성 |
| 14-3 | `seed.sql` 실행 및 데이터 확인 |
| 14-4 | `.env`에서 `VITE_DATA_SOURCE=supabase` 전환 테스트 |
| 14-5 | `cafeService.ts` 통합 테스트 (mock/supabase 모드 전환 검증) |
