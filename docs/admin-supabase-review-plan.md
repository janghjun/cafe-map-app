# 관리자 Supabase 후보 조회 설계

> 작성일: 2026-05-04

---

## 1. 현재 관리자 화면 상태

- `?mode=admin` URL 파라미터로 진입
- localStorage의 `user_suggestions` (사용자 직접 제안)만 표시
- Supabase `raw_cafe_candidates` 테이블 데이터는 표시 안 됨

## 2. 목표 탭 구조

```
[사용자 제안] [수집 후보]
```

| 탭 | 데이터 소스 | 내용 |
|----|------------|------|
| 사용자 제안 | localStorage `user_suggestions` | 앱 내 제안하기 폼에서 수집 |
| 수집 후보 | Supabase `raw_cafe_candidates` | scripts/insert-candidates.ts로 적재된 후보 |

## 3. 수집 후보 탭 표시 필드

| 필드 | 설명 |
|------|------|
| candidate_name | 카페명 |
| candidate_address | 주소 |
| source_keyword | 수집 키워드 |
| confidence_score | 신뢰도 (0~1) |
| existence_status | 존재 확인 상태 |
| review_status | 검수 상태 (pending/approved/rejected) |
| created_at | 수집일 |

## 4. 보안 주의사항

- **현재 구현**: VITE_DATA_SOURCE=supabase 환경에서만 동작, anon key 사용
- **Supabase RLS 미적용 상태**: raw_cafe_candidates는 현재 RLS 없음
  - anon 키로 조회 가능하지만, 프로덕션 전 반드시 RLS 적용 필요
  - RLS 미적용 시 일반 사용자도 접근 가능 — `?mode=admin` 진입 보호 유지
- **service_role key 절대 프론트 노출 금지**
- **승인 시 즉시 cafes 반영 금지**: 별도 Supabase 작업으로 진행해야 함

## 5. 승인 흐름 (현재 미구현 — TODO)

```
관리자 화면에서 "승인" 클릭
→ raw_cafe_candidates.review_status = "approved" 업데이트
→ 별도 운영자 작업: Supabase에서 수동으로 cafes 테이블에 추가
→ 추가 시 verificationStatus = "verified_basic" 또는 "curated" 결정
→ 앱 캐시 갱신 (페이지 새로고침)
```

> 승인 → 즉시 cafes 반영 파이프라인은 Phase B에서 구현합니다.

## 6. VITE_DATA_SOURCE = supabase가 아닌 경우

- 수집 후보 탭을 비활성화하거나 "Supabase 연결 시 사용 가능" 안내 표시
- mock 모드에서는 Supabase 조회를 시도하지 않음
