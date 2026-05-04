# 카공 어디가? 인천편 — Launch Readiness Claude Code Prompt Pack

> 기준 시점: Phase 17~17.5 이후, Phase 18 앱인토스 제출 패키지 직전  
> 목적: 지금까지 구현된 MVP+를 실제 서비스화 가능한 상태로 끌어올리기  
> 핵심 판단: 현재 가장 큰 출시 블로커는 UI가 아니라 **실데이터 확보 + Supabase 전환 + 제출 필수 항목 보강**입니다.

---

## 0. 현재 구현 상태 요약

### 완료된 것

- 페이지 10개 이상 구현
  - Home
  - Recommendation
  - CafeDetail
  - DistrictBest
  - Favorites
  - RecentViews
  - SuggestCafe
  - ServiceInfo
  - ThemeCafes
  - AdminCandidateList
- 주요 컴포넌트 구현
  - CafeCard
  - StatusBadge
  - ScoreBar
  - VerificationBadge
  - LoadingState
  - EmptyState
  - MiniMapPreview
- 주요 서비스 구현
  - cafeService
  - favoriteService
  - recentViewService
  - suggestionService
  - wifiReportService
  - courseService
  - logService
  - userIdentityService
  - safeStorage
- 추천 로직 구현
  - 거리
  - 인원
  - 분위기
  - 조건 기반 100점 채점
  - 추천 이유 자동 생성
- 데이터 파이프라인 구현 또는 설계 완료
  - 네이버 API 수집
  - 후보 검증
  - Supabase insert 스크립트
- 개인화/재방문 기능
  - 즐겨찾기
  - 최근 본 카페
  - 카공 코스
  - 빠른 선택 프리셋
- 사용자 제보
  - 카페 제안
  - 와이파이 상태 로컬 제보
- 앱인토스 준비 문서
  - RLS 계획
  - 배포 체크리스트
  - QA 시나리오
  - 익명 식별키 연동 계획

### 출시 블로커

1. 실데이터 부족
2. Supabase 연결 미완성 또는 검증 필요
3. 개인정보처리방침 URL/내용 미완성
4. `?entry=` 딥링크 미구현
5. 관리자 화면 보호 부족
6. 앱인토스 실기기 QA 필요

---

# Phase A. 출시 전 필수 작업

> Phase A는 앱인토스 제출 전에 반드시 끝내야 하는 작업입니다.  
> 목표는 “mock 기반 잘 만든 앱”이 아니라 “실데이터 기반 제출 가능한 MVP+”입니다.

---

## Step A-0. 현재 코드베이스와 실행 가능 스크립트 점검

```md
## 작업 목표
출시 전 필수 작업을 시작하기 전에 현재 코드베이스, package scripts, docs, Supabase 관련 파일, 데이터 수집 스크립트 상태를 점검해 주세요.

## 현재 상태
- Phase 17~17.5까지 진행되었습니다.
- 후보 수집 파이프라인, Supabase 스키마, 관리자 검수, 앱인토스 관련 문서가 존재할 수 있습니다.
- 실제 서비스화 전 필수 점검이 필요합니다.

## 요구사항
- 먼저 코드를 수정하지 말고 아래를 점검해 주세요.
  - package.json scripts
  - 후보 수집 관련 scripts
  - Supabase 관련 docs
  - `.env.example`
  - `docs/supabase-schema.sql`
  - `src/services/cafeService.ts`
  - `src/services/supabaseClient.ts`
  - `src/pages/admin/*`
  - `src/app/App.tsx`
  - `src/pages/ServiceInfoPage.tsx`
- 아래 명령이 있는지 확인해 주세요.
  - `collect:candidates`
  - `verify:candidates`
  - `insert:candidates`
  - `build`
  - `typecheck`
  - `lint`
- 실제 실행은 아직 하지 말고, 실행 가능성만 판단해 주세요.
- 누락된 스크립트/파일/문서를 목록화해 주세요.
- 출시 블로커를 Must Fix / Should Fix / Later로 분류해 주세요.

## 제한사항
- 코드 수정 금지
- 패키지 설치 금지
- API 호출 금지
- Supabase insert 실행 금지
- 추측으로 완료 처리하지 말 것

## 출력 형식
1. 현재 구조 요약
2. 확인한 package scripts
3. Supabase 준비 상태
4. 데이터 수집 파이프라인 준비 상태
5. 앱인토스 제출 필수 항목 상태
6. Must Fix
7. Should Fix
8. Later
9. 다음 Step 제안
```

---

## Step A-1. Supabase 프로젝트 연결 준비 및 환경 변수 확정

```md
## 작업 목표
Supabase 프로젝트와 앱을 연결할 수 있도록 환경 변수, 연결 모드, 실행 문서를 최종 정리해 주세요.

## 현재 상태
- Supabase 스키마 문서가 있습니다.
- Supabase client 또는 연결 헬퍼가 있을 수 있습니다.
- 앱은 mock/localStorage 기반으로 동작했습니다.

## 요구사항
- `.env.example`을 점검하고 아래 변수를 포함해 주세요.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DATA_SOURCE`
  - `NAVER_CLIENT_ID`
  - `NAVER_CLIENT_SECRET`
- 실제 값은 절대 입력하지 마세요.
- `.gitignore`에 `.env`, `.env.local`이 포함되어 있는지 확인해 주세요.
- `docs/env.md` 또는 기존 환경 변수 문서를 보강해 주세요.
- `VITE_DATA_SOURCE=mock | supabase` 동작 방식을 명확히 작성해 주세요.
- 기본값은 mock으로 유지하되, 출시 전 테스트에서는 supabase로 전환한다고 명시해 주세요.
- Supabase 프로젝트 생성 후 사용자가 해야 할 수동 작업을 체크리스트로 작성해 주세요.
  - 프로젝트 생성
  - schema 적용
  - anon key 확인
  - `.env.local` 작성
  - 로컬 실행
  - Vercel 환경 변수 등록

## 제한사항
- 실제 secret 작성 금지
- Supabase 프로젝트를 직접 생성하지 말 것
- DB 마이그레이션 실행 금지
- API 호출 금지

## 변경 예상 파일
- `.env.example`
- `.gitignore`
- `docs/env.md`

## 테스트 방법
- `.env.example`에 placeholder만 있는지 확인
- `.env.local`이 Git에 포함되지 않는지 확인
- 기존 mock 모드 build 영향 없음 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 환경 변수 목록
4. Supabase 연결 수동 체크리스트
5. 보안 주의사항
6. 테스트 결과
7. 다음 Step 제안
```

---

## Step A-2. Supabase 스키마 적용 전 최종 점검

```md
## 작업 목표
Supabase에 적용할 `docs/supabase-schema.sql`을 실제 운영 MVP+ 기준으로 최종 점검하고 보강해 주세요.

## 현재 상태
- cafes, cafe_attributes, cafe_tags, candidates, suggestions, logs 관련 테이블 설계가 있습니다.
- 실데이터 50개+ 확보를 위해 Supabase 적재가 필요합니다.

## 요구사항
- `docs/supabase-schema.sql`을 읽고 아래 테이블이 있는지 확인해 주세요.
  - cafes
  - cafe_attributes
  - cafe_tags
  - raw_cafe_candidates
  - place_verifications
  - user_suggestions
  - wifi_reports
  - favorites
  - recent_views
  - cafe_themes 또는 theme 관련 테이블
- 각 테이블에 필요한 기본 컬럼을 확인해 주세요.
  - id
  - created_at
  - updated_at
  - status 또는 review_status
- cafes 테이블에는 아래 필드가 있는지 확인해 주세요.
  - name
  - district
  - dong
  - address
  - lat
  - lng
  - naver_map_url
  - verification_status
  - last_verified_at
  - status
- 후보 테이블에는 아래 필드가 있는지 확인해 주세요.
  - source_type
  - source_keyword
  - candidate_name
  - candidate_address
  - extracted_attributes
  - existence_status
  - confidence_score
  - review_status
- status/review_status는 check constraint로 제한해 주세요.
- 자주 조회할 컬럼에 index를 추가해 주세요.
  - district
  - dong
  - status
  - cafe_id
  - review_status
  - anonymous_user_id
  - created_at
- RLS는 지금 전면 적용하지 않더라도 `docs/supabase-rls-plan.md`와 연결되도록 TODO 주석을 남겨 주세요.
- 실제 SQL 실행은 하지 마세요.

## 제한사항
- 실제 DB 적용 금지
- RLS를 무조건 전체 허용으로 작성 금지
- 개인정보 컬럼 추가 금지
- 위치 좌표를 사용자 로그에 저장하는 설계 금지
- 외부 리뷰/사진/평점 저장 컬럼 추가 금지

## 변경 예상 파일
- `docs/supabase-schema.sql`
- 필요 시 `docs/supabase-rls-plan.md`

## 테스트 방법
- SQL 문법 육안 검토
- 타입 모델과 매핑 가능 여부 확인
- 상태값 제약 확인
- 인덱스 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 보강한 테이블
4. 추가한 제약 조건
5. 추가한 인덱스
6. RLS TODO 요약
7. 확인 필요 항목
8. 다음 Step 제안
```

---

## Step A-3. 후보 수집 파이프라인 실행 전 Dry Run 점검

```md
## 작업 목표
`npm run collect:candidates`를 실제 실행하기 전에 수집 파이프라인이 정책과 데이터 구조를 지키는지 Dry Run 기준으로 점검해 주세요.

## 현재 상태
- 네이버 API 수집 스크립트가 있습니다.
- 303개 키워드 또는 다수 키워드 기반 후보 수집 구조가 있습니다.
- 기존에 225개 후보가 수집되었을 수 있습니다.

## 요구사항
- 수집 스크립트를 먼저 읽어 주세요.
- 아래 사항을 점검해 주세요.
  - 네이버 공식 API만 사용하는지
  - 비공식 HTML scraping이 없는지
  - API 키가 환경 변수로만 주입되는지
  - 응답 원문 전체를 저장하지 않는지
  - 블로그/카페글 본문 원문을 저장하지 않는지
  - 외부 사진/평점/리뷰를 저장하지 않는지
  - 저장 필드가 후보명/출처/키워드/요약 속성 중심인지
  - rate limit 고려 delay가 있는지
  - dry-run 모드가 있는지
- 문제가 있으면 먼저 수정 제안만 작성해 주세요.
- 사용자가 승인하면 최소 수정해 주세요.
- 실제 API 호출은 사용자 승인 전 하지 마세요.

## 제한사항
- API 호출 금지
- DB insert 금지
- 비공식 크롤링 추가 금지
- 원문 저장 추가 금지
- 자동 승인 금지

## 변경 예상 파일
- 후보 수집 script 파일
- 필요 시 `docs/naver-api-candidate-collector-design.md`

## 테스트 방법
- dry-run 모드 확인
- 환경 변수 없을 때 안전하게 실패하는지 확인
- 저장 가능 필드만 남는지 코드상 확인

## 출력 형식
1. 점검 요약
2. 정책 준수 여부
3. 저장되는 필드
4. 저장하지 않는 필드
5. 발견한 문제
6. 수정 필요 항목
7. 실제 실행 전 체크리스트
8. 다음 Step 제안
```

---

## Step A-4. 후보 수집 실행 및 결과 리포트 작성

```md
## 작업 목표
사용자 승인을 받은 뒤 네이버 공식 API 기반 후보 수집 스크립트를 실행하고, 결과를 리포트로 정리해 주세요.

## 현재 상태
- 후보 수집 Dry Run 점검이 완료되었습니다.
- 환경 변수 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`가 설정되어 있어야 합니다.

## 요구사항
- 사용자가 명시적으로 승인한 경우에만 `npm run collect:candidates`를 실행해 주세요.
- 실행 결과를 파일로 저장하는 구조라면 결과 파일 경로를 확인해 주세요.
- 수집 결과를 요약해 주세요.
  - 전체 키워드 수
  - 요청 성공 수
  - 요청 실패 수
  - 후보 수
  - 중복 제거 전 후보 수
  - 중복 제거 후 후보 수
  - source_type별 후보 수
  - district/dong 추정 가능 후보 수
- 실패한 키워드는 재시도 후보로 분리해 주세요.
- `docs/candidate-collection-report.md`를 생성 또는 보강해 주세요.
- API 응답 원문 전체가 저장되지 않았는지 확인해 주세요.

## 제한사항
- 사용자 승인 없이 API 호출 금지
- DB insert 금지
- 원문 전체 저장 금지
- 리뷰/사진/평점 저장 금지
- 실패를 임의로 성공 처리 금지

## 변경 예상 파일
- 수집 결과 JSON 또는 CSV
- `docs/candidate-collection-report.md`

## 테스트 방법
- 수집 결과 파일 확인
- 원문 전체 저장 여부 확인
- 중복 제거 결과 확인
- 실패 키워드 기록 확인

## 출력 형식
1. 실행 명령
2. 수집 결과 요약
3. source_type별 통계
4. 중복 제거 결과
5. 실패/재시도 항목
6. 저장 파일
7. 정책 준수 확인
8. 다음 Step 제안
```

---

## Step A-5. 후보 검증 실행 및 map_verified 후보 선별

```md
## 작업 목표
수집된 후보를 네이버 지역 검색 또는 준비된 검증 로직으로 검증해 실제 존재 가능성이 높은 카페 후보를 선별해 주세요.

## 현재 상태
- 후보 수집 결과가 있습니다.
- placeMatch 또는 후보 검증 유틸이 있습니다.
- `npm run verify:candidates` 스크립트가 있을 수 있습니다.

## 요구사항
- 검증 스크립트를 먼저 읽고 아래를 확인해 주세요.
  - 네이버 지역 검색 API 사용 여부
  - 후보명 + 지역 키워드 검색 방식
  - name similarity
  - address similarity
  - category match
  - matchScore 계산
  - existence_status 결정 방식
- 사용자가 승인한 경우에만 `npm run verify:candidates`를 실행해 주세요.
- 결과를 아래 상태로 분류해 주세요.
  - map_verified
  - needs_check
  - not_found
  - closed_suspected
  - rejected
- `map_verified`와 `needs_check`를 운영자 검수 후보로 남겨 주세요.
- `not_found`는 삭제하지 말고 상태값으로 보관해 주세요.
- 결과 리포트를 `docs/candidate-verification-report.md`에 작성해 주세요.

## 제한사항
- 사용자 승인 없이 API 호출 금지
- not_found 즉시 삭제 금지
- 자동으로 cafes 테이블에 승인 반영 금지
- 외부 리뷰/사진/평점 저장 금지
- 검증 성공을 “실제 방문 확인”처럼 표현 금지

## 변경 예상 파일
- 검증 결과 JSON 또는 CSV
- `docs/candidate-verification-report.md`

## 테스트 방법
- 상태별 후보 수 확인
- matchScore 분포 확인
- not_found가 삭제되지 않고 보관되는지 확인
- map_verified 후보 샘플 수동 확인

## 출력 형식
1. 실행 명령
2. 상태별 후보 수
3. matchScore 기준
4. map_verified 후보 수
5. needs_check 후보 수
6. not_found 처리 방식
7. 저장 파일
8. 다음 Step 제안
```

---

## Step A-6. Supabase 후보 적재 실행 전 안전 점검

```md
## 작업 목표
검증된 후보를 Supabase에 적재하기 전에 insert 스크립트와 데이터 필드가 안전한지 점검해 주세요.

## 현재 상태
- 후보 검증 결과가 있습니다.
- Supabase 프로젝트가 생성되어 있어야 합니다.
- 스키마가 적용되어 있어야 합니다.
- insert:candidates 스크립트가 있을 수 있습니다.

## 요구사항
- insert 스크립트를 먼저 읽어 주세요.
- 아래를 점검해 주세요.
  - Supabase URL/KEY를 환경 변수에서 읽는지
  - service role key를 프론트엔드에 노출하지 않는지
  - insert 대상이 raw_cafe_candidates 또는 검수 대기 테이블인지
  - review_status가 pending으로 들어가는지
  - 자동으로 cafes에 반영하지 않는지
  - 원문/사진/평점/리뷰가 들어가지 않는지
  - 중복 insert 방지 기준이 있는지
- 문제가 있으면 실제 insert 전 수정 제안을 작성해 주세요.
- 사용자가 승인하면 최소 수정해 주세요.

## 제한사항
- 사용자 승인 전 DB insert 금지
- 자동 승인 금지
- service role key 노출 금지
- 운영 cafes 테이블 직접 insert 금지
- 원문/사진/평점 저장 금지

## 변경 예상 파일
- insert script 파일
- 필요 시 `docs/supabase-insert-plan.md`

## 테스트 방법
- dry-run 모드 확인
- 중복 후보 처리 확인
- review_status=pending 확인
- cafes 직접 반영이 없는지 확인

## 출력 형식
1. 점검 요약
2. insert 대상 테이블
3. 저장 필드
4. 저장 금지 필드
5. 중복 방지 방식
6. 발견한 문제
7. 실제 insert 전 체크리스트
8. 다음 Step 제안
```

---

## Step A-7. Supabase 후보 적재 및 관리자 검수 준비

```md
## 작업 목표
사용자 승인을 받은 뒤 검증된 후보를 Supabase에 pending 상태로 적재하고, 관리자 검수 가능한 상태를 만드세요.

## 현재 상태
- Supabase 프로젝트와 스키마가 준비되어 있습니다.
- 검증 후보 데이터가 있습니다.
- insert 스크립트 안전 점검이 완료되었습니다.

## 요구사항
- 사용자가 명시적으로 승인한 경우에만 `npm run insert:candidates`를 실행해 주세요.
- 적재 결과를 요약해 주세요.
  - insert 성공 수
  - 중복 skip 수
  - 실패 수
  - pending 후보 수
- 관리자 화면에서 후보가 보이는지 확인해 주세요.
- 관리자 화면이 Supabase 후보를 읽지 못하고 localStorage만 보는 구조라면, 아래 중 하나로 처리해 주세요.
  1. 이번 Step에서는 문서에 TODO로 남김
  2. 최소 구현으로 Supabase pending 후보 조회 기능 추가
- 자동 승인하지 마세요.
- `docs/candidate-insert-report.md`를 작성해 주세요.

## 제한사항
- 사용자 승인 없이 DB insert 금지
- 자동 cafes 반영 금지
- 승인되지 않은 후보 추천 노출 금지
- secret 출력 금지

## 변경 예상 파일
- 적재 결과 파일 또는 리포트
- `docs/candidate-insert-report.md`
- 필요 시 관리자 조회 관련 파일

## 테스트 방법
- Supabase raw 후보 테이블 row 수 확인
- review_status=pending 확인
- 관리자 화면에서 pending 후보 확인
- 추천 결과에 pending 후보가 노출되지 않는지 확인

## 출력 형식
1. 실행 명령
2. insert 결과 요약
3. pending 후보 수
4. 관리자 화면 확인 결과
5. 추천 노출 차단 확인
6. 저장 리포트
7. 다음 Step 제안
```

---

## Step A-8. 관리자 화면 비밀번호 보호 최소 구현

```md
## 작업 목표
현재 `?mode=admin`만으로 접근 가능한 관리자 화면에 최소한의 비밀번호 보호를 추가해 주세요.

## 현재 상태
- 관리자 화면은 `?mode=admin`으로 접근할 수 있습니다.
- 인증 없이 누구나 접근 가능한 구조일 수 있습니다.
- Supabase Auth는 아직 도입하지 않습니다.

## 요구사항
- 관리자 화면 진입 시 비밀번호 입력 화면을 먼저 보여주세요.
- 비밀번호는 환경 변수 또는 임시 상수로 관리하되, 프론트엔드 번들 보안 한계를 문서화해 주세요.
- 최소 구현 기준:
  - 사용자가 비밀번호 입력
  - 맞으면 sessionStorage에 admin session 저장
  - 새 탭/브라우저 종료 시 세션 초기화
  - 로그아웃 버튼 제공
- `.env.example`에 `VITE_ADMIN_PASSWORD` placeholder를 추가해 주세요.
- `docs/admin-security-note.md`를 작성해 주세요.
  - 현재 방식은 임시 보호
  - 실제 운영에서는 Supabase Auth 또는 별도 관리자 인증 필요
- 관리자 화면은 일반 사용자 UI에 노출하지 마세요.

## 제한사항
- 완전한 보안이라고 표현 금지
- 비밀번호 하드코딩 금지
- 사용자 계정 시스템 구현 금지
- Supabase Auth 도입 금지
- 관리자 메뉴 공개 노출 금지

## 변경 예상 파일
- `src/pages/admin/AdminLoginPage.tsx`
- `src/pages/admin/AdminCandidateListPage.tsx`
- `src/app/App.tsx`
- `.env.example`
- `docs/admin-security-note.md`

## 테스트 방법
- 비밀번호 미입력 시 관리자 화면 접근 불가 확인
- 비밀번호 입력 후 접근 가능 확인
- sessionStorage 삭제 시 다시 로그인 필요 확인
- 로그아웃 동작 확인
- 일반 사용자 플로우 노출 없음 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 관리자 보호 방식
4. 보안 한계
5. 테스트 결과
6. 다음 Step 제안
```

---

## Step A-9. 개인정보처리방침/서비스 정책 페이지 최종 작성

```md
## 작업 목표
앱인토스 심사와 사용자 신뢰를 위해 개인정보처리방침 및 서비스 데이터 안내 문구를 최종 작성해 주세요.

## 현재 상태
- ServiceInfoPage가 있습니다.
- 개인정보처리방침 URL이 TODO일 수 있습니다.
- 앱은 위치 권한, 익명 ID, 이벤트 로그, localStorage 저장, 카페 제안 기능을 사용합니다.

## 요구사항
- ServiceInfoPage 또는 별도 PolicyPage에 아래 내용을 포함해 주세요.
  - 서비스명
  - 수집/이용 항목
    - 익명 식별자
    - 이벤트 로그
    - 위치 정보
    - 사용자가 제출한 카페 제안 내용
  - 위치 정보 사용 목적
    - 가까운 카공 카페 추천
  - 저장 위치
    - localStorage 저장 항목
    - Supabase 저장 항목
  - 서버로 보내지 않는 항목
    - 위치 좌표를 이벤트 로그에 직접 저장하지 않음
  - 보관 기간
  - 삭제 방법
  - 외부 지도 링크 안내
  - 외부 리뷰/사진/평점 미복제 원칙
  - 운영자 연락처 TODO
- 법률 문서처럼 과하게 단정하지 말고, 앱인토스 제출 전 확인 필요 항목은 TODO로 남겨 주세요.
- 앱 내에서 접근 가능하게 해 주세요.
- 실제 개인정보처리방침 URL이 따로 있다면 링크 연결할 수 있게 구조를 만들어 주세요.
- `docs/privacy-policy-draft.md`도 생성해 주세요.

## 제한사항
- 법률 자문처럼 단정 금지
- 실제 운영자 연락처를 모르면 TODO로 둘 것
- 새로운 개인정보 수집 항목 추가 금지
- 위치 좌표를 장기 저장한다고 쓰지 말 것
- 외부 리뷰/사진/평점 저장한다고 쓰지 말 것

## 변경 예상 파일
- `src/pages/ServiceInfoPage.tsx`
- `docs/privacy-policy-draft.md`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 앱에서 정책 페이지 진입 확인
- 위치/로그/제안/localStorage/Supabase 항목 포함 확인
- TODO 항목 식별 확인
- 해요체와 명확한 안내 문구 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 개인정보 안내 포함 항목
4. TODO/확인 필요 항목
5. 테스트 결과
6. 다음 Step 제안
```

---

## Step A-10. 앱인토스 딥링크 `?entry=` 구현

```md
## 작업 목표
앱인토스 앱 내 기능 등록과 직접 진입을 위해 URL query parameter 기반 딥링크를 구현해 주세요.

## 현재 상태
- React Router를 사용하지 않습니다.
- App.tsx에서 navStack 기반 화면 전환을 사용합니다.
- 배포 체크리스트 D-1에 `?entry=best`, `?entry=suggest` 미구현이 남아 있습니다.

## 요구사항
- App.tsx 마운트 시 `new URLSearchParams(window.location.search)`로 entry 값을 읽어 주세요.
- 아래 entry를 지원해 주세요.
  - `?entry=best` → DistrictBestPage
  - `?entry=suggest` → SuggestCafePage
  - `?entry=theme` → ThemeCafesPage
  - entry 없거나 알 수 없는 값 → HomePage
- navStack 초기값을 entry에 맞게 설정해 주세요.
- 잘못된 entry 값은 무시하고 HomePage로 fallback해 주세요.
- 딥링크 진입 후 뒤로가기 동작이 깨지지 않게 해 주세요.
- `docs/deeplink-entry-plan.md`를 작성해 지원 entry와 테스트 방법을 정리해 주세요.

## 제한사항
- React Router 설치 금지
- 전체 내비게이션 구조 변경 금지
- deep link로 관리자 화면 진입 지원 금지
- 외부 URL redirect 구현 금지

## 변경 예상 파일
- `src/app/App.tsx`
- `src/app/routes.tsx`
- `docs/deeplink-entry-plan.md`

## 테스트 방법
- `/` 진입 → Home 확인
- `/?entry=best` → DistrictBest 진입 확인
- `/?entry=suggest` → SuggestCafe 진입 확인
- `/?entry=theme` → ThemeCafes 진입 확인
- `/?entry=unknown` → Home fallback 확인
- 뒤로가기 동작 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 지원 entry 목록
4. fallback 정책
5. 테스트 결과
6. 다음 Step 제안
```

---

## Step A-11. Supabase 데이터 소스 전환 테스트

```md
## 작업 목표
실제 Supabase 데이터로 앱이 동작하는지 `VITE_DATA_SOURCE=supabase` 모드에서 테스트해 주세요.

## 현재 상태
- Supabase 프로젝트와 스키마가 준비되어 있습니다.
- 후보 데이터가 pending으로 적재되어 있을 수 있습니다.
- 승인된 cafes 데이터가 일부 있어야 합니다.
- cafeService는 mock/supabase 이중 모드를 지원합니다.

## 요구사항
- 사용자가 `.env.local`에 Supabase 정보를 넣었다는 전제에서 진행해 주세요.
- `VITE_DATA_SOURCE=supabase` 모드로 로컬 실행 또는 build를 확인해 주세요.
- 아래 플로우를 테스트해 주세요.
  - Home
  - Recommendation
  - CafeDetail
  - DistrictBest
  - ThemeCafes
  - Favorites
  - RecentViews
  - SuggestCafe
- Supabase fetch 실패 시 mock fallback 또는 EmptyState가 안전하게 동작하는지 확인해 주세요.
- 승인되지 않은 pending 후보가 추천에 노출되지 않는지 확인해 주세요.
- 50개 이상 curated/verified cafe가 확보되지 않았다면 제출 전 데이터 부족으로 표시해 주세요.
- `docs/supabase-mode-test-report.md`를 작성해 주세요.

## 제한사항
- secret 출력 금지
- 승인되지 않은 후보 추천 노출 금지
- fetch 실패를 무시하지 말 것
- 데이터 부족 상태를 성공으로 표시하지 말 것

## 변경 예상 파일
- 필요 시 cafeService 관련 최소 수정
- `docs/supabase-mode-test-report.md`

## 테스트 방법
- `VITE_DATA_SOURCE=supabase npm run build` 또는 해당 환경에 맞는 명령
- 주요 플로우 수동 테스트
- pending 후보 노출 여부 확인
- 데이터 개수 확인

## 출력 형식
1. 테스트 환경
2. 실행 명령
3. Supabase 연결 결과
4. 데이터 개수
5. 주요 플로우 결과
6. pending 후보 노출 여부
7. 발견한 문제
8. 제출 가능 여부 판단
```

---

## Step A-12. Vercel 배포 및 환경 변수 체크리스트 최종화

```md
## 작업 목표
Vercel 배포 전 환경 변수, 빌드, 도메인, 앱인토스 제출용 URL 준비를 최종 점검해 주세요.

## 현재 상태
- 로컬 build가 통과해야 합니다.
- Supabase mode 테스트가 완료되어야 합니다.
- 딥링크 entry가 구현되어야 합니다.

## 요구사항
- `docs/deploy-checklist.md`를 보강해 주세요.
- 아래 항목을 포함해 주세요.
  - Vercel 프로젝트 연결
  - 환경 변수 등록
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_DATA_SOURCE`
    - `VITE_ADMIN_PASSWORD`
  - 빌드 명령
  - 출력 디렉터리
  - 도메인 설정
  - `/`
  - `/?entry=best`
  - `/?entry=suggest`
  - `/?entry=theme`
  - 모바일 viewport 확인
  - 네이버 지도 링크 확인
  - 개인정보처리방침/서비스 안내 진입 확인
- 실제 배포는 사용자 승인 후 진행한다고 명시해 주세요.
- 배포 후 QA 항목을 정리해 주세요.

## 제한사항
- secret 작성 금지
- 실제 배포 실행 금지
- 배포 완료로 단정하지 말 것
- 미구현 entry를 완료로 표시하지 말 것

## 변경 예상 파일
- `docs/deploy-checklist.md`

## 테스트 방법
- 체크리스트 항목 검토
- entry URL 테스트 항목 포함 확인
- 환경 변수 누락 여부 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. Vercel 환경 변수 목록
4. 배포 전 체크리스트
5. 배포 후 QA 항목
6. 다음 Step 제안
```

---

## Step A-13. Phase A 최종 출시 전 점검

```md
## 작업 목표
Phase A 출시 전 필수 작업이 완료되었는지 최종 점검하고, Phase 18 앱인토스 제출 패키지로 넘어가도 되는지 판단해 주세요.

## 현재 상태
- 실데이터 수집/검증/적재가 완료되었거나 진행되었습니다.
- Supabase mode 테스트가 완료되었습니다.
- 개인정보처리방침/딥링크/관리자 보호가 구현되었습니다.

## 요구사항
- 아래 항목을 표로 점검해 주세요.
  - Supabase 프로젝트 생성
  - schema 적용
  - 후보 수집 실행
  - 후보 검증 실행
  - pending 후보 적재
  - 운영자 검수
  - curated/verified 카페 50개 이상 확보
  - VITE_DATA_SOURCE=supabase 테스트
  - 개인정보처리방침/서비스 안내
  - 관리자 비밀번호 보호
  - `?entry=` 딥링크
  - Vercel 배포 준비
  - build 통과
- 각 항목을 `완료 / 부분 완료 / 미완료 / 확인 필요`로 표시해 주세요.
- curated/verified 카페가 50개 미만이면 제출 전 데이터 부족으로 판단해 주세요.
- Must Fix가 남아 있으면 Phase 18로 넘어가지 말라고 명시해 주세요.
- `docs/phase-a-launch-readiness-report.md`를 생성해 주세요.

## 제한사항
- 완료되지 않은 항목을 완료로 표시하지 말 것
- 실데이터 부족을 무시하지 말 것
- 실기기 미확인 항목은 확인 필요로 표시

## 변경 예상 파일
- `docs/phase-a-launch-readiness-report.md`

## 테스트 방법
- 문서와 실제 상태 일치 확인
- Must Fix 여부 확인
- Phase 18 진입 가능 여부 판단

## 출력 형식
1. 전체 완료율
2. 항목별 상태 표
3. Must Fix
4. Should Fix
5. 데이터 개수 판단
6. Phase 18 진입 가능 여부
7. 다음 Claude Code 프롬프트 제안
```

---

# Phase B. 출시 직후 1~2주 개선

> Phase B는 앱인토스 제출 후 또는 제출 직전 시간이 남을 때 진행합니다.  
> 사용자 경험 안정성, 공유 품질, 오류 복구, 영업시간 정확도를 개선합니다.

---

## Step B-1. OG 태그 및 공유 메타데이터 추가

```md
## 작업 목표
링크 공유 시 서비스가 제대로 보이도록 OG 태그와 기본 메타데이터를 추가해 주세요.

## 현재 상태
- index.html에는 title 정도만 있을 수 있습니다.
- 공유 미리보기 이미지가 없을 수 있습니다.

## 요구사항
- `index.html`을 수정해 아래 메타태그를 추가해 주세요.
  - og:title
  - og:description
  - og:image
  - og:type
  - og:url
  - twitter:card
- 서비스 문구:
  - title: `카공 어디가? 인천편`
  - description: `인천에서 공부하기 좋은 카페를 조건에 맞게 추천해드려요.`
- `public/og-image.png`가 없다면 TODO로 남기고 placeholder 경로를 사용하지 마세요.
- 실제 이미지가 없으면 og:image는 주석 또는 문서 TODO로 남겨 주세요.
- `docs/share-metadata-plan.md`를 작성해 필요한 이미지 사이즈와 문구를 정리해 주세요.

## 제한사항
- 존재하지 않는 이미지 경로를 실제 og:image로 넣지 말 것
- 과장 문구 금지
- 미구현 기능 문구 금지

## 변경 예상 파일
- `index.html`
- `docs/share-metadata-plan.md`

## 테스트 방법
- HTML 메타태그 확인
- build 확인
- 공유 미리보기 이미지 TODO 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 추가한 메타태그
4. 이미지 TODO
5. 테스트 결과
```

---

## Step B-2. PWA 기본 설정 추가

```md
## 작업 목표
독립 웹앱 경험 개선을 위해 기본 PWA manifest를 추가해 주세요.

## 현재 상태
- 앱인토스 WebView 중심이지만 웹앱으로도 배포됩니다.
- manifest가 없을 수 있습니다.

## 요구사항
- `public/manifest.json`을 생성해 주세요.
- 기본 항목:
  - name: `카공 어디가? 인천편`
  - short_name: `카공 어디가`
  - start_url: `/`
  - display: `standalone`
  - theme_color: `#6b4f3a`
  - background_color: `#fffaf5`
- 아이콘이 없으면 icons는 TODO 주석 또는 문서로 분리하고 잘못된 경로를 넣지 마세요.
- `index.html`에 manifest link를 추가해 주세요.
- `docs/pwa-plan.md`를 작성해 아이콘 필요 항목을 정리해 주세요.

## 제한사항
- 없는 아이콘 경로를 넣지 말 것
- Service Worker 추가 금지
- 오프라인 기능 구현 금지
- 앱인토스 WebView 필수 기능처럼 표현 금지

## 변경 예상 파일
- `public/manifest.json`
- `index.html`
- `docs/pwa-plan.md`

## 테스트 방법
- manifest JSON 유효성 확인
- build 확인
- 없는 파일 경로 참조 여부 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. manifest 항목
4. 아이콘 TODO
5. 테스트 결과
```

---

## Step B-3. iOS Safe Area CSS 재점검

```md
## 작업 목표
iOS WebView에서 하단 홈 인디케이터와 CTA 버튼이 겹치지 않도록 Safe Area 처리를 재점검하고 보강해 주세요.

## 현재 상태
- 일부 Safe Area 처리가 있을 수 있습니다.
- 하단 CTA가 있는 화면이 여러 개 있습니다.

## 요구사항
- 하단 고정 CTA 또는 주요 버튼 영역을 모두 점검해 주세요.
- `env(safe-area-inset-bottom)`을 사용해 padding-bottom을 보강해 주세요.
- 대상 화면:
  - HomePage
  - RecommendationPage
  - CafeDetailPage
  - SuggestCafePage
  - ThemeCafesPage
- 공통 class로 정리할 수 있으면 `safe-bottom` 같은 유틸 클래스를 추가해 주세요.
- 모바일 360px/390px 기준으로 레이아웃을 확인해 주세요.

## 제한사항
- 디자인 전체 개편 금지
- 새 CSS 프레임워크 추가 금지
- CTA 위치 대규모 변경 금지

## 변경 예상 파일
- `src/styles/globals.css`
- 관련 page/component 파일

## 테스트 방법
- iPhone viewport 확인
- 하단 CTA 겹침 없음 확인
- Android viewport에서 과도한 여백 없음 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. Safe Area 적용 위치
4. 테스트 결과
5. 남은 실기기 확인 항목
```

---

## Step B-4. React Error Boundary 추가

```md
## 작업 목표
예상치 못한 런타임 오류가 발생해도 전체 앱이 흰 화면으로 깨지지 않도록 Error Boundary를 추가해 주세요.

## 현재 상태
- Error Boundary가 없을 수 있습니다.
- Supabase 연결 실패, JSON 파싱 오류, 데이터 형태 변경 시 화면 크래시 가능성이 있습니다.

## 요구사항
- `src/components/ErrorBoundary.tsx`를 생성해 주세요.
- fallback UI 문구:
  - `잠시 문제가 생겼어요.`
  - `새로고침하거나 홈으로 돌아가 다시 시도해 주세요.`
- 재시도 버튼 또는 홈으로 돌아가기 버튼을 제공해 주세요.
- App 최상단을 ErrorBoundary로 감싸 주세요.
- 개발 환경에서는 console.error를 유지해 주세요.
- 사용자에게 stack trace를 노출하지 마세요.

## 제한사항
- 외부 오류 추적 SDK 추가 금지
- 개인정보/secret 출력 금지
- 전체 라우팅 구조 변경 금지

## 변경 예상 파일
- `src/components/ErrorBoundary.tsx`
- `src/app/App.tsx`

## 테스트 방법
- 강제 오류 발생 테스트
- fallback UI 확인
- 홈 이동/재시도 확인
- stack trace 미노출 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. Error Boundary 동작 방식
4. 테스트 결과
5. 다음 Step 제안
```

---

## Step B-5. 요일별 영업시간 모델 개선

```md
## 작업 목표
현재 단일 open/close 기반 영업시간 모델을 요일별 영업시간과 휴무일을 표현할 수 있도록 개선해 주세요.

## 현재 상태
- Cafe에 openHours 또는 openHoursSummary가 있습니다.
- StatusBadge는 단일 open/close 또는 isOpenNow 기반일 수 있습니다.
- 요일별 영업시간, 일요일 휴무, 마감 임박 처리가 부족합니다.

## 요구사항
- Cafe 타입에 요일별 영업시간 모델을 추가하거나 기존 모델을 확장해 주세요.
- 예시:
type DailyOpenHours = {
  open: string;
  close: string;
};

type WeeklyOpenHours = {
  weekday?: DailyOpenHours;
  weekend?: DailyOpenHours;
  days?: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DailyOpenHours>>;
  closedDays?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>;
};

- StatusBadge가 아래 상태를 표시할 수 있게 해 주세요.
  - 지금 영업 중
  - 마감 임박
  - 야간 가능
  - 영업 종료
  - 휴무
  - 영업시간 정보 없음
- 마감 30분 이내면 `마감 임박` 표시를 해 주세요.
- 기존 mock 데이터는 최소한 깨지지 않게 migration/fallback 처리해 주세요.

## 제한사항
- 외부 영업시간 API 호출 금지
- 실시간 정확도 보장 표현 금지
- 대규모 데이터 수정 금지
- 기존 openHoursSummary 삭제 금지

## 변경 예상 파일
- `src/types/cafe.ts`
- `src/components/StatusBadge.tsx`
- `src/utils/openHours.ts`
- `src/data/cafes.mock.ts`

## 테스트 방법
- 평일/주말 영업시간 확인
- closedDays 휴무 확인
- 마감 30분 이내 마감 임박 확인
- 정보 없음 fallback 확인
- build 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 영업시간 모델
4. 상태 표시 규칙
5. 테스트 결과
```

---

# Phase C. 데이터 쌓인 후 1개월 개선

## Step C-1. 추천 알고리즘 실데이터 튜닝 계획

```md
## 작업 목표
50개 이상 실데이터와 사용자 로그가 쌓인 후 추천 알고리즘을 어떻게 튜닝할지 계획 문서를 작성해 주세요.

## 요구사항
- `docs/recommendation-tuning-plan.md`를 작성해 주세요.
- 아래를 포함해 주세요.
  - 현재 점수 가중치
  - 실데이터에서 확인할 문제
  - 0개 결과 발생 조건
  - 결과를 너무 줄이는 필터 탐지 방법
  - needs_recheck 페널티 재조정 방법
  - 사용자 행동 로그 반영 가능성
  - 튜닝 전/후 QA 방법

## 제한사항
- 지금 당장 추천 알고리즘 변경 금지
- AI 추천 구현 금지
- 개인정보 기반 추천 금지

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 튜닝 기준
4. 데이터 필요 조건
5. 다음 Step 제안
```

---

## Step C-2. 와이파이 제보 Supabase 집계 설계

```md
## 작업 목표
현재 localStorage 기반 와이파이 제보를 Supabase 기반 집계 기능으로 전환하기 위한 설계를 작성해 주세요.

## 요구사항
- `docs/wifi-report-supabase-plan.md`를 작성해 주세요.
- 아래를 포함해 주세요.
  - wifi_reports 테이블
  - 최근 30일 집계 방식
  - 카페별 제보 수 표시
  - 악성 제보 방지
  - 익명 ID 기준 제한
  - RLS 정책 방향
  - UI 문구
- 실제 구현은 하지 마세요.

## 제한사항
- 실시간 정확도 보장 금지
- 개인정보 수집 금지
- 즉시 카페 점수 자동 변경 금지

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 집계 방식
4. 리스크와 대응
5. 다음 Step 제안
```

---

## Step C-3. 내가 제안한 카페 현황 기능

```md
## 작업 목표
사용자가 본인이 제안한 카페의 검수 상태를 확인할 수 있는 간단한 기능을 구현해 주세요.

## 현재 상태
- user_suggestions가 localStorage 또는 Supabase에 저장됩니다.
- SuggestCafePage가 있습니다.

## 요구사항
- SuggestCafePage 또는 ServiceInfoPage에 `내 제안 현황` 섹션을 추가해 주세요.
- 상태 표시:
  - 검수 대기
  - 승인됨
  - 반려됨
  - 재확인 필요
- localStorage 기반으로 먼저 구현해 주세요.
- Supabase mode에서는 추후 전환 TODO를 남겨 주세요.

## 제한사항
- 로그인 요구 금지
- 개인정보 표시 금지
- 공개 리뷰/커뮤니티로 확장 금지

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 상태 표시 방식
4. 테스트 결과
5. 다음 Step 제안
```

---

## Step C-4. 테마 추천 Supabase CMS 전환 설계

```md
## 작업 목표
현재 코드 기반 themes.ts를 운영자가 Supabase에서 관리할 수 있도록 CMS 전환 설계를 작성해 주세요.

## 요구사항
- `docs/theme-cms-plan.md`를 작성해 주세요.
- 아래를 포함해 주세요.
  - cafe_themes 테이블
  - theme_cafes join 테이블
  - theme title/description/icon/order/status
  - 운영자 수정 흐름
  - 프론트 fetch 방식
  - fallback 방식
  - RLS 정책 방향

## 제한사항
- 실제 구현 금지
- 인증 없는 공개 수정 금지
- 미검수 카페를 테마에 노출 금지

## 출력 형식
1. 변경 요약
2. 생성 파일
3. CMS 구조
4. 운영 흐름
5. 다음 Step 제안
```

---

# Phase D. 성장 단계

## Step D-1. 지도 SDK 내장 Phase 2 설계

```md
## 작업 목표
현재 MiniMapPreview 이후, Phase 2에서 실제 지도 SDK를 내장할지 검토하는 설계 문서를 작성해 주세요.

## 요구사항
- `docs/map-sdk-phase2-plan.md`를 작성해 주세요.
- 아래 비교를 포함해 주세요.
  - Naver Map
  - Kakao Map
  - Google Maps
  - SDK 비용/정책
  - WebView 호환성
  - 앱인토스 심사 리스크
  - 대체안: MiniMapPreview 유지
- 지금 당장 구현하지 않는 이유를 명시해 주세요.

## 제한사항
- 실제 SDK 설치 금지
- API key 작성 금지
- 지도 타일/이미지 무단 사용 금지

## 출력 형식
1. 변경 요약
2. 생성 파일
3. SDK 비교표
4. 추천 방향
5. 다음 Step 제안
```

---

## Step D-2. 검색 기능 강화 설계

```md
## 작업 목표
카페명/동네/태그 검색을 실데이터 기반으로 고도화하는 설계를 작성해 주세요.

## 요구사항
- `docs/search-upgrade-plan.md`를 작성해 주세요.
- 아래를 포함해 주세요.
  - 현재 검색 구조
  - Supabase full text search 가능성
  - district/dong/tag index 활용
  - 인기 검색어는 보류
  - 검색 로그 개인정보 주의
  - 검색 결과 ranking 기준

## 제한사항
- 즉시 구현 금지
- 개인정보 기반 검색 추천 금지
- 외부 검색 API 실시간 의존 금지

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 검색 고도화 방향
4. 리스크
5. 다음 Step 제안
```

---

## Step D-3. 지역 확장 설계

```md
## 작업 목표
인천편 이후 서울/부산 등 지역 확장을 위한 구조 설계를 작성해 주세요.

## 요구사항
- `docs/region-expansion-plan.md`를 작성해 주세요.
- 아래를 포함해 주세요.
  - 현재 인천 고정 구조
  - region 필드 추가 필요성
  - 지역별 큐레이션 페이지
  - 지역별 데이터 검수 방식
  - 운영 리소스 증가
  - 앱명 확장 전략
    - 카공 어디가? 인천편
    - 카공 어디가? 서울편
- 지금은 인천 집중을 유지한다고 명시해 주세요.

## 제한사항
- 지금 당장 전국화 금지
- 운영자 검수 없는 지역 확장 금지
- 데이터 부족 지역 출시 금지

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 확장 구조
4. 지금 하지 않는 이유
5. 다음 Step 제안
```

---

# 최종 실행 순서 요약

## 출시 전 필수

```text
A-0 현재 구조 점검
→ A-1 Supabase 환경 변수
→ A-2 Supabase schema 최종 점검
→ A-3 수집 파이프라인 Dry Run
→ A-4 후보 수집 실행
→ A-5 후보 검증 실행
→ A-6 Supabase insert 안전 점검
→ A-7 pending 후보 적재
→ 운영자 검수로 curated/verified 50개 이상 확보
→ A-8 관리자 비밀번호 보호
→ A-9 개인정보처리방침/서비스 정책
→ A-10 ?entry= 딥링크
→ A-11 Supabase mode 테스트
→ A-12 Vercel 배포 체크리스트
→ A-13 Phase A 최종 점검
```

## 출시 직후

```text
B-1 OG 태그
→ B-2 PWA manifest
→ B-3 iOS Safe Area
→ B-4 Error Boundary
→ B-5 요일별 영업시간
```

## 데이터 쌓인 후

```text
C-1 추천 알고리즘 튜닝 계획
→ C-2 와이파이 제보 Supabase 집계
→ C-3 내가 제안한 카페 현황
→ C-4 테마 추천 Supabase CMS
```

## 성장 단계

```text
D-1 지도 SDK 내장 검토
→ D-2 검색 강화
→ D-3 지역 확장
```
