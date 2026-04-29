# 카공 어디가? 인천편 — Phase 12~20 v2 최종 디벨롭 프롬프트 팩

> 기준 시점: Phase 11-5 완료 이후  
> 목적: 현재 완성된 로컬 MVP+를 실제 앱인토스 제출/운영 가능한 MVP+로 끌어올리기  
> 핵심 변경: 기존 Phase 12~20을 그대로 Supabase부터 진행하지 않고, 앱인토스 WebView 실기기 리스크 → 데이터 운영화 → 배포/제출 → 출시 후 개선 순서로 재정렬합니다.

---

## 0. 현재 상태 진단 요약

### 이미 잘 된 점

- React 18 + TypeScript + Vite 기반 구현 완료
- navStack 기반 단순 내비게이션 구조
- mock 데이터 기반 전체 플로우 동작
- 위치 기반 TOP 3~5 추천
- 구/동별 BEST 탐색
- 카페 상세, 저장, 최근 본 카페, 제안하기
- 이벤트 로그 localStorage 구조
- 네이버 지도 링크 보조 기능
- Safe Area, 터치 영역, 텍스트 overflow, localStorage 안정성 개선
- `npm run build` 통과

### 아직 출시 전 반드시 확인해야 할 점

- 앱인토스 WebView에서 `target="_blank"` 동작 방식
- Android 하드웨어 뒤로가기와 `popstate` 연동
- 개인정보처리방침/서비스 안내 필요 여부
- 앱 내 기능 등록용 경로와 이름 설계
- Supabase 전환 시 RLS와 익명 사용자 데이터 저장 정책
- 실 데이터 이관/검수/운영자 승인 흐름
- AIT 번들 업로드와 테스트 스킴 QA
- 출시 후 분석 지표와 운영 루틴

---

# Phase 12. 앱인토스 WebView 실기기 호환성 우선 보강

> 기존 Phase 12가 Supabase 연동부터 시작했다면, v2에서는 앱인토스 WebView에서 실제로 깨질 수 있는 항목을 먼저 해결합니다.

---

## Step 12-1. Android 하드웨어 뒤로가기 대응 설계 및 구현

```md
## 작업 목표
현재 navStack 기반 화면 전환 구조를 유지하면서 앱인토스 WebView/Android 환경에서 뒤로가기 동작이 자연스럽게 동작하도록 보강해 주세요.

## 현재 상태
- React Router를 사용하지 않습니다.
- `src/app/App.tsx`에서 navStack 배열로 화면 이동을 관리합니다.
- `push(state)`와 `pop()`으로 화면을 이동합니다.
- 앱인토스 실기기 테스트 전 확인 필요 항목으로 `popstate` 지원 여부가 남아 있습니다.

## 요구사항
- 현재 `App.tsx`의 navStack 구조를 먼저 읽고 분석해 주세요.
- 브라우저 History API(`history.pushState`, `popstate`)를 navStack과 최소한으로 연동해 주세요.
- 화면 push 시 history state를 쌓고, Android 뒤로가기 또는 브라우저 뒤로가기 시 navStack이 pop되게 해 주세요.
- 홈 화면에서 뒤로가기를 누르면 앱이 비정상 상태가 되지 않게 해 주세요.
- 앱인토스 WebView에서 실제 테스트가 필요하다는 TODO 주석을 남겨 주세요.
- 기능이 복잡해지지 않도록 React Router 도입은 하지 마세요.

## 제한사항
- React Router 설치 금지
- 전체 내비게이션 구조 갈아엎기 금지
- 앱 종료 동작을 임의로 구현하지 말 것
- 실기기 동작을 확인하지 않은 상태에서 완료로 단정하지 말 것

## 변경 예상 파일
- `src/app/App.tsx`
- 필요 시 `src/app/routes.tsx`
- 필요 시 `docs/webview-navigation-test.md`

## 테스트 방법
- 홈 → 추천 결과 → 상세 → 뒤로가기 순서 확인
- 홈 → 인천 BEST → 상세 → 뒤로가기 순서 확인
- 홈에서 뒤로가기 시 앱이 깨지지 않는지 확인
- 브라우저 뒤로가기 버튼 테스트
- 실기기 WebView 테스트는 TODO로 문서화

## 출력 형식
1. 변경 요약
2. 수정 파일
3. history/navStack 연동 방식
4. 테스트 결과
5. 앱인토스 실기기 확인 필요 항목
6. 다음 Step 제안
```

---

## Step 12-2. WebView 외부 링크 동작 안정화

```md
## 작업 목표
네이버 지도 링크가 앱인토스 WebView에서 예측 가능하게 동작하도록 외부 링크 처리 방식을 정리해 주세요.

## 현재 상태
- nmap:// 앱 스킴은 제거되었습니다.
- `naverMapUrl`이 있으면 우선 사용하고, 없으면 네이버 지도 검색 URL을 생성합니다.
- WebView에서 `target="_blank"` 동작 방식은 아직 확인 필요입니다.

## 요구사항
- `src/utils/naverMap.ts`와 `CafeDetailPage`의 링크 처리 방식을 점검해 주세요.
- 링크 클릭 전 버튼 문구가 명확한지 확인해 주세요.
  - 예: `네이버 지도에서 보기`
- `target="_blank"`를 사용하는 경우 `rel="noopener noreferrer"`가 적용되어 있는지 확인해 주세요.
- WebView에서 새 창이 막힐 가능성이 있으면 동일 창 이동 방식과 새 창 방식 중 어느 쪽이 안전한지 문서화해 주세요.
- 링크 클릭 이벤트에는 `cafeId`, `source` 정도만 기록하고 좌표/주소 전체를 로그에 저장하지 않게 해 주세요.
- `docs/webview-external-link-test.md`를 작성해 실기기 테스트 항목을 정리해 주세요.

## 제한사항
- 지도 SDK 추가 금지
- 길찾기 API 추가 금지
- 외부 앱 설치 유도 금지
- 위치 좌표 로그 저장 금지
- 네이버 지도 링크를 핵심 기능처럼 강조하지 말 것

## 변경 예상 파일
- `src/utils/naverMap.ts`
- `src/pages/CafeDetailPage.tsx`
- `src/services/logService.ts`
- `docs/webview-external-link-test.md`

## 테스트 방법
- 한글 카페명/주소 인코딩 확인
- naverMapUrl 우선 사용 확인
- fallback 검색 URL 확인
- 링크 버튼 문구 확인
- direction_click 로그에 민감정보가 없는지 확인
- WebView 실기기 테스트 항목 문서화

## 출력 형식
1. 변경 요약
2. 수정/생성 파일
3. 외부 링크 처리 정책
4. 로그 개인정보 점검 결과
5. 실기기 확인 필요 항목
6. 다음 Step 제안
```

---

## Step 12-3. 개인정보처리방침/서비스 안내 간이 화면 추가

```md
## 작업 목표
앱인토스 제출 및 사용자 신뢰를 위해 개인정보/데이터 사용/외부 링크/제안 검수 정책을 안내하는 간이 화면을 추가해 주세요.

## 현재 상태
- localStorage 기반 즐겨찾기, 최근 본 카페, 제안, 이벤트 로그가 있습니다.
- 위치 권한을 요청합니다.
- 외부 네이버 지도 링크를 제공합니다.
- 개인정보처리방침 등록 의무 여부는 확인 필요 상태입니다.

## 요구사항
- `src/pages/ServiceInfoPage.tsx`를 생성해 주세요.
- 아래 내용을 쉬운 해요체 문구로 안내해 주세요.
  - 위치 정보는 가까운 카페 추천에만 사용
  - 위치 좌표는 이벤트 로그에 저장하지 않음
  - 즐겨찾기/최근 본 카페/제안은 초기에는 기기 저장소(localStorage)에 저장
  - 카페 제안은 검수 후 반영
  - 외부 리뷰/사진/평점을 그대로 복제하지 않음
  - 네이버 지도 링크는 길찾기 보조 기능
- 앱 하단 또는 홈/설정성 영역에서 접근 가능하게 해 주세요.
- 법률 문서처럼 단정하지 말고 “서비스 안내” 성격으로 작성해 주세요.
- 실제 개인정보처리방침 URL이 필요하면 추후 교체 가능하도록 TODO를 남겨 주세요.

## 제한사항
- 법률 자문처럼 단정하지 말 것
- 개인정보 수집 항목을 새로 추가하지 말 것
- 이메일/전화번호 입력 기능 추가 금지
- 약관 동의 강제 팝업 추가 금지

## 변경 예상 파일
- `src/pages/ServiceInfoPage.tsx`
- `src/app/routes.tsx`
- `src/app/App.tsx`
- 필요 시 `src/pages/HomePage.tsx`

## 테스트 방법
- 홈에서 서비스 안내 화면 진입 확인
- 뒤로가기 확인
- 문구가 실제 구현과 일치하는지 확인
- 위치/로그/제안/외부 링크 안내가 포함되어 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 안내 문구 요약
4. 법적/정책적 확인 필요 항목
5. 테스트 방법
6. 다음 Step 제안
```

---

## Step 12-4. 앱 내 기능 등록용 경로/기능명 설계

```md
## 작업 목표
앱인토스 콘솔의 앱 내 기능 등록을 위해 `카공 어디가? 인천편`의 진입 기능명과 경로 설계를 문서화해 주세요.

## 현재 상태
- 앱은 React Router 없이 navStack을 사용합니다.
- 현재 외부 경로 기반 딥링크는 없습니다.
- 앱인토스는 앱 내 기능을 최소 1개 이상 등록해야 할 수 있으며, 기능명과 이동 경로가 필요합니다.

## 요구사항
- `docs/apps-in-toss-feature-entry.md`를 생성해 주세요.
- 앱 내 기능 후보를 3개 제안해 주세요.
  - 예: `카공 찾기`
  - 예: `인천 BEST`
  - 예: `카페 제안`
- 각 기능에 대해 아래를 작성해 주세요.
  - 한국어 기능명 후보
  - 영어 기능명 후보
  - 진입 경로 후보
  - 실제 구현 필요 여부
  - 현재 navStack 구조에서 가능한 대응 방식
- 경로 기반 진입이 필요할 경우 최소한의 query/path 파싱 설계를 제안해 주세요.
- 지금 바로 복잡한 라우팅을 구현하지 말고 문서 설계부터 해 주세요.

## 제한사항
- 코드 수정 금지
- React Router 도입 금지
- 앱인토스 정책을 확정적으로 단정하지 말 것
- 기능명 글자 수/형식은 확인 필요로 남겨도 됨

## 변경 예상 파일
- `docs/apps-in-toss-feature-entry.md`

## 테스트 방법
- 문서가 콘솔 등록 준비에 충분한지 확인
- 현재 navStack 구조와 충돌하지 않는지 확인
- 구현 필요 항목이 명확한지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 앱 내 기능 후보
4. 경로 설계 요약
5. 확인 필요 항목
6. 다음 Step 제안
```

---

# Phase 13. Supabase 데이터 운영화

## Step 13-1. Supabase 환경 변수와 실행 문서 정리

```md
## 작업 목표
Supabase 연결을 위한 환경 변수와 실행 문서를 정리해 주세요.

## 현재 상태
- `docs/supabase-schema.sql` 스키마 초안이 있습니다.
- 앱은 mock/localStorage 기반으로 동작합니다.
- Supabase 연결 전 상태입니다.

## 요구사항
- `.env.example`을 생성 또는 수정해 주세요.
- 아래 환경 변수를 placeholder로 추가해 주세요.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_DATA_SOURCE`
- 실제 키는 절대 넣지 마세요.
- `.env`가 `.gitignore`에 포함되어 있는지 확인해 주세요.
- `docs/env.md`를 생성해 환경 변수 사용법을 정리해 주세요.
- `VITE_DATA_SOURCE=mock | supabase` 구조를 제안해 주세요.
- 기본값은 mock으로 유지한다고 명시해 주세요.

## 제한사항
- 실제 키 하드코딩 금지
- Supabase client 생성은 다음 Step에서 진행
- DB 쿼리 구현 금지
- 인증 구현 금지

## 변경 예상 파일
- `.env.example`
- `.gitignore`
- `docs/env.md`

## 테스트 방법
- `.env.example`에 placeholder만 있는지 확인
- `.env` gitignore 확인
- 기존 앱 실행에 영향이 없는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 환경 변수 설명
4. 보안 주의사항
5. 테스트 방법
6. 다음 Step 제안
```

---

## Step 13-2. Supabase Client와 연결 상태 헬퍼 생성

```md
## 작업 목표
Supabase client를 생성하고, 환경 변수가 없거나 연결 실패해도 앱이 깨지지 않게 준비해 주세요.

## 현재 상태
- 환경 변수 구조가 준비되어 있습니다.
- 아직 Supabase client는 없습니다.

## 요구사항
- `@supabase/supabase-js` 설치 여부를 확인해 주세요.
- 설치가 필요하면 명령을 제안하고 승인 후 진행해 주세요.
- `src/services/supabaseClient.ts`를 생성해 주세요.
- 아래 헬퍼를 제공해 주세요.
  - `isSupabaseConfigured()`
  - `getSupabaseClient()`
- 환경 변수가 없으면 null 또는 안전한 fallback을 반환하게 해 주세요.
- 앱이 crash하지 않도록 해 주세요.
- 실제 데이터 fetch는 아직 하지 마세요.

## 제한사항
- 실제 키 하드코딩 금지
- DB 쿼리 구현 금지
- 인증 구현 금지
- RLS 우회 금지

## 변경 예상 파일
- `package.json`
- lock file
- `src/services/supabaseClient.ts`

## 테스트 방법
- 환경 변수 없는 상태에서 앱이 build 되는지 확인
- 환경 변수 있는 상태에서 client 생성 경로 확인
- TypeScript 타입 체크

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 설치 패키지
4. client 생성 방식
5. fallback 방식
6. 테스트 방법
```

---

## Step 13-3. Supabase 스키마 v2 보강 및 RLS TODO 정리

```md
## 작업 목표
현재 `docs/supabase-schema.sql`을 실제 운영 전환에 더 적합하게 보강해 주세요.

## 현재 상태
- Supabase 스키마 초안이 있습니다.
- favorites, recent_views, filter_logs, user_suggestions, raw_cafe_candidates 등이 정의되어 있을 수 있습니다.

## 요구사항
- 기존 SQL을 읽고 보강안을 작성해 주세요.
- 테이블별 status/check constraint를 정리해 주세요.
- 자주 조회할 컬럼에 index를 제안해 주세요.
  - district
  - dong
  - status
  - cafe_id
  - anonymous_user_id
  - created_at
- RLS는 바로 완성하지 않아도 되지만, 테이블별 정책 방향을 주석으로 작성해 주세요.
- public read가 가능한 테이블과 사용자별 write가 필요한 테이블을 분리해 주세요.
- `docs/supabase-rls-plan.md`도 함께 생성해 주세요.

## 제한사항
- 실제 DB 마이그레이션 실행 금지
- RLS를 대충 허용 정책으로 작성하지 말 것
- 개인정보 컬럼 추가 금지
- 위치 좌표를 사용자 로그에 저장하지 말 것

## 변경 예상 파일
- `docs/supabase-schema.sql`
- `docs/supabase-rls-plan.md`

## 테스트 방법
- SQL 문법 육안 검토
- TypeScript 타입과 매핑 가능성 확인
- public/user/admin 테이블 구분 확인
- RLS TODO가 테이블별로 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 테이블 보강 내용
4. RLS 정책 방향
5. 확인 필요 항목
6. 다음 Step 제안
```

---

## Step 13-4. CafeService mock/supabase 이중 모드 구현

```md
## 작업 목표
현재 mock 기반 cafeService를 Supabase 데이터 소스로 전환 가능한 구조로 개선해 주세요.

## 현재 상태
- `src/services/cafeService.ts`가 mock 데이터를 사용합니다.
- Supabase client가 준비되어 있습니다.
- 기본 앱은 mock 모드로 동작해야 합니다.

## 요구사항
- `VITE_DATA_SOURCE`에 따라 mock/supabase 모드를 선택하게 해 주세요.
- 기본값은 mock입니다.
- Supabase mode에서는 아래 데이터를 조합해 Cafe 타입으로 매핑하는 구조를 작성해 주세요.
  - cafes
  - cafe_attributes
  - cafe_tags
- `src/services/cafeMapper.ts`를 만들어 DB row → Cafe 변환을 분리해도 됩니다.
- fetch 실패 시 mock 데이터 fallback을 제공해 주세요.
- 기존 UI가 깨지지 않게 `getCafes`, `getCafeById`, `getCafesByDistrict` 인터페이스를 유지해 주세요.

## 제한사항
- 기본 모드를 Supabase로 강제하지 말 것
- 인증 구현 금지
- RLS 우회 금지
- 복잡한 캐싱 라이브러리 추가 금지
- UI 수정 최소화

## 변경 예상 파일
- `src/services/cafeService.ts`
- `src/services/cafeMapper.ts`
- 필요 시 `src/types/cafe.ts`

## 테스트 방법
- mock mode에서 기존 플로우 정상 확인
- Supabase mode 환경 변수 설정 시 fetch 코드 경로 확인
- fetch 실패 시 mock fallback 확인
- TypeScript 타입 체크
- npm run build

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. mock/supabase 모드 설명
4. fallback 정책
5. 테스트 결과
6. 다음 Step 제안
```

---

## Step 13-5. Seed 데이터 이관 문서/스크립트 설계

```md
## 작업 목표
현재 `cafes.mock.ts`의 개발용 데이터를 Supabase seed 데이터로 이관하기 위한 문서와 스크립트 설계를 작성해 주세요.

## 현재 상태
- mock 데이터 16개가 있습니다.
- Supabase 스키마가 있습니다.
- 실제 운영 데이터는 아직 아닙니다.

## 요구사항
- `docs/seed-data-plan.md`를 생성해 주세요.
- mock 데이터 → Supabase 테이블로 나누는 매핑을 작성해 주세요.
  - cafes
  - cafe_attributes
  - cafe_tags
- 실제 카페 검증 전에는 seed 데이터를 운영 데이터로 단정하지 않는다는 주석을 남겨 주세요.
- 가능하다면 `scripts/generate-seed-sql.ts` 설계를 제안해 주세요.
- 이 Step에서는 실제 스크립트 구현은 하지 말고 설계만 해 주세요.

## 제한사항
- 실제 DB insert 실행 금지
- 검증되지 않은 데이터를 운영 데이터라고 표현 금지
- 외부 리뷰/평점/사진 추가 금지

## 변경 예상 파일
- `docs/seed-data-plan.md`

## 테스트 방법
- mock 필드와 DB 필드 매핑이 명확한지 확인
- 검증 필요 문구가 포함되어 있는지 확인
- 실제 실행 없이 문서만 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. seed 매핑 요약
4. 검증 필요 항목
5. 다음 Step 제안
```

---

# Phase 14. 익명 사용자·저장 데이터 동기화

## Step 14-1. 익명 사용자 식별 서비스 도입

```md
## 작업 목표
앱인토스 익명 식별키 연동 전에도 사용할 수 있는 로컬 익명 사용자 식별 서비스를 구현해 주세요.

## 현재 상태
- `types/user.ts`에 AnonUser 타입이 있으나 현재 미사용입니다.
- 즐겨찾기/최근 본 카페/이벤트 로그는 localStorage 기반입니다.

## 요구사항
- `src/services/userIdentityService.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `getAnonymousUserId()`
  - `getLocalAnonymousUserId()`
  - `setLocalAnonymousUserId(id)`
  - `clearLocalAnonymousUserId()`
- 앱인토스 `getAnonymousKey`로 교체 가능한 TODO를 남겨 주세요.
- ID는 UUID 또는 안전한 랜덤 문자열로 생성해 주세요.
- 개인정보는 저장하지 마세요.
- 기존 저장 데이터와 충돌하지 않게 설계해 주세요.

## 제한사항
- 실제 앱인토스 SDK 호출 금지
- 이메일/이름/전화번호 저장 금지
- 서버 전송 금지
- 로그인 구현 금지

## 변경 예상 파일
- `src/services/userIdentityService.ts`
- 필요 시 `src/types/user.ts`

## 테스트 방법
- 최초 호출 시 ID 생성 확인
- 재호출 시 동일 ID 반환 확인
- 삭제 후 새 ID 생성 확인
- localStorage에 개인정보가 없는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 식별자 생성 방식
4. 앱인토스 연동 TODO
5. 개인정보 보호 점검
6. 테스트 방법
```

---

## Step 14-2. 즐겨찾기/최근 본 카페/로그에 익명 ID 연결

```md
## 작업 목표
익명 사용자 ID를 즐겨찾기, 최근 본 카페, 이벤트 로그 저장 구조와 연결해 주세요.

## 현재 상태
- userIdentityService가 있습니다.
- favoriteService, recentViewService, logService가 있습니다.
- localStorage 안전 접근은 safeStorage를 사용합니다.

## 요구사항
- localStorage key를 사용자별로 분리할 수 있게 개선해 주세요.
- 기존 데이터가 있으면 현재 익명 ID 영역으로 migration하거나 fallback 처리해 주세요.
- 이벤트 로그에는 좌표/개인정보를 저장하지 말고, 내부 userId도 필요 최소한으로만 사용해 주세요.
- `anonymousUserId`가 UI에 노출되지 않게 해 주세요.
- 기존 기능 동작을 유지해 주세요.

## 제한사항
- 기존 localStorage 데이터 강제 삭제 금지
- 개인정보 추가 금지
- 위치 좌표 로그 저장 금지
- Supabase 동기화 구현은 다음 단계로 미룸

## 변경 예상 파일
- `src/services/favoriteService.ts`
- `src/services/recentViewService.ts`
- `src/services/logService.ts`
- 필요 시 `src/utils/safeStorage.ts`

## 테스트 방법
- 기존 즐겨찾기 유지 또는 migration 확인
- 새 즐겨찾기 저장/삭제 확인
- 최근 본 카페 기록 확인
- 로그에 민감정보 없는지 확인
- 새로고침 후 유지 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. migration/fallback 방식
4. 개인정보 점검 결과
5. 테스트 방법
6. 다음 Step 제안
```

---

## Step 14-3. 앱인토스 getAnonymousKey 연동 계획 문서 작성

```md
## 작업 목표
앱인토스 익명 식별키를 실제 연동하기 전에 현재 로컬 익명 ID 구조와 어떻게 교체할지 문서화해 주세요.

## 현재 상태
- 로컬 익명 사용자 식별 서비스가 있습니다.
- 실제 앱인토스 SDK 연동은 아직 없습니다.

## 요구사항
- `docs/apps-in-toss-anonymous-key-plan.md`를 생성해 주세요.
- 아래 내용을 포함해 주세요.
  - 현재 local anonymous ID 구조
  - 앱인토스 getAnonymousKey 연동 예상 위치
  - 실패 시 local ID fallback 정책
  - 기존 localStorage 데이터 migration 정책
  - 개인정보를 저장하지 않는 원칙
  - 테스트 항목
- 실제 SDK 호출 코드는 작성하지 마세요.

## 제한사항
- 실제 getAnonymousKey 호출 금지
- SDK 설치 금지
- 구현 완료처럼 표현 금지
- 개인정보 저장 제안 금지

## 변경 예상 파일
- `docs/apps-in-toss-anonymous-key-plan.md`

## 테스트 방법
- 현재 코드 구조와 연동 계획이 맞는지 확인
- fallback 정책이 명확한지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 연동 계획 요약
4. 확인 필요 항목
5. 다음 Step 제안
```

---

# Phase 15. 데이터 운영·관리자 검수

## Step 15-1. 관리자 검수 기능 범위 재설계

```md
## 작업 목표
사용자 제안과 자동 후보 수집 데이터를 운영자가 검수할 수 있는 MVP 수준의 관리자 기능 범위를 재설계해 주세요.

## 현재 상태
- SuggestCafePage에서 제안 데이터가 localStorage에 저장됩니다.
- 후보 수집 계획 문서가 있습니다.
- Supabase raw 후보 테이블 설계가 있습니다.

## 요구사항
- 코드 수정 없이 `docs/admin-review-plan.md`를 작성해 주세요.
- 아래 내용을 포함해 주세요.
  - 관리자 기능 목적
  - 검수 대상 데이터
    - user_suggestions
    - raw_cafe_candidates
  - 상태값
    - pending
    - approved
    - rejected
    - needs_check
  - 승인 기준
  - 반려 기준
  - 최종 cafes 반영 조건
  - 공개 사용자 화면 노출 금지 원칙
  - Supabase 전환 후 권한/RLS 주의사항
- 초기에는 내부 운영용이며 인증은 후순위라고 명시해 주세요.

## 제한사항
- 실제 관리자 화면 구현 금지
- 인증 없는 공개 admin 화면 구현 제안 금지
- 자동 승인 금지
- 외부 원문/사진 저장 제안 금지

## 변경 예상 파일
- `docs/admin-review-plan.md`

## 테스트 방법
- 제안/후보 데이터 흐름과 맞는지 확인
- 승인/반려 기준이 명확한지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 관리자 검수 흐름
4. 보안/권한 주의사항
5. 다음 Step 제안
```

---

## Step 15-2. 로컬 관리자 후보 목록 화면 구현

```md
## 작업 목표
개발/운영자가 localStorage에 저장된 카페 제안을 확인할 수 있는 내부용 관리자 후보 목록 화면을 구현해 주세요.

## 현재 상태
- admin-review-plan 문서가 있습니다.
- suggestionService가 있습니다.
- 실제 인증은 없습니다.

## 요구사항
- `src/pages/admin/AdminCandidateListPage.tsx`를 생성해 주세요.
- 이 화면은 일반 사용자 내비게이션에 노출하지 마세요.
- 상태별 필터를 제공해 주세요.
  - pending
  - approved
  - rejected
- 목록에는 아래 정보를 표시해 주세요.
  - 카페명
  - 주소
  - 추천 이유
  - 추천 태그
  - 제출일
  - 상태
- 접근 방법은 임시 개발용으로만 문서화해 주세요.
- 향후 Supabase/admin auth 필요 TODO를 남겨 주세요.

## 제한사항
- 공개 메뉴에 노출 금지
- 실제 인증 구현 금지
- Supabase 연결 금지
- 승인/반려는 다음 Step에서 구현
- 사용자 개인정보 표시 금지

## 변경 예상 파일
- `src/pages/admin/AdminCandidateListPage.tsx`
- 필요 시 `src/app/routes.tsx`
- 필요 시 `src/app/App.tsx`

## 테스트 방법
- 제안 데이터가 목록에 표시되는지 확인
- 상태 필터가 동작하는지 확인
- 일반 사용자 플로우에 노출되지 않는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 관리자 목록 구성
4. 노출 제한 방식
5. 테스트 방법
6. 다음 Step 제안
```

---

## Step 15-3. 후보 승인/반려 localStorage 기능 구현

```md
## 작업 목표
관리자가 후보 카페 제안을 승인/반려 상태로 변경할 수 있게 localStorage 기반 기능을 구현해 주세요.

## 현재 상태
- AdminCandidateListPage가 있습니다.
- suggestionService가 있습니다.

## 요구사항
- suggestionService에 아래 함수를 추가해 주세요.
  - `updateSuggestionStatus(id, status)`
  - `approveSuggestion(id)`
  - `rejectSuggestion(id, reason?)`
- 승인/반려는 제안 상태만 변경하고, cafes.mock.ts에 자동 반영하지 마세요.
- 승인된 후보는 이후 Supabase/admin tooling에서 최종 반영한다고 주석을 남겨 주세요.
- 반려 사유는 선택 입력으로 처리할 수 있게 구조만 고려해 주세요.

## 제한사항
- mock 데이터 자동 수정 금지
- 외부 API 호출 금지
- 공개 사용자 화면 노출 금지
- 자동 승인 금지

## 변경 예상 파일
- `src/services/suggestionService.ts`
- `src/pages/admin/AdminCandidateListPage.tsx`
- 필요 시 `src/pages/admin/AdminCandidateDetailPage.tsx`

## 테스트 방법
- pending 후보 승인 확인
- pending 후보 반려 확인
- 상태별 필터 반영 확인
- localStorage 상태 변경 확인
- 일반 사용자 화면 영향 없음 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. 승인/반려 흐름
4. 테스트 결과
5. 다음 Step 제안
```

---

# Phase 16. 안전한 후보 수집 자동화

## Step 16-1. 네이버 공식 API 후보 수집 설계 v2 작성

```md
## 작업 목표
카공 후보 카페를 공식 API 기반으로 수집하기 위한 안전한 설계 문서를 작성해 주세요.

## 현재 상태
- `docs/candidate-collection-plan.md`가 있습니다.
- Naver 블로그/카페글/지역 검색 API를 활용할 수 있습니다.
- 외부 원문/사진/평점 복제는 금지입니다.

## 요구사항
- `docs/naver-api-candidate-collector-design.md`를 생성 또는 보강해 주세요.
- 아래 내용을 포함해 주세요.
  - 사용할 API 범위
    - 네이버 지역 검색
    - 네이버 블로그 검색
    - 네이버 카페글 검색
  - 필요한 환경 변수
  - 검색 키워드 생성 방식
  - 응답에서 저장 가능한 필드
  - 저장하면 안 되는 필드
  - 후보명/주소 정규화
  - 중복 제거 기준
  - 카공 속성 후보 추출 방식
  - 운영자 검수 큐 등록 방식
  - API rate limit 고려
- 원문 저장 금지와 속성화 원칙을 명확히 적어 주세요.

## 제한사항
- 실제 API 호출 코드 작성 금지
- 비공식 scraping 제안 금지
- 리뷰 원문/사진/평점 저장 금지
- SNS 로그인 자동화 제안 금지

## 변경 예상 파일
- `docs/naver-api-candidate-collector-design.md`

## 테스트 방법
- 기존 데이터 정책과 일치하는지 확인
- 저장 가능/금지 필드가 명확한지 확인
- 운영자 검수 큐 흐름이 포함되어 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 수집 설계 요약
4. 금지사항 요약
5. 다음 Step 제안
```

---

## Step 16-2. 후보 키워드 생성 유틸 구현

```md
## 작업 목표
인천 카공 후보 수집을 위한 검색 키워드 생성 유틸을 구현해 주세요.

## 현재 상태
- 후보 수집 설계 문서가 있습니다.
- 실제 API 호출은 아직 하지 않습니다.

## 요구사항
- `src/utils/candidateKeywords.ts`를 생성해 주세요.
- 아래 함수를 구현해 주세요.
  - `getBaseCandidateKeywords()`
  - `getIncheonAreaKeywords()`
  - `generateCandidateSearchKeywords()`
- 기본 키워드와 구/동 키워드를 조합해 주세요.
- 예시:
  - 인천 카공
  - 인천 공부하기 좋은 카페
  - 인천 노트북 카페
  - 송도 카공
  - 부평 카공
  - 구월동 카공
  - 청라 카공
  - 주안 카공
  - 검단 카공
  - 인하대 카공
  - 인천대 카공
- 중복 키워드는 제거해 주세요.
- API 호출은 하지 마세요.

## 제한사항
- API 호출 금지
- scraping 코드 금지
- SNS 자동화 금지
- 외부 원문 수집 금지

## 변경 예상 파일
- `src/utils/candidateKeywords.ts`

## 테스트 방법
- 키워드 배열 생성 확인
- 중복 제거 확인
- 인천 지역 키워드 포함 확인
- TypeScript 타입 체크

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 키워드 생성 규칙
4. 생성 키워드 예시
5. 테스트 방법
6. 다음 Step 제안
```

---

## Step 16-3. 카공 속성 후보 추출 유틸 구현

```md
## 작업 목표
검색 결과 제목/요약 같은 짧은 텍스트에서 카공 속성 후보만 추출하는 유틸을 구현해 주세요.

## 현재 상태
- 후보 수집은 공식 API 기반 설계만 있습니다.
- 원문 저장은 금지입니다.

## 요구사항
- `src/utils/candidateAttributeExtractor.ts`를 생성해 주세요.
- 입력 문자열에서 아래 속성을 추출해 주세요.
  - quiet
  - outlet
  - wifi
  - solo
  - group
  - lateOpen
  - twentyFourHours
  - dessert
  - coffee
  - spacious
  - seat
- 반환값은 원문이 아니라 속성 키와 confidence만 포함해야 합니다.
- 키워드 매칭 기반으로 단순 구현해 주세요.
- 원문 저장 금지 주석을 남겨 주세요.

## 제한사항
- AI API 호출 금지
- 외부 API 호출 금지
- 원문 반환 금지
- 게시물 본문 저장 금지

## 변경 예상 파일
- `src/utils/candidateAttributeExtractor.ts`

## 테스트 방법
- `콘센트 있고 조용한 송도 카페` → outlet/quiet 추출
- `24시간 노트북 작업하기 좋은 카페` → twentyFourHours/solo 추출
- `단체석 넓은 부평 카페` → group/spacious/seat 추출
- 반환값에 원문이 없는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 추출 속성 목록
4. 원문 보호 방식
5. 테스트 방법
6. 다음 Step 제안
```

---

# Phase 17. QA·빌드·배포 준비

## Step 17-1. 최종 QA 시나리오 문서 작성

```md
## 작업 목표
앱인토스 제출 전 수동 QA에 사용할 최종 시나리오 문서를 작성해 주세요.

## 현재 상태
- MVP+ 기능이 구현되어 있습니다.
- WebView 실기기 확인 필요 항목이 있습니다.

## 요구사항
- `docs/qa-scenarios.md`를 생성해 주세요.
- 아래 시나리오를 포함해 주세요.
  - 첫 진입
  - 위치 허용
  - 위치 거부
  - 조건 선택
  - 추천 결과 있음
  - 추천 결과 없음
  - 상세 진입
  - 네이버 지도 링크 클릭
  - 즐겨찾기 추가/삭제
  - 최근 본 카페 기록
  - 인천 BEST 구/동 선택
  - 인천 BEST 검색
  - 카페 제안 제출
  - 관리자 검수
  - 서비스 안내 화면
  - Android 뒤로가기
  - iOS Safe Area
  - 외부 링크 WebView 동작
  - 오류 fallback
  - localStorage 비정상 데이터
- 각 시나리오에 기대 결과와 확인 방법을 작성해 주세요.
- 실기기 테스트가 필요한 항목은 별도 표시해 주세요.

## 제한사항
- 자동 테스트 코드 작성 아님
- 미구현 기능은 TODO로 표시
- 과도한 QA 항목 나열 금지

## 변경 예상 파일
- `docs/qa-scenarios.md`

## 테스트 방법
- 문서 기준으로 실제 수동 QA 가능 여부 확인
- 실기기 필요 항목이 별도 표시되어 있는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. QA 시나리오 수
4. 실기기 확인 필요 항목
5. 다음 Step 제안
```

---

## Step 17-2. README와 개발/운영 문서 정리

```md
## 작업 목표
프로젝트를 처음 보는 개발자 또는 미래의 내가 실행/배포/운영 흐름을 이해할 수 있도록 README를 정리해 주세요.

## 현재 상태
- MVP+ 기능이 구현되어 있습니다.
- 주요 docs가 여러 개 있습니다.

## 요구사항
- `README.md`를 생성 또는 수정해 주세요.
- 아래 내용을 포함해 주세요.
  - 프로젝트 소개
  - 앱명
  - 핵심 기능
  - 기술 스택
  - 로컬 실행 방법
  - 환경 변수
  - 주요 폴더 구조
  - 데이터 구조
  - 추천 로직 요약
  - 앱인토스 제출 관련 문서 링크
  - 데이터 수집/복제 금지 정책
  - QA 방법
  - 배포 전 체크리스트
- 미구현 기능은 “예정”으로 분리해 주세요.

## 제한사항
- 실제 secret 작성 금지
- 미구현 기능을 완료처럼 쓰지 말 것
- 과장된 성과 지표 작성 금지

## 변경 예상 파일
- `README.md`

## 테스트 방법
- README만 보고 로컬 실행 가능한지 확인
- 문서 링크가 실제 파일과 맞는지 확인
- 데이터 정책이 명확한지 확인

## 출력 형식
1. 변경 요약
2. 수정 파일
3. README 주요 섹션
4. 미구현/예정 항목
5. 다음 Step 제안
```

---

## Step 17-3. 배포 전 빌드 및 번들 점검

```md
## 작업 목표
배포 전 프로젝트가 정상적으로 타입 체크/빌드되는지 확인하고, 번들 상태를 점검해 주세요.

## 현재 상태
- 이전 빌드는 통과했습니다.
- 이후 Phase 12~16 변경이 있을 수 있습니다.

## 요구사항
- package manager를 확인해 주세요.
- 가능한 경우 아래를 실행해 주세요.
  - npm run build
  - tsc --noEmit 또는 프로젝트에 정의된 typecheck
  - lint script가 있으면 lint
- 에러가 있으면 원인을 분석하고 최소 수정해 주세요.
- dist 번들 크기를 기록해 주세요.
- 사용하지 않는 대형 라이브러리가 추가되었는지 확인해 주세요.
- 빌드 결과를 `docs/build-report.md`에 정리해 주세요.

## 제한사항
- 대규모 리팩터링 금지
- 새 라이브러리 추가 금지
- 기능 변경 금지
- 경고를 무시하지 말고 기록할 것

## 변경 예상 파일
- 에러 수정 파일
- `docs/build-report.md`

## 테스트 방법
- typecheck
- build
- lint 가능 시 lint
- 주요 플로우 수동 확인

## 출력 형식
1. 실행 명령
2. 발견한 문제
3. 수정 파일
4. 최종 빌드 결과
5. 번들 크기
6. 남은 이슈
7. 다음 Step 제안
```

---

## Step 17-4. Vercel/정적 배포 설정 점검

```md
## 작업 목표
웹앱 선배포를 위해 Vercel 또는 정적 호스팅 배포 설정을 점검해 주세요.

## 현재 상태
- 앱이 로컬에서 빌드됩니다.
- React Router 없이 navStack을 사용합니다.

## 요구사항
- Vercel 배포에 필요한 설정이 있는지 확인해 주세요.
- SPA rewrite가 필요한지 판단해 주세요.
- 환경 변수 설정 항목을 문서화해 주세요.
- `docs/deploy-checklist.md`를 생성해 주세요.
- 배포 후 확인할 항목을 작성해 주세요.
  - 첫 진입
  - 추천 플로우
  - 상세
  - 네이버 지도 링크
  - 즐겨찾기
  - 제안하기
  - 모바일 viewport
  - iOS/Android WebView 후보 테스트

## 제한사항
- 실제 배포 실행은 사용자 승인 후
- secret 작성 금지
- hosting provider 종속 코드 과다 추가 금지

## 변경 예상 파일
- 필요 시 `vercel.json`
- `docs/deploy-checklist.md`

## 테스트 방법
- local build 확인
- 정적 배포 적합성 확인
- 문서 체크리스트 검토

## 출력 형식
1. 배포 적합성 판단
2. 생성/수정 파일
3. 필요한 환경 변수
4. 배포 후 체크리스트
5. 다음 Step 제안
```

---

# Phase 18. 앱인토스 제출 패키지

## Step 18-1. 앱인토스 제출 카피/스크린샷 계획 최종화

```md
## 작업 목표
앱인토스 제출에 사용할 소개 문구와 스크린샷 계획을 최종 정리해 주세요.

## 현재 상태
- `docs/app-submission-copy.md`가 있습니다.
- MVP+ 화면이 구현되어 있습니다.

## 요구사항
- `docs/apps-in-toss-submission-package.md`를 생성해 주세요.
- 아래 내용을 포함해 주세요.
  - 앱명
  - 한 줄 소개
  - 상세 소개
  - 핵심 기능 3개
  - 사용자 가치 3개
  - 권한 안내
  - 외부 지도 링크 안내
  - 제안 검수 안내
  - 앱 내 기능 후보
  - 스크린샷 후보 화면
- 스크린샷 후보:
  - 홈
  - 추천 결과
  - 카페 상세
  - 인천 BEST
  - 카페 제안
- 미구현 기능은 포함하지 마세요.
- 과장 표현을 피하세요.

## 제한사항
- AI 기능 문구 금지
- 실시간 혼잡도/좌석 문구 금지
- 외부 데이터 복제처럼 보이는 표현 금지
- Toss 브랜드와 혼동되는 문구 금지

## 변경 예상 파일
- `docs/apps-in-toss-submission-package.md`

## 테스트 방법
- 현재 구현 범위와 일치하는지 확인
- 심사 리스크 표현이 없는지 확인
- 스크린샷 후보가 실제 구현 화면인지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 제출 문구 요약
4. 스크린샷 후보
5. 확인 필요 항목
6. 다음 Step 제안
```

---

## Step 18-2. AIT 번들 업로드 준비 문서 작성

```md
## 작업 목표
앱인토스 번들 업로드와 테스트 스킴 확인을 위한 작업 문서를 작성해 주세요.

## 현재 상태
- 앱은 빌드 가능합니다.
- 앱인토스 콘솔 업로드는 아직 진행 전입니다.

## 요구사항
- `docs/ait-deploy-guide.md`를 생성해 주세요.
- 아래 내용을 포함해 주세요.
  - 사전 준비
  - 빌드 명령
  - ait deploy 명령 후보
  - API key/토큰 주의사항
  - 업로드 후 deploymentId 확인
  - 테스트 스킴 QR 확인
  - 실기기 QA 체크리스트 연결
- 실제 API key는 적지 마세요.
- 명령은 예시 형태로만 작성해 주세요.

## 제한사항
- 실제 배포 명령 실행 금지
- secret 작성 금지
- 정책을 확정적으로 단정하지 말 것

## 변경 예상 파일
- `docs/ait-deploy-guide.md`

## 테스트 방법
- 문서만 보고 업로드 준비 흐름을 이해할 수 있는지 확인
- secret이 포함되지 않았는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 업로드 준비 흐름
4. secret 보호 항목
5. 다음 Step 제안
```

---

## Step 18-3. 앱인토스 실기기 테스트 결과 기록 양식 작성

```md
## 작업 목표
앱인토스 테스트 스킴/QR로 실기기 테스트를 진행할 때 사용할 결과 기록 양식을 작성해 주세요.

## 현재 상태
- QA 시나리오 문서가 있습니다.
- 실기기 확인 필요 항목이 있습니다.

## 요구사항
- `docs/device-test-report-template.md`를 생성해 주세요.
- 아래 기록 항목을 포함해 주세요.
  - 테스트 일시
  - 기기
  - OS
  - 토스 앱 버전
  - deploymentId
  - 테스트 스킴
  - 홈 진입
  - 위치 허용/거부
  - Android 뒤로가기
  - iOS Safe Area
  - 네이버 지도 링크
  - localStorage 유지
  - 오류/빈 상태
  - 발견 이슈
  - 재현 방법
  - 수정 우선순위
- 체크박스와 표 형태로 작성해 주세요.

## 제한사항
- 실제 테스트 결과를 임의로 작성하지 말 것
- 테스트 완료로 표시하지 말 것

## 변경 예상 파일
- `docs/device-test-report-template.md`

## 테스트 방법
- 문서가 실제 테스트 기록에 충분한지 확인
- 확인 필요 항목이 빠지지 않았는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 기록 항목 요약
4. 다음 Step 제안
```

---

# Phase 19. 출시 후 운영·성장 루프

## Step 19-1. 출시 후 분석 계획 v2 작성

```md
## 작업 목표
출시 후 1주차, 2~4주차에 어떤 데이터를 보고 개선할지 분석 계획을 작성해 주세요.

## 현재 상태
- logService 이벤트가 있습니다.
- 이벤트 로그는 localStorage 기반이며, 추후 Supabase/앱인토스 분석 연동 예정입니다.

## 요구사항
- `docs/post-launch-analytics-plan.md`를 생성 또는 보강해 주세요.
- 아래 내용을 포함해 주세요.
  - 출시 후 1주차 확인 지표
  - 출시 후 2~4주차 확인 지표
  - 추천 품질 판단 기준
  - 인천 BEST 품질 판단 기준
  - 제안하기 활성도 판단 기준
  - 데이터 부족 구/동 식별 기준
  - 개선 우선순위 산정 기준
- 핵심 퍼널:
  - 홈 → 추천 요청 → 결과 → 상세 → 길찾기
  - 홈 → 인천 BEST → 상세 → 저장
  - 상세 → 저장 → 재방문
  - 제안하기 → 제출 완료
- 수집하면 안 되는 개인정보를 명시해 주세요.

## 제한사항
- 개인정보 수집 제안 금지
- 위치 좌표 장기 저장 제안 금지
- 과도한 분석 도구 추가 금지
- AI 추천을 당장 구현한다고 쓰지 말 것

## 변경 예상 파일
- `docs/post-launch-analytics-plan.md`

## 테스트 방법
- 현재 logService 이벤트와 연결되는지 확인
- KPI와 연결되는지 확인
- 개인정보 보호 원칙이 명확한지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 주요 분석 지표
4. 개인정보 보호 원칙
5. 다음 Step 제안
```

---

## Step 19-2. 추천 로직 고도화 로드맵 v2 작성

```md
## 작업 목표
Rule-based 추천 이후 추천 고도화 로드맵을 작성해 주세요.

## 현재 상태
- 현재 추천 로직은 100점 기반 Rule-based 구조입니다.
- 사용자 로그와 저장/최근 본 카페 데이터가 있습니다.

## 요구사항
- `docs/recommendation-roadmap.md`를 생성 또는 보강해 주세요.
- 아래 단계를 포함해 주세요.
  - v1: 현재 Rule-based 추천
  - v1.5: 구/동별 데이터 커버리지 보정
  - v2: 사용자 행동 점수 반영
  - v3: 시간대 기반 추천
  - v4: 개인화 추천
  - v5: 운영자 큐레이션 + 자동 랭킹 hybrid
- 각 단계별로 아래를 작성해 주세요.
  - 필요한 데이터
  - 구현 난이도
  - 리스크
  - 기대 효과
  - 언제 적용할지
- AI 추천은 충분한 데이터가 쌓인 후 검토한다고 명시해 주세요.

## 제한사항
- 지금 당장 AI 모델 구현 제안 금지
- 개인정보 기반 추천 금지
- 과도한 ML 파이프라인 제안 금지
- 위치 좌표 장기 저장 전제 금지

## 변경 예상 파일
- `docs/recommendation-roadmap.md`

## 테스트 방법
- 현재 로그/DB 구조와 연결되는지 확인
- 단계별 구현 가능성이 현실적인지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 추천 고도화 단계
4. 필요한 데이터
5. 다음 Step 제안
```

---

## Step 19-3. 인천 카페 데이터 운영 루틴 작성

```md
## 작업 목표
출시 후 인천 카공 카페 데이터를 어떻게 수집, 검수, 보정, 확장할지 운영 루틴을 작성해 주세요.

## 현재 상태
- mock 데이터 16개가 있습니다.
- 사용자 제안 기능과 후보 수집 계획이 있습니다.

## 요구사항
- `docs/cafe-data-operations.md`를 생성해 주세요.
- 아래 내용을 포함해 주세요.
  - 주간 운영 루틴
  - 신규 후보 수집
  - 사용자 제안 검수
  - 네이버 지도 존재 여부 확인
  - 영업시간/폐업/주소 변경 확인
  - 구/동별 커버리지 체크
  - 속성 점수 보정 기준
  - 외부 리뷰 원문 복제 금지
  - 사진/평점 저장 금지
- 초기 목표 데이터 규모를 제안해 주세요.
  - MVP: 16~30개
  - 출시 초기: 50개
  - 1차 안정화: 100개

## 제한사항
- 비공식 크롤링 중심 운영 금지
- 외부 리뷰/사진/평점 복제 금지
- 자동 승인 금지

## 변경 예상 파일
- `docs/cafe-data-operations.md`

## 테스트 방법
- 실제 운영자가 따라할 수 있는지 확인
- 데이터 정책과 충돌하지 않는지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. 운영 루틴 요약
4. 데이터 규모 목표
5. 다음 Step 제안
```

---

# Phase 20. 최종 인수인계·출시 판단

## Step 20-1. 프로젝트 인수인계 문서 v2 작성

```md
## 작업 목표
미래의 나 또는 다른 개발자가 프로젝트를 이어받을 수 있도록 최종 인수인계 문서를 작성해 주세요.

## 현재 상태
- MVP+ 구현과 Phase 12~19 문서가 준비되어 있습니다.

## 요구사항
- `docs/handoff.md`를 생성 또는 보강해 주세요.
- 아래 내용을 포함해 주세요.
  - 프로젝트 개요
  - 실행 방법
  - 주요 기능
  - 주요 파일 구조
  - 화면 전환 구조
  - 데이터 흐름
  - 추천 로직 흐름
  - localStorage 구조
  - Supabase 전환 구조
  - 앱인토스 연동 TODO
  - WebView 실기기 확인 항목
  - 데이터 정책
  - 남은 작업
  - 주의사항
- 미구현 기능은 별도로 표시해 주세요.

## 제한사항
- 미구현 기능을 완료처럼 쓰지 말 것
- secret 작성 금지
- 과장된 설명 금지

## 변경 예상 파일
- `docs/handoff.md`

## 테스트 방법
- 문서만 보고 프로젝트 구조를 이해할 수 있는지 확인
- 남은 작업이 명확한지 확인
- 실제 파일 경로와 일치하는지 확인

## 출력 형식
1. 변경 요약
2. 생성/수정 파일
3. 문서 주요 섹션
4. 남은 TODO
5. 다음 Step 제안
```

---

## Step 20-2. MVP+ 최종 완료 상태 점검

```md
## 작업 목표
`카공 어디가? 인천편`이 앱인토스 제출 가능한 MVP+ 상태인지 최종 점검해 주세요.

## 현재 상태
- Phase 12~19가 진행되었습니다.
- 빌드와 문서가 준비되어 있을 수 있습니다.

## 요구사항
- 현재 파일 구조와 문서를 읽어 주세요.
- 아래 기준으로 완료 여부를 표로 정리해 주세요.
  - 기획 문서
  - CLAUDE.md
  - 타입 정의
  - mock 데이터
  - 추천 로직
  - 추천 이유
  - 위치 권한
  - 추천 결과
  - 카페 상세
  - 네이버 지도 링크
  - 인천 BEST
  - 즐겨찾기
  - 최근 본 카페
  - 카페 제안
  - 이벤트 로그
  - safeStorage
  - WebView 뒤로가기
  - 외부 링크 테스트 문서
  - 서비스 안내/정책 화면
  - Supabase 준비
  - 익명 사용자 준비
  - 관리자 검수 준비
  - 후보 수집 설계
  - QA 문서
  - 배포 문서
  - 앱인토스 제출 패키지
- 각 항목을 `완료 / 부분 완료 / 미완료 / 확인 필요`로 표시해 주세요.
- High priority 미완료 항목이 있으면 Phase 18 제출 패키지로 넘어가지 말라고 판단해 주세요.
- 최종 출시 가능성을 아래 중 하나로 판단해 주세요.
  - 제출 가능
  - 조건부 제출 가능
  - 제출 전 보완 필요

## 제한사항
- 바로 수정하지 말고 점검만 할 것
- 완료되지 않은 기능을 완료로 표시하지 말 것
- 실기기 테스트 전 항목은 확인 필요로 표시

## 출력 형식
1. 전체 완료율 요약
2. 항목별 상태 표
3. High priority 남은 작업
4. Medium priority 남은 작업
5. 앱인토스 제출 가능성 판단
6. 다음 Claude Code 프롬프트 제안
```

---

## Step 20-3. 최종 제출 전 Fix List 생성

```md
## 작업 목표
최종 점검 결과를 바탕으로 제출 전 반드시 해결해야 할 Fix List를 작성해 주세요.

## 현재 상태
- MVP+ 최종 완료 상태 점검이 끝났습니다.

## 요구사항
- `docs/pre-submit-fix-list.md`를 생성해 주세요.
- Fix 항목을 아래 기준으로 분류해 주세요.
  - Must Fix
  - Should Fix
  - Nice to Have
- 각 항목에는 아래를 포함해 주세요.
  - 문제
  - 영향
  - 수정 파일
  - 예상 작업량
  - 테스트 방법
  - 담당 Phase
- Must Fix가 남아 있으면 제출하지 않는다고 명시해 주세요.

## 제한사항
- 새로운 기능 아이디어를 무리하게 추가하지 말 것
- 이미 완료된 항목을 다시 넣지 말 것
- 근거 없는 리스크를 과장하지 말 것

## 변경 예상 파일
- `docs/pre-submit-fix-list.md`

## 테스트 방법
- 최종 완료 점검 결과와 일치하는지 확인
- Must Fix가 실제 제출 차단 항목인지 확인

## 출력 형식
1. 변경 요약
2. 생성 파일
3. Must Fix 목록
4. Should Fix 목록
5. 제출 가능 조건
```
