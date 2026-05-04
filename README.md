# 카공 어디가? 인천편

인천에서 공부하기 좋은 카페를 조건에 맞게 추천하고, 구/동별 BEST 카페를 탐색할 수 있는 WebView 기반 Mini App입니다.

> 앱인토스(Toss Mini App) 심사 제출 대상 프로젝트입니다.  
> 현재 Vercel에 배포 중: **https://cafemapapp.vercel.app**

---

## 핵심 기능

| 기능 | 설명 |
|---|---|
| 내 주변 추천 | 위치·반경·카공 조건으로 TOP 3~5 추천 |
| 인천 BEST | 구/동별 카공 카페 BEST 탐색 |
| 카페 상세 | 카공 적합도, 운영시간, 네이버 지도 링크 |
| 즐겨찾기 | 카페 저장/삭제, 새로고침 후 유지 |
| 최근 본 카페 | 방문 이력 최대 20개, 목록 초기화 |
| 카페 제안하기 | 사용자 카공 카페 제안 → 운영자 검수 |
| 서비스 안내 | 개인정보 처리 방침 간이 화면 |
| 관리자 검수 | `/?mode=admin` — 내부 운영자 전용 |

---

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **스타일**: CSS (전역 + 파일별)
- **상태 관리**: `useState` + navStack 패턴 (React Router 미사용)
- **저장소**: localStorage (`safeStorage` 헬퍼)
- **백엔드 (예정)**: Supabase (현재 mock 데이터 사용)
- **배포**: Vercel
- **패키지 매니저**: npm

---

## 로컬 실행

```bash
# 1. 패키지 설치
npm install

# 2. 환경 변수 설정 (Supabase 사용 시)
cp .env.example .env
# .env에 실제 값 입력 (mock 모드는 수정 불필요)

# 3. 개발 서버 시작
npm run dev
# → http://localhost:5173
```

### 기타 명령

```bash
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
npm run preview  # 빌드 결과 로컬 미리보기
```

---

## 환경 변수

자세한 내용은 [docs/env.md](docs/env.md) 참고.

| 변수 | 기본값 | 설명 |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` | `mock` 또는 `supabase` |
| `VITE_SUPABASE_URL` | — | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | — | Supabase anon key |

---

## 폴더 구조

```
src/
  app/
    App.tsx           # 앱 진입점, navStack 관리, 화면 전환
    routes.tsx        # NavState 타입 정의
  pages/
    HomePage.tsx
    RecommendationPage.tsx
    CafeDetailPage.tsx
    DistrictBestPage.tsx
    FavoritesPage.tsx
    RecentViewsPage.tsx
    SuggestCafePage.tsx
    ServiceInfoPage.tsx
    admin/
      AdminCandidateListPage.tsx  # 내부 운영자 전용
  components/         # 공유 UI 컴포넌트
  data/
    cafes.mock.ts     # 개발용 더미 데이터 (16개)
  services/
    cafeService.ts    # mock/supabase 이중 모드
    cafeMapper.ts     # DB row → Cafe 타입 매핑
    supabaseClient.ts
    favoriteService.ts
    recentViewService.ts
    logService.ts
    suggestionService.ts
    userIdentityService.ts  # 익명 사용자 ID
  types/
    cafe.ts           # Cafe, CafeAttributes, UserPreference 등
    user.ts
  utils/
    distance.ts       # Haversine 거리 계산
    recommendation.ts # 100점 기반 추천 점수 계산
    naverMap.ts
    safeStorage.ts
    candidateKeywords.ts
    candidateAttributeExtractor.ts
  styles/
docs/                 # 설계 문서
```

---

## 데이터 구조

핵심 타입은 `src/types/cafe.ts`에 정의되어 있습니다.

```ts
type Cafe = {
  id: string;
  name: string;
  district: string;  // 예: "연수구"
  dong: string;      // 예: "송도동"
  lat: number;
  lng: number;
  summary: string;
  is24Hours: boolean;
  naverMapUrl?: string;
  status: "active" | "pending" | "closed";
  tags: CafeTag[];
  attributes: CafeAttributes;  // 12개 점수 필드 (0~5)
};
```

---

## 추천 로직 요약

`src/utils/recommendation.ts` — 100점 기반 가중 점수:

| 항목 | 가중치 |
|---|---|
| 거리 적합도 | 30 |
| 인원 적합도 | 20 |
| 분위기 적합도 | 15 |
| 콘센트 | 10 |
| 체류 적합성 | 10 |
| 와이파이 | 5 |
| 영업시간 | 5 |
| 커피/디저트 | 5 |

반경 내 필터링 → 점수 계산 → TOP 3 기본 / 더보기 시 TOP 5

---

## 주요 문서

| 문서 | 내용 |
|---|---|
| [docs/env.md](docs/env.md) | 환경 변수 사용 가이드 |
| [docs/supabase-schema.sql](docs/supabase-schema.sql) | DB 스키마 |
| [docs/seed-data-plan.md](docs/seed-data-plan.md) | mock → Supabase 이식 계획 |
| [docs/apps-in-toss-checklist.md](docs/apps-in-toss-checklist.md) | 앱인토스 제출 체크리스트 |
| [docs/apps-in-toss-feature-entry.md](docs/apps-in-toss-feature-entry.md) | 딥링크 설계 |
| [docs/admin-review-plan.md](docs/admin-review-plan.md) | 관리자 검수 설계 |
| [docs/qa-scenarios.md](docs/qa-scenarios.md) | QA 시나리오 |
| [docs/deploy-checklist.md](docs/deploy-checklist.md) | 배포 전 체크리스트 |
| [docs/naver-api-candidate-collector-design.md](docs/naver-api-candidate-collector-design.md) | 후보 수집 설계 |

---

## 데이터 수집/복제 금지 정책

외부 리뷰 원문, 사진, 평점을 저장하지 않습니다.  
공식 API 기반 후보 수집만 허용하며, 비공식 크롤링은 전면 금지합니다.  
자세한 정책: [docs/candidate-collection-plan.md](docs/candidate-collection-plan.md)

---

## 예정 기능 (미구현)

- Supabase 실제 연결 및 실데이터 전환
- 앱인토스 `getAnonymousKey` 연동
- `?entry=best` / `?entry=suggest` 딥링크 파라미터 처리
- RLS 적용
- 운영자 인증 도입
- 카공 후보 자동 수집 스크립트
