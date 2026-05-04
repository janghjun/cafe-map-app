# 환경 변수 사용 가이드

## 파일 구조

| 파일 | 용도 | Git 커밋 여부 |
|---|---|---|
| `.env.example` | 변수 목록 및 설명 (실제 값 없음) | ✅ 커밋 |
| `.env` | 로컬 개발용 실제 값 | ❌ `.gitignore`에 포함 |
| `.env.local` | 로컬 개발용 실제 값 (`.env` 대안) | ❌ `.gitignore`에 포함 |
| Vercel 프로젝트 설정 | 프리뷰/프로덕션 배포용 실제 값 | — (Vercel 관리) |

## 변수 목록

### `VITE_SUPABASE_URL`

- 타입: `string`
- 예시: `https://abcdefghijklmnop.supabase.co`
- 설명: Supabase 프로젝트 URL. Supabase Dashboard → Project Settings → API에서 확인.
- 없을 때 동작: `VITE_DATA_SOURCE=mock` 이면 무시됨. `supabase`로 설정 시 런타임 에러 발생.

### `VITE_SUPABASE_ANON_KEY`

- 타입: `string`
- 예시: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- 설명: Supabase anon (public) key. Row Level Security가 적용된 공개 접근용 키.
- 없을 때 동작: `VITE_DATA_SOURCE=mock` 이면 무시됨.

### `VITE_DATA_SOURCE`

- 타입: `"mock" | "supabase"`
- 기본값: `mock` (변수가 없는 경우 mock으로 동작)
- 설명:
  - `mock`: `src/data/cafes.mock.ts`의 더미 데이터를 사용. Supabase 연결 없이 동작.
  - `supabase`: Supabase에서 카페 데이터를 로드. `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 필요.

## 로컬 개발 시작

```bash
# 1. .env.example을 복사해 .env 생성
cp .env.example .env

# 2. .env에 실제 값 입력 (Supabase 사용 시)
#    mock 모드만 사용한다면 수정 불필요

# 3. 개발 서버 시작
npm run dev
```

## Vercel 배포 시 환경 변수 설정

```bash
# Vercel CLI로 환경 변수 추가 (프로덕션 + 프리뷰)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_DATA_SOURCE

# 현재 설정된 환경 변수 확인
vercel env ls
```

또는 Vercel Dashboard → 프로젝트 → Settings → Environment Variables에서 직접 추가.

## mock 모드와 supabase 모드 전환

개발 중 두 모드를 전환하려면 `.env`의 `VITE_DATA_SOURCE` 값만 바꾸면 됩니다.

```bash
# mock 모드 (기본)
VITE_DATA_SOURCE=mock

# Supabase 모드
VITE_DATA_SOURCE=supabase
```

변경 후 Vite 개발 서버를 재시작해야 합니다 (`npm run dev`).

## 주의사항

- `VITE_` 접두사가 없는 변수는 Vite 빌드에서 클라이언트 코드로 노출되지 않습니다.
- 현재 모든 변수는 `VITE_` 접두사를 사용하므로 빌드 결과물에 포함됩니다.
- anon key는 공개되어도 안전하지만, RLS(Row Level Security) 설정이 전제입니다.
- service_role key는 절대 클라이언트 코드에 포함하지 마세요.

---

## 출시 단계별 VITE_DATA_SOURCE 전환 기준

| 단계 | `VITE_DATA_SOURCE` | 용도 |
|---|---|---|
| UI 개발 중 | `mock` | Supabase 없이 빠른 개발/테스트 |
| 출시 전 QA | `supabase` | 실데이터 연동 후 최종 QA |
| 프로덕션 | `supabase` | 실서비스 운영 |

> **기본값은 `mock`으로 유지합니다.**
> Supabase 프로젝트 생성 및 실데이터 적재 완료 후, 출시 직전 테스트 단계에서 `supabase`로 전환하세요.

---

## Supabase 프로젝트 연결 수동 체크리스트

Supabase 프로젝트를 신규 생성하고 앱과 연결하기 위한 순서입니다.

- [ ] **1. Supabase 프로젝트 생성**
  - https://app.supabase.com → New Project
  - 리전: Northeast Asia (Seoul) 권장
  - DB 비밀번호 안전하게 보관 (분실 시 복구 어려움)

- [ ] **2. 스키마 적용**
  - Supabase Dashboard → SQL Editor → New Query
  - `docs/supabase-schema.sql` 전체 내용 복사 후 Run
  - 에러 없이 완료되면 Table Editor에서 테이블 목록 확인

- [ ] **3. anon key 확인**
  - Project Settings → API
  - `Project URL`과 `anon public` key 복사

- [ ] **4. `.env.local` 작성**
  - `.env.example` 복사: `cp .env.example .env.local`
  - `VITE_SUPABASE_URL` — 3단계에서 복사한 Project URL 입력
  - `VITE_SUPABASE_ANON_KEY` — 3단계에서 복사한 anon key 입력
  - `VITE_DATA_SOURCE=supabase` 로 변경

- [ ] **5. 로컬 실행 확인**
  - `npm run dev`
  - 홈 화면 정상 로드 및 카페 목록 표시 확인
  - 브라우저 콘솔에 Supabase 에러 없음 확인

- [ ] **6. Vercel 환경 변수 등록**
  - Vercel Dashboard → 프로젝트 → Settings → Environment Variables
  - 또는 CLI:
    ```bash
    vercel env add VITE_SUPABASE_URL
    vercel env add VITE_SUPABASE_ANON_KEY
    vercel env add VITE_DATA_SOURCE
    ```
  - Production + Preview 환경 모두 등록

- [ ] **7. 재배포 후 확인**
  - `vercel --prod` 또는 Dashboard에서 Redeploy
  - 배포 완료 후 프로덕션 URL 접속, 카페 목록 정상 표시 확인
  - 브라우저 DevTools → Network 탭에서 Supabase 요청 200 응답 확인
