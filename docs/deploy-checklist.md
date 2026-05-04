# 배포 전 체크리스트

> **작성일**: 2026-05-01  
> **배포 대상**: https://cafemapapp.vercel.app  
> **플랫폼**: Vercel (Vite SPA)

---

## 1. 배포 적합성 판단

| 항목 | 상태 | 비고 |
|---|---|---|
| SPA 단일 URL 여부 | ✅ | React Router 미사용, `navStack` 패턴 |
| SPA rewrite 필요 여부 | ✅ 불필요 | `/`만 사용 — 별도 경로 없음 |
| `vercel.json` 추가 필요 여부 | ✅ 불필요 | 현재 기본 설정으로 충분 |
| `?mode=admin` 파라미터 | ✅ | 클라이언트 파싱, 서버 설정 불필요 |
| 빌드 명령 | `tsc -b && vite build` | package.json `build` 스크립트 |
| 출력 디렉터리 | `dist/` | Vite 기본값 — Vercel 자동 감지 |
| Node.js 버전 | 24 LTS | Vercel 기본값 |

---

## 2. 환경 변수 설정 (Vercel Dashboard)

> Settings → Environment Variables

| 변수 | 현재 값 | 설명 |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` | Supabase 전환 시 `supabase`로 변경 |
| `VITE_SUPABASE_URL` | (미설정) | Supabase 연결 시 입력 |
| `VITE_SUPABASE_ANON_KEY` | (미설정) | Supabase 연결 시 입력 |
| `VITE_ADMIN_PASSWORD` | (필수 설정) | `?mode=admin` 진입 비밀번호 — 강력한 무작위 문자열 사용 |

> ⚠️ `VITE_ADMIN_PASSWORD`를 설정하지 않으면 관리자 화면이 "설정되지 않았어요" 상태로 표시됩니다.

### CLI로 설정하는 방법

```bash
vercel env add VITE_DATA_SOURCE        # mock
vercel env add VITE_SUPABASE_URL       # Supabase 프로젝트 URL
vercel env add VITE_SUPABASE_ANON_KEY  # anon key
vercel env add VITE_ADMIN_PASSWORD     # 관리자 비밀번호 (강력한 무작위 문자열)
vercel env ls                          # 현재 설정 확인
```

---

## 3. 배포 명령

```bash
# 프리뷰 배포 (기본)
vercel

# 프로덕션 배포
vercel --prod
```

---

## 4. 배포 후 확인 체크리스트

### 기본 동작

- [ ] `https://cafemapapp.vercel.app/` 접속 — 홈 화면 표시 확인
- [ ] 브라우저 콘솔에 JS 에러 없음 확인
- [ ] 네트워크 탭에서 `index.html`, `index.js`, `index.css` 200 응답 확인

### 핵심 플로우

- [ ] 위치 허용 → 반경 선택 → 조건 선택 → 추천 받기 → 카드 목록 표시
- [ ] 카드 클릭 → 상세 화면 → 네이버 지도 버튼 표시
- [ ] 즐겨찾기 추가 → 즐겨찾기 탭에서 확인 → 새로고침 후 유지
- [ ] 인천 BEST → 구 선택 → 동 선택 → 카페 목록 표시
- [ ] 카페 제안하기 → 폼 제출 → 완료 화면 표시

### 외부 링크

- [ ] 카페 상세의 "네이버 지도" 버튼 → 새 탭에서 열림 확인

### 모바일 viewport

- [ ] 모바일 Chrome에서 스크롤, 탭, 버튼 클릭 정상 확인
- [ ] viewport meta 태그 (`width=device-width`) 적용 확인

### 딥링크 진입

- [ ] `/?entry=best` → 인천 BEST 화면 직접 진입 확인
- [ ] `/?entry=suggest` → 카페 제안 화면 직접 진입 확인
- [ ] `/?entry=theme` → 테마 카페 화면 직접 진입 확인
- [ ] `/?entry=unknown` → 홈 fallback 확인
- [ ] 딥링크 진입 후 뒤로가기 → 홈으로 복귀 확인

### 관리자 화면

- [ ] `https://cafemapapp.vercel.app/?mode=admin` → 비밀번호 입력 화면 표시
- [ ] 올바른 비밀번호 입력 → 관리자 화면 진입 확인
- [ ] 로그아웃 → 비밀번호 입력 화면으로 복귀 확인
- [ ] 일반 홈(`/`)에서 관리자 화면으로 접근 불가 확인

---

## 5. 실기기 확인 항목 (앱인토스 WebView)

| # | 항목 | 우선순위 |
|---|---|---|
| W-1 | Android WebView에서 네이버 지도 링크 → 외부 브라우저/앱으로 이동 | 높음 |
| W-2 | Android 하드웨어 뒤로가기 → navStack pop 동작 | 높음 |
| W-3 | iOS Safe Area — 상단/하단 버튼 가려짐 없음 | 중간 |
| W-4 | `?entry=best` 딥링크 진입 시 인천 BEST 화면 직접 표시 | 중간 |
| W-5 | `?entry=suggest` 딥링크 진입 시 카페 제안 화면 직접 표시 | 중간 |
| W-6 | `?entry=theme` 딥링크 진입 시 테마 카페 화면 직접 표시 | 중간 |

---

## 6. 롤백 방법

```bash
# 이전 배포 목록 확인
vercel ls

# 특정 배포로 alias 변경
vercel alias set <deployment-url> cafemapapp.vercel.app
```

---

## 7. 미완성 항목 (다음 배포 전 완료 권장)

| # | 항목 | 문서 |
|---|---|---|
| D-1 | ~~`?entry=` 딥링크 파라미터 구현~~ | ✅ 완료 — docs/deeplink-entry-plan.md |
| D-2 | Supabase 실연결 및 실데이터 전환 | docs/seed-data-plan.md |
| D-3 | 앱인토스 개인정보처리방침 URL 등록 | ServiceInfoPage.tsx TODO |
| D-4 | `VITE_ADMIN_PASSWORD` Vercel 환경 변수 등록 | docs/admin-security-note.md |
