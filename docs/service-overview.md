# 카공 어디가? 인천편 — 서비스 현황 문서

> 작성일: 2026-05-04  
> 상태: MVP+ 완성, 앱인토스 심사 준비 단계

---

## 1. 서비스 개요

### 한 줄 정의
인천에서 공부하기 좋은 카페를 위치·조건에 맞게 TOP 3~5로 추천하고, 구/동별 BEST 카페도 탐색할 수 있는 **인천 특화 카공 추천 WebView Mini App**.

### 배포 환경
| 항목 | 내용 |
|------|------|
| 서비스 URL | Vercel 자동 배포 (main 브랜치 push → 즉시 반영) |
| 타겟 플랫폼 | 앱인토스 WebView Mini App (브라우저에서도 접근 가능) |
| 지원 환경 | iOS WebView, Android WebView, 모바일 브라우저 |
| 최대 너비 | 480px (모바일 최적화) |

---

## 2. 기술 스택

| 레이어 | 기술 | 버전/비고 |
|--------|------|---------|
| **UI 프레임워크** | React | v19 |
| **언어** | TypeScript | v6 |
| **빌드 도구** | Vite | v8 |
| **데이터베이스** | Supabase (PostgreSQL) | RLS 적용, 3-table 구조 |
| **배포** | Vercel | GitHub 연동, 자동 배포 |
| **패키지 매니저** | npm | — |
| **스크립트 런타임** | tsx | 데이터 수집/적재 스크립트용 |

### 데이터 소스 전환
```
VITE_DATA_SOURCE=supabase  → Supabase에서 카페 데이터 조회 (운영 모드)
VITE_DATA_SOURCE=mock      → 번들된 cafes.mock.ts 사용 (오프라인 개발용)
```
Supabase 캐시 미로드 시 자동으로 mock 데이터 폴백.

---

## 3. 라우팅 구조

외부 라우터 없이 `App.tsx`가 `navStack: NavState[]` 배열로 페이지 전환을 관리.  
`push()` / `pop()` + `history.pushState()` 로 Android 하드웨어 뒤로가기와 동기화.

```
NavState =
  | "home"
  | "recommendations"   ← UserPreference + userLocation 전달
  | "cafeDetail"        ← Cafe 객체 + distanceLabel 전달
  | "districtBest"
  | "favorites"
  | "recentViews"
  | "suggestCafe"       ← 신규(new) / 수정제안(update) 두 모드
  | "serviceInfo"
  | "themeCafes"
```

### 딥링크 진입점
```
?entry=best     → 홈 → 인천 BEST
?entry=suggest  → 홈 → 카페 제안하기
?entry=theme    → 홈 → 테마 카공 추천
?mode=admin     → 관리자 화면 (navStack 완전 분리)
```

---

## 4. 화면별 기능 현황

### 4.1 홈 (HomePage) — ✅ 완성

| 요소 | 내용 |
|------|------|
| 히어로 | 다크 그라디언트 배경, "인천 카공 카페 690곳 수록" 배지 |
| 빠른 선택 프리셋 | 혼자 집중 / 팀플 / 노트북 작업 / 야간 집중 / 디저트도 중요 |
| 위치 권한 | GPS 허용 → 실시간 좌표 / 거부 → 인천 중심(인하대) 폴백 |
| 반경 선택 | 1km / 3km / 5km |
| 인원 선택 | 혼자 / 2~4명 / 5명 이상 |
| 분위기 선택 | 조용한 곳 / 대화 가능한 곳 |
| 조건 선택 | 콘센트 / 와이파이 / 늦게까지 / 24시간 / 커피 / 디저트 |
| CTA 버튼 | 카공 카페 추천받기 / 인천 BEST 보기 / 테마 카공 추천 보기 |
| 링크 | 저장한 카페 / 최근 본 카페 / 서비스 안내 |

### 4.2 추천 결과 (RecommendationPage) — ✅ 완성

| 요소 | 내용 |
|------|------|
| 조건 요약 칩 | 선택된 조건 (3km · 혼자 · 조용한 곳 · 콘센트 등) 수평 스크롤 표시 |
| 1순위 카드 | "가장 추천" primary variant, 그라디언트 상단 바 |
| 2~3순위 카드 | secondary variant |
| 더 보기 | TOP 3 → TOP 5 확장 |
| 미니맵 | SVG 기반 위치 미리보기, 마커 클릭 → 카페 상세 이동 |
| 추천 이유 | 각 카드에 matchReasons 표시 |
| 추천 기준 안내 | 토글로 열리는 100점 채점 기준 설명 |

**추천 알고리즘 (100점)**
```
거리 적합도     30점  ← (1 - distanceKm/radius) × 30
인원 적합도     20점  ← soloScore 또는 (groupScore+groupSeatScore)/2 기반
분위기 적합도   15점  ← quietScore 또는 (5-quietScore) 기반
콘센트          10점
체류 적합성     10점  ← stayScore
와이파이         5점
영업시간/24h     5점
커피/디저트      5점
```

### 4.3 카페 상세 (CafeDetailPage) — ✅ 완성

| 섹션 | 내용 |
|------|------|
| 기본 정보 | 이름, 주소, 구/동, 거리, 24h 배지, 검증 상태 |
| 한 줄 요약 | 운영자 작성 summary |
| 운영자 메모 | curatorNote (일부 카페에만 있음) |
| 카공 적합도 | buildStudySummary() 생성 문장 3개 + AttributeSummary 점수 |
| 카공 태그 | 색상 구분 TagBadge 목록 |
| 와이파이 제보 | "괜찮아요" / "느려요" 선택, localStorage 저장, 제보 경과 시간 표시 |
| **Sticky CTA** | 하단 고정 바 — "네이버 지도에서 보기" + 즐겨찾기 버튼 (frosted glass) |
| 수정 제안 | 정보 오류 시 SuggestCafePage(update 모드)로 이동 |

### 4.4 인천 BEST (DistrictBestPage) — ✅ 완성

| 요소 | 내용 |
|------|------|
| 검색 | 카페명 / 구 / 동 / 태그 전문 검색 |
| 구 선택 | 인천 내 9개 구 FilterChip |
| 동 선택 | 선택된 구 내 동 FilterChip |
| 랭킹 기준 | 카공 종합 점수 (속성 합산) 상위 5곳 |
| 미니맵 | 구/동 내 카페 위치 미리보기 |

### 4.5 즐겨찾기 / 카공 코스 (FavoritesPage) — ✅ 완성

**즐겨찾기 탭**
- 저장한 카페 목록 (별 버튼으로 추가/해제)
- 빈 상태 → 카공 카페 찾아보기 안내

**카공 코스 탭**
- 코스 생성 / 삭제
- 즐겨찾기 카페를 코스에 추가 / 제거
- 코스별 상세 뷰

### 4.6 최근 본 카페 (RecentViewsPage) — ✅ 완성
- 상세 페이지 진입 시 자동 기록 (최대 20건, localStorage)
- 전체 삭제 기능

### 4.7 카페 제안하기 (SuggestCafePage) — ✅ 완성

| 모드 | 내용 |
|------|------|
| **new** | 새 카페 제안 — 카페명(필수), 주소, 추천 이유, 태그 체크 |
| **update** | 정보 수정 제안 — 대상 카페명 표시, 수정 이유 분류 (폐업/영업시간/콘센트/공간/기타) |

제출 즉시 공개 반영 없음 → localStorage 저장 → 운영자 관리자 화면 검토.

### 4.8 테마 카공 추천 (ThemeCafesPage) — ✅ 완성

| 테마 | 내용 |
|------|------|
| ✨ 이번 주 추천 | 운영자 큐레이션 4곳 (구 다양화) |
| 🌙 야간 카공 | 24시간 카페 4곳 |
| 👤 혼자 집중 | soloScore 상위 카페 |
| 👥 그룹 스터디 | groupScore + groupSeatScore 상위 카페 |

### 4.9 서비스 안내 (ServiceInfoPage) — ✅ 완성
- FAQ (아코디언)
- 개인정보 처리 안내
- 카페 제안하기 버튼

### 4.10 관리자 화면 (Admin) — 🔶 개발용 수준

| 항목 | 상태 |
|------|------|
| 접근 방법 | `?mode=admin` URL 파라미터 |
| 인증 | 비밀번호 (sessionStorage, 환경변수 `VITE_ADMIN_PASSWORD`) |
| 기능 | 사용자 제안 목록 / 승인·반려·재확인 처리 |
| 한계 | localStorage의 user_suggestions만 표시 (Supabase candidates 미연동) |
| 보안 | 실서비스 전환 시 Supabase Auth 또는 별도 인증 필요 |

---

## 5. 카페 데이터 현황

### 총계
| 항목 | 수치 |
|------|------|
| 총 등록 카페 | **690곳** |
| 활성(active) 카페 | **690곳** |
| 24시간 운영 카페 | **13곳** |
| 검증 상태 | 전체 `verified_basic` (네이버 지역 API 존재 확인 완료) |

### 구별 분포
| 구 | 카페 수 |
|----|---------|
| 서구 | 142 |
| 연수구 | 106 |
| 남동구 | 100 |
| 부평구 | 99 |
| 미추홀구 | 76 |
| 계양구 | 75 |
| 중구 | 59 |
| 강화군 | 22 |
| 동구 | 11 |

### 속성 점수 현황
- **모든 카페** 속성 점수가 기본값(3/5)으로 설정되어 있음
- 운영자의 직접 검수(curated 등급 상향 + 속성 세밀화)가 다음 단계 작업

### 데이터 수집 파이프라인
```
네이버 블로그/카페 검색 API (49 + 추가 53 키워드)
    ↓ 카페명 추출 (regex 패턴)
네이버 지역 검색 API로 존재 확인 (708 후보 → 690 통과)
    ↓ 좌표(mapx/mapy) 취득
cafes.mock.ts 생성 + Supabase 적재
```

### Supabase 스키마 (3-table)
```sql
cafes            -- 기본 정보 (id, name, district, dong, address, lat, lng, ...)
cafe_attributes  -- 카공 속성 점수 (cafes 1:1, quietScore, outletScore, ...)
cafe_tags        -- 태그 (cafes 1:N, tag TEXT)
```
RLS: anon key → status='active' 행만 SELECT 가능

---

## 6. 로컬 저장소 구조 (localStorage)

| 키 | 내용 | 서비스 |
|----|------|--------|
| `kagong_anon_id` | 익명 사용자 UUID | userIdentityService |
| `kagong_events_{uid}` | 이벤트 로그 (최대 500건) | logService |
| `kagong_favorites` | 즐겨찾기 카페 ID 배열 | favoriteService |
| `kagong_recent_views` | 최근 본 카페 ID 배열 (최대 20건) | recentViewService |
| `kagong_courses` | 카공 코스 배열 | courseService |
| `kagong_suggestions` | 사용자 제안 목록 | suggestionService |
| `wifi_report_{cafeId}` | 와이파이 상태 제보 | wifiReportService |

---

## 7. 이벤트 로그 정의

총 **22종** 이벤트를 로컬에 수집. 추후 Supabase 또는 외부 분석 도구 연동 예정.

```
home_view, recommendation_requested, recommendation_result_view,
cafe_card_click, cafe_detail_view,
favorite_add, favorite_remove,
direction_click,
district_best_view, district_selected, dong_selected,
suggestion_submit,
location_permission_allow, location_permission_deny,
quick_preset_applied, wifi_reported,
theme_cafe_view, theme_tab_selected,
course_created, course_deleted, course_viewed,
course_cafe_added, course_cafe_removed
```

**공통 페이로드 필드**: cafeId, cafeDistrict, rank, radius, peopleType, mood, conditionCount, resultCount, district, dong, source  
※ 개인정보(위치 좌표, 주소, 전화번호) 미포함

---

## 8. 컴포넌트 목록

| 컴포넌트 | 역할 |
|----------|------|
| `CafeCard` | 카페 카드 (primary/secondary variant, 즐겨찾기 버튼, ScoreBar) |
| `FilterChip` | 토글형 조건 선택 칩 (그라디언트 선택 상태) |
| `TagBadge` | 카공 태그 컬러 배지 (10종 색상) |
| `ScoreBar` | 속성 점수 시각화 블록 (그라디언트 채움) |
| `VerificationBadge` | 검증 등급 배지 (curated/verified_basic/needs_recheck) |
| `StatusBadge` | 영업 상태 실시간 배지 (영업중/야간/마감) |
| `AttributeSummary` | 카페 속성 점수 전체 목록 (좋음/보통/낮음 배지) |
| `MiniMapPreview` | SVG 기반 좌표 미니맵 (사용자 위치 포함, 마커 클릭 가능) |
| `SearchInput` | 실시간 검색 입력창 |
| `RecommendationCriteria` | 추천 채점 기준 설명 (토글) |
| `EmptyState` | 결과 없음 상태 (아이콘 + 설명 + 액션 버튼) |
| `LoadingState` | 로딩 애니메이션 |
| `Toast` | 하단 피드백 토스트 (frosted glass, 2.5초 자동 퇴장) |
| `FaqItem` | FAQ 아코디언 아이템 |
| `RadiusSelector` | 반경 선택기 (FilterChip 래퍼) |

---

## 9. 디자인 시스템

### 컬러 토큰
```css
--color-brand:         #6b4226  /* 브랜드 갈색 */
--color-brand-dark:    #4e2e18
--color-brand-light:   #c9a97a
--color-accent:        #e07b2a  /* 강조 오렌지 */
--color-bg:            #f8f4f0  /* 따뜻한 아이보리 배경 */
--color-surface:       #ffffff
--color-text:          #1a0f08
--color-text-muted:    #7a6355
--color-text-subtle:   #a89080
```

### 그라디언트
```css
--gradient-hero:           #2d1506 → #6b4226 → #935c3a  /* 홈 히어로 */
--gradient-brand:          #4e2e18 → #7a4d2e              /* 선택 칩, 뱃지 */
--gradient-primary-btn:    #7a4d2e → #5c3218              /* 주 CTA 버튼 */
```

### 그림자 (elevation)
```
--shadow-xs     카드 기본
--shadow-sm     카드 호버
--shadow-md     패널
--shadow-lg     모달/오버레이
--shadow-brand  브랜드 색 버튼 그림자
```

### 인터랙션
- 카드 호버: `translateY(-2px)` + 상단 2px 컬러 바 출현
- 버튼 active: `scale(0.97~0.98)`
- 칩 선택: 그라디언트 배경 + 브랜드 그림자
- Sticky CTA: backdrop-filter blur(12px) frosted glass

---

## 10. 주요 유틸리티

| 유틸 | 역할 |
|------|------|
| `recommendation.ts` | 100점 채점 + TOP N 정렬 |
| `recommendationReason.ts` | 추천 이유 문장 생성 |
| `cafeHighlights.ts` | 카드 하이라이트 칩 생성 (조건 기반) |
| `searchCafes.ts` | 카페명/구/동/태그 복합 검색 |
| `distance.ts` | Haversine 거리 계산, 반경 필터 |
| `naverMap.ts` | 네이버 지도 검색 URL 생성 (카페명만) |
| `quickPresets.ts` | 빠른 선택 5종 프리셋 정의 |
| `safeStorage.ts` | localStorage try/catch 래퍼 |
| `scoreLabel.ts` | 점수 → 한국어 레이블 변환 |

---

## 11. 운영 스크립트 (scripts/)

| 스크립트 | 명령어 | 역할 |
|----------|--------|------|
| `collect-naver-candidates.ts` | `npm run collect:candidates` | 네이버 API로 후보 카페명 수집 |
| `verify-candidates.ts` | `npm run verify:candidates` | 지역 API로 후보 존재 확인 |
| `insert-candidates.ts` | `npm run insert:candidates` | Supabase raw_cafe_candidates 적재 |
| `expand-dataset-from-sns.ts` | `npm run expand:dataset` | SNS/블로그 기반 데이터셋 확장 (212→690) |
| `generate-mock-from-collected.ts` | `npm run generate:mock` | JSON → cafes.mock.ts 변환 |
| `insert-seed-cafes.ts` | `npm run insert:seed-cafes` | Supabase cafes 테이블 일괄 적재 |

---

## 12. 완성 수준 평가

### ✅ 완성된 부분 (MVP+)
- 위치 기반 카공 카페 추천 (100점 알고리즘)
- 인천 9개 구 690곳 데이터 (네이버 API 검증 완료)
- 구/동별 BEST 탐색 + 실시간 검색
- 카페 상세 (카공 적합도 요약, 와이파이 제보, 네이버 지도 연결)
- 즐겨찾기 / 최근 본 카페 / 카공 코스 (로컬 저장)
- 테마 카공 추천 4종 (운영자 큐레이션)
- 카페 제안하기 (신규/수정 두 모드)
- 관리자 제안 검토 화면
- 이벤트 로그 22종 (로컬 수집)
- 익명 사용자 ID (앱인토스 연동 준비)
- Supabase 연동 + Vercel 자동 배포
- 딥링크 진입점 4종
- 2025-2026 디자인 시스템 (다크 히어로, 그라디언트, Sticky CTA, Toast)

### 🔶 부분 완성 / 데이터 개선 필요
| 항목 | 현황 | 필요 작업 |
|------|------|-----------|
| 카페 속성 점수 | 전체 기본값 3/5 | 운영자 직접 검수·세밀화 |
| 검증 등급 | 전체 verified_basic | curated 등급 카페 선별 |
| 운영자 메모 | 일부만 작성 | 주요 카페 curatorNote 추가 |
| 어드민 화면 | localStorage 제안만 표시 | Supabase candidates 연동 |
| 이벤트 로그 | 로컬 저장만 | 외부 수집/분석 도구 연동 |

### ❌ 미구현 (Phase 2 이후)
- 지도 내장 (Naver/Kakao Map SDK)
- 실시간 혼잡도
- 도보/대중교통 ETA
- 개인화 추천 (히스토리 기반)
- 시간대별 추천
- 전국 서비스 확장

---

## 13. 앱인토스 제출 준비 현황

| 체크 항목 | 상태 |
|-----------|------|
| 외부 로그인 없음 | ✅ |
| 앱 내부 핵심 기능 완결 | ✅ |
| 외부 지도 링크 보조 기능으로 처리 | ✅ |
| WebView Safe Area 대응 | ✅ (env(safe-area-inset-*)) |
| Android 뒤로가기 대응 | ✅ (popstate + history) |
| 익명 식별 구조 준비 | ✅ (앱인토스 getAnonymousKey() 교체 지점 표시) |
| 딥링크 entry 파라미터 | ✅ (?entry=best/suggest/theme) |
| 개인정보 처리 방침 | ✅ (ServiceInfoPage + docs/privacy-policy-draft.md) |
| 실기기 WebView 테스트 | 🔶 필요 |
| 앱인토스 기능 등록 문서 | ✅ (docs/apps-in-toss-feature-entry.md) |

---

## 14. 다음 단계 우선순위

### 즉시 (앱인토스 제출 전)
1. **카페 속성 점수 검수** — 주요 카페 10~20곳 curated 등급 상향 + 점수 세밀화
2. **실기기 WebView 테스트** — Android/iOS에서 네이버 지도 링크, 위치 권한, 뒤로가기 검증
3. **앱인토스 연동 테스트** — getAnonymousKey() 교체 후 동작 확인

### 단기 (Phase B)
4. **이벤트 로그 외부 수집** — Supabase events 테이블 또는 외부 분석 도구 연동
5. **어드민 Supabase 연동** — raw_cafe_candidates 검토 화면
6. **카페 수 증가** — 검수 완료된 후보 추가 적재

### 중기 (Phase 2)
7. 지도 내장 (선택 카페 마커)
8. 도보 예상 시간
9. 개인화 추천 준비
