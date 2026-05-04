# 관리자 검수 기능 설계

> **작성일**: 2026-04-30  
> **현재 상태**: localStorage 기반 사용자 제안 저장 구현 완료  
> **인증**: 초기에는 내부 운영자 전용 개발 도구 수준. 외부 공개 인증 구현은 후순위.

---

## 1. 목적

앱인토스 제출 MVP+ 단계에서 운영자가 아래 데이터를 확인·승인·반려할 수 있는 최소한의 검수 흐름을 제공합니다.

- 사용자가 제출한 카페 제안(`user_suggestions`)
- 자동 수집 파이프라인에서 쌓인 카공 후보(`raw_cafe_candidates`)

최종 목적은 검수 완료된 카페를 `cafes` 테이블(또는 `cafes.mock.ts`)에 안전하게 반영하는 것입니다.  
**자동 승인은 없습니다. 모든 반영은 운영자가 직접 확인 후 실행합니다.**

---

## 2. 검수 대상 데이터

### 2.1 user_suggestions (사용자 카페 제안)

사용자가 `SuggestCafePage`에서 제출한 데이터.

| 필드 | 내용 |
|---|---|
| `id` | 제안 고유 ID |
| `cafeName` | 카페명 |
| `address` | 주소 |
| `reason` | 추천 이유 |
| `tags` | 카공 조건 태그 배열 |
| `status` | `pending` \| `approved` \| `rejected` \| `needs_check` |
| `submittedAt` | 제출 시각 |
| `reviewNote` | 운영자 메모 (선택) |
| `reviewedAt` | 검수 완료 시각 |

### 2.2 raw_cafe_candidates (자동 수집 후보)

자동화 파이프라인(네이버 검색 API 등)에서 수집된 후보.

| 필드 | 내용 |
|---|---|
| `id` | 후보 고유 ID |
| `sourceType` | 수집 출처 |
| `candidateName` | 카페명 후보 |
| `candidateAddress` | 주소 후보 |
| `extractedKeywords` | 추출된 카공 키워드 |
| `confidenceScore` | 신뢰도 점수 (0~1) |
| `status` | 동일 상태값 적용 |

---

## 3. 상태값 정의

| 상태 | 의미 | 다음 액션 |
|---|---|---|
| `pending` | 검수 대기 | 운영자가 승인/반려/보류 선택 |
| `approved` | 승인됨 | cafes 반영 작업 별도 실행 |
| `rejected` | 반려됨 | 반려 사유 기록 후 종결 |
| `needs_check` | 추가 확인 필요 | 운영자가 직접 방문 또는 재검색 후 재판단 |

---

## 4. 승인 기준

아래 조건을 모두 만족해야 `approved`로 변경합니다.

- [ ] 네이버 지도에서 카페명 + 주소가 실존 확인됨
- [ ] 주소가 인천광역시 내에 있음
- [ ] 카공에 관련된 최소 1개 이상의 증거(태그/이유/키워드)가 있음
- [ ] 운영 중인 카페임 (폐업/임시휴업 아님)
- [ ] 기존 `cafes` 테이블에 중복 없음

---

## 5. 반려 기준

아래 중 하나라도 해당하면 `rejected`로 변경합니다.

- 실존하지 않는 카페명 또는 주소
- 인천 외 지역
- 카공 카페로 부적합 (공부 불가 환경)
- 이미 `cafes`에 있는 카페
- 외부 리뷰/사진 첨부 요청 포함 (수집 정책 위반)
- 스팸/허위 제안

---

## 6. 최종 cafes 반영 조건

`approved` 상태라도 아래 절차를 거쳐야 `cafes` 테이블에 반영합니다.

1. 운영자가 네이버 지도에서 위도/경도 확인
2. 영업시간 직접 확인 또는 미기입으로 처리
3. `CafeAttributes` 점수 직접 입력 (0–5)
4. `tags` 선택
5. `status: "pending"` 으로 먼저 삽입 → 검토 후 `status: "active"` 전환

> Supabase 전환 후에는 SQL INSERT 대신 운영자 도구(예: Supabase Studio 또는 내부 admin UI)에서 처리합니다.

---

## 7. 공개 사용자 화면 노출 금지 원칙

- `AdminCandidateListPage`, `AdminCandidateDetailPage` 등 관리자 화면은 일반 `navStack`에 포함하지 않습니다.
- 홈, 추천 결과, 상세, 즐겨찾기, 최근 본 카페 등 사용자 플로우에서 어떤 경로로도 접근할 수 없어야 합니다.
- 초기에는 URL 파라미터(`?mode=admin`)로 접근하는 개발자 전용 진입점만 제공합니다.
- **인증 없는 공개 admin 화면은 만들지 않습니다.**

---

## 8. Supabase 전환 후 권한/RLS 주의사항

| 항목 | 주의사항 |
|---|---|
| `user_suggestions` 읽기 | `FOR SELECT` 정책에 admin role 조건 필수. 일반 anon key로 조회 불가 |
| `raw_cafe_candidates` 전체 | admin role 전용 — RLS 설계 참고: `docs/supabase-rls-plan.md` |
| `cafes` INSERT/UPDATE | service_role key 또는 admin 전용 policy 필요 |
| admin role 부여 방식 | Supabase Auth의 custom claim 또는 service_role key 직접 사용 (운영자 기기 한정) |
| anon key로 admin 접근 | 절대 허용 금지. anon key는 클라이언트 번들에 포함되어 노출됨 |

---

## 9. 다음 Step 제안

| Step | 작업 |
|---|---|
| 15-2 | localStorage 기반 관리자 후보 목록 화면 구현 |
| 15-3 | 승인/반려 localStorage 기능 구현 |
| 15-4 | Supabase 전환 후 admin policy 적용 |
| 15-5 | 내부 운영자 인증 도입 (service_role 또는 Supabase Auth admin claim) |
