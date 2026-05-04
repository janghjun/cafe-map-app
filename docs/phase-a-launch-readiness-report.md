# Phase A 출시 전 준비 상태 리포트

> **작성일**: 2026-05-03  
> **기준**: `launch_readiness_claude_prompts.md` Phase A 항목  
> **빌드**: `tsc -b && vite build` ✅ 통과 (107 modules, 276 kB JS)

---

## 전체 완료율

| 구분 | 완료 | 부분 완료 | 미완료 | 확인 필요 |
|------|------|----------|-------|---------|
| 코드/구현 | 5 | 0 | 0 | 0 |
| 데이터/DB | 0 | 1 | 3 | 0 |
| 제출 필수 | 2 | 1 | 1 | 1 |

---

## 항목별 상태

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 1 | Supabase 프로젝트 생성 | ⬜ 미완료 | 사용자가 직접 생성 필요 — 자동화 불가 |
| 2 | schema 적용 | ⬜ 미완료 | `docs/supabase-schema.sql` 준비 완료, 적용 대기 |
| 3 | 후보 수집 실행 (`collect:candidates`) | ⬜ 미완료 | NAVER API 키 설정 + 사용자 승인 필요 |
| 4 | 후보 검증 실행 (`verify:candidates`) | ⬜ 미완료 | 수집 결과 파일 필요 |
| 5 | pending 후보 Supabase 적재 (`insert:candidates`) | ⬜ 미완료 | Supabase 프로젝트 + 검증 결과 필요 |
| 6 | 운영자 검수 (curated/verified 50개 이상) | ⬜ 미완료 | 적재 후 관리자 화면에서 수동 검수 필요 |
| 7 | `VITE_DATA_SOURCE=supabase` 테스트 | ⬜ 미완료 | Supabase + 실데이터 확보 후 진행 |
| 8 | 개인정보처리방침/서비스 안내 (앱 내) | 🟡 부분 완료 | ServiceInfoPage 내용 보강 완료. 정식 법적 문서 + URL은 앱인토스 심사 전 추가 필요 |
| 9 | 관리자 화면 비밀번호 보호 | ✅ 완료 | `AdminLoginPage` + `sessionStorage` 세션 구현 완료 |
| 10 | `?entry=` 딥링크 | ✅ 완료 | `best` / `suggest` / `theme` / fallback 구현 완료 |
| 11 | Vercel 배포 준비 (체크리스트) | ✅ 완료 | `docs/deploy-checklist.md` 최종 보강 완료 |
| 12 | TypeScript 빌드 통과 | ✅ 완료 | `tsc -b --noEmit` clean pass |
| 13 | `npm run build` 통과 | ✅ 완료 | 276 kB / 107 modules — 프로덕션 빌드 정상 |
| 14 | 앱인토스 실기기 QA | ❓ 확인 필요 | Android WebView 뒤로가기, `?entry=` URL 실기기 동작 미확인 |

---

## Must Fix (Phase A 진입 전 반드시 완료)

| # | 항목 | 블로커 이유 |
|---|------|-----------|
| M-1 | Supabase 프로젝트 생성 + schema 적용 | 실데이터 없이는 추천이 mock으로만 동작 |
| M-2 | 후보 수집 → 검증 → 적재 → 운영자 검수 → verified 50개 이상 | 앱인토스 심사 시 카페가 거의 없으면 서비스 가치 미달 |
| M-3 | Vercel 환경 변수 등록 (`VITE_ADMIN_PASSWORD`, `VITE_SUPABASE_*`) | 배포 후 admin 화면 미동작, 데이터 미연결 |

---

## Should Fix (제출 전 권장)

| # | 항목 |
|---|------|
| S-1 | 개인정보처리방침 정식 URL 등록 및 ServiceInfoPage 링크 추가 |
| S-2 | OG 태그 / PWA manifest 추가 (Step B-1, B-2) |
| S-3 | iOS Safe Area 재점검 (Step B-3) |
| S-4 | React Error Boundary 추가 (Step B-4) |

---

## 데이터 개수 판단

| 기준 | 현재 상태 | 판단 |
|------|----------|------|
| mock 카페 수 | ~10개 내외 (개발용) | 앱인토스 제출 부적합 |
| Supabase verified 카페 수 | 0개 (미적재) | **제출 전 최소 50개 확보 필요** |
| 목표 | 50개 이상 | 인천 주요 구/동 커버리지 확보 기준 |

---

## Phase 18 (앱인토스 제출 패키지) 진입 가능 여부

> **현재: 진입 불가 — 실데이터 미확보**

코드 품질과 기능 구현은 제출 수준에 도달했습니다. 진입 불가의 유일한 이유는 **실데이터 부족**입니다.

아래 순서가 완료되면 즉시 Phase 18로 진입할 수 있습니다.

```
1. Supabase 프로젝트 생성 + schema 적용
2. .env.local 작성 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, VITE_ADMIN_PASSWORD)
3. npm run collect:candidates (또는 --dry-run 먼저 확인)
4. npm run verify:candidates
5. npm run insert:candidates
6. ?mode=admin 관리자 화면에서 pending 후보 검수 → 50개 이상 승인
7. VITE_DATA_SOURCE=supabase 모드 로컬 테스트
8. Vercel 환경 변수 등록 후 프로덕션 배포
```

---

## Phase A 구현 완료 항목 요약

이번 Phase A 세션에서 구현 또는 문서화된 항목:

| 파일 | 변경 내용 |
|------|----------|
| `docs/env.md` | Supabase 연결 7단계 체크리스트 + 데이터 소스 전환 가이드 |
| `docs/supabase-schema.sql` | 8개 컬럼 추가, UNIQUE 인덱스, `wifi_reports` / `cafe_themes` / `cafe_theme_picks` 테이블 |
| `docs/supabase-rls-plan.md` | wifi_reports / cafe_themes / place_verifications RLS 정책 추가 |
| `src/services/cafeMapper.ts` | `CafeRow` 8개 신규 컬럼 매핑 |
| `scripts/insert-candidates.ts` | upsert + 중복 skip 카운터 버그 수정 |
| `tsconfig.scripts.json` | scripts/ 전용 Node.js 타입 tsconfig 신규 추가 |
| `tsconfig.json` | scripts tsconfig 참조 추가 |
| `src/pages/admin/AdminLoginPage.tsx` | 비밀번호 입력 페이지 신규 구현 |
| `src/pages/admin/AdminCandidateListPage.tsx` | `onLogout` 프롭 + 로그아웃 버튼 추가 |
| `src/app/App.tsx` | AdminLoginPage 연동 + `?entry=` 딥링크 + `INITIAL_NAV` |
| `src/styles/admin.css` | 로그인 페이지 + 로그아웃 버튼 스타일 추가 |
| `.env.example` | `VITE_ADMIN_PASSWORD` 추가 |
| `docs/admin-security-note.md` | 프론트엔드 번들 보안 한계 및 Phase B 전환 가이드 |
| `src/pages/ServiceInfoPage.tsx` | 익명 식별자 + 이벤트 로그 안내 섹션 추가 |
| `docs/privacy-policy-draft.md` | 개인정보 처리 방침 초안 신규 작성 |
| `docs/deeplink-entry-plan.md` | 딥링크 entry 목록 + 앱인토스 URL 설정 가이드 |
| `docs/deploy-checklist.md` | VITE_ADMIN_PASSWORD, 딥링크 QA, 관리자 화면 QA 보강 |
