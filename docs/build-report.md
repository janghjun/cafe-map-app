# 빌드 점검 보고서

> **작성일**: 2026-05-01  
> **기준 커밋**: Phase 12~17 작업 완료 시점

---

## 1. 실행 명령

```bash
npm run lint          # ESLint 검사
npx tsc --noEmit      # 타입 체크
npm run build         # tsc -b && vite build
```

---

## 2. 타입 체크 결과

```
$ npx tsc --noEmit
(출력 없음)
```

**결과: ✅ 타입 에러 없음**

---

## 3. Lint 결과

```
$ npm run lint
(출력 없음)
```

**결과: ✅ 에러 0개, 워닝 0개**

### 수정한 lint 이슈 (이번 Step에서 해결)

| 파일 | 이슈 | 해결 방법 |
|---|---|---|
| `src/services/favoriteService.ts:46` | `@typescript-eslint/no-unused-expressions` — ternary를 statement로 사용 | if-else로 변환 |
| `src/app/App.tsx:63` | `react-hooks/set-state-in-effect` — useEffect 내 setState | 의도적 패턴임을 명시한 eslint-disable-next-line 추가 |
| `src/pages/HomePage.tsx:46` | `react-hooks/set-state-in-effect` — 마운트 시 geolocation 감지 | 의도적 패턴임을 명시한 eslint-disable-next-line 추가 |
| `src/app/App.tsx:53,58` | Unused `eslint-disable-line react-hooks/exhaustive-deps` | 불필요한 주석 제거 |
| `src/pages/HomePage.tsx:58` | Unused `eslint-disable-line react-hooks/exhaustive-deps` | 불필요한 주석 제거 |
| `src/services/logService.ts:74` | Unused `eslint-disable-next-line no-console` | 불필요한 주석 제거 |

---

## 4. 빌드 결과

```
vite v8.0.10 building client environment for production...
✓ 96 modules transformed.

dist/index.html                   0.47 kB │ gzip:  0.33 kB
dist/assets/index-smcLToR6.css   16.78 kB │ gzip:  2.92 kB
dist/assets/index-H66M6c8P.js   248.00 kB │ gzip: 73.82 kB

✓ built in 146ms
```

**결과: ✅ 빌드 성공**

---

## 5. 번들 크기

| 파일 | 원본 크기 | gzip |
|---|---|---|
| `index.html` | 0.47 kB | 0.33 kB |
| `index.css` | 16.78 kB | 2.92 kB |
| `index.js` | 248.00 kB | 73.82 kB |
| **합계** | **265.25 kB** | **77.07 kB** |

### 번들 크기 평가

- JS 248KB (gzip 74KB)는 SPA 기준 **적정 수준** (React 18 + @supabase/supabase-js 포함)
- `@supabase/supabase-js`가 포함되어 있으나, mock 모드에서는 클라이언트 인스턴스가 생성되지 않아 런타임 영향 없음
- 대형 라이브러리 추가 없음 확인

### 의존성 목록

```
dependencies:
  @supabase/supabase-js  — Supabase 클라이언트 (lazy 싱글턴)
  react                  — React 18
  react-dom              — ReactDOM

devDependencies:
  TypeScript, Vite, ESLint 및 관련 플러그인
```

---

## 6. 남은 이슈

| # | 이슈 | 우선순위 | 비고 |
|---|---|---|---|
| I-1 | `?entry=best`, `?entry=suggest` 딥링크 미구현 | 중간 | docs/apps-in-toss-feature-entry.md 설계 완료 |
| I-2 | `push` 함수 `useCallback` 미적용 | 낮음 | 현재 동작에 문제 없음, 딥링크 구현 시 재검토 |
| I-3 | Supabase 실연결 미완료 | 중간 | mock 모드로 정상 동작 중 |
| I-4 | 앱인토스 `getAnonymousKey` 미연동 | 낮음 | 로컬 UUID fallback으로 동작 중 |

---

## 7. 다음 Step 제안

| Step | 작업 |
|---|---|
| 17-4 | Vercel 배포 설정 점검 및 deploy-checklist.md 작성 |
| 14-4 | Supabase 프로젝트 실생성 및 schema 적용 |
| 딥링크 | `?entry=` 파라미터 파싱 구현 (docs/apps-in-toss-feature-entry.md 참고) |
