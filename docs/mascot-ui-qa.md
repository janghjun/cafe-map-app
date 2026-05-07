# 카공냥 UI 적용 QA 문서

## QA 요약

- 적용 화면: 7개 (HomePage, LoadingState, RecommendationPage, EmptyState 4곳, CafeDetailPage, ThemeCafesPage)
- 빌드 결과: ✅ 통과 (타입 에러 0, 빌드 에러 0)
- 1화면 1캐릭터 원칙: ✅ 준수

---

## 화면별 적용 상태

| 화면 | 적용 이미지 | 위치 | 상태 |
|---|---|---|---|
| HomePage hero | `heroMain` | 텍스트 우측 하단, absolute 없음 flex 배치 | ✅ 적용 |
| LoadingState | `searching` | 메시지 위 중앙 | ✅ 적용 |
| RecommendationPage 운영자 추천 | `sitting` | 섹션 레이블 우측 | ✅ 적용 |
| RecommendationPage 조건 추천 | `thinking` | 섹션 레이블 우측 | ✅ 적용 |
| RecommendationPage 결과 없음 | `warning` | EmptyState 중앙 (lg) | ✅ 적용 |
| FavoritesPage 빈 상태 | `emptyFavorite` | EmptyState 중앙 (md) | ✅ 적용 |
| FavoritesPage 코스 빈 상태 | `emptyCourse` | EmptyState 중앙 (md) | ✅ 적용 |
| RecentViewsPage 빈 상태 | `emptyResult` | EmptyState 중앙 (md) | ✅ 적용 |
| CafeDetailPage 카공 적합도 | `laptop` | 섹션 레이블 우측 | ✅ 적용 |
| CafeDetailPage 와이파이 | `wifi` | 섹션 레이블 우측 (wifiScore≥4 조건부) | ✅ 적용 |
| ThemeCafesPage 이번 주 추천 | `checking` | 탭 설명 우측 | ✅ 적용 |
| ThemeCafesPage 야간 카공 | `night` | 탭 설명 우측 | ✅ 적용 |
| ThemeCafesPage 팀플 카페 | `thinking` | 탭 설명 우측 | ✅ 적용 |
| DistrictBestPage | — | 미적용 (구/동 탐색 맥락, 현재 불필요) | ⬜ 생략 |
| CafeDetailPage 콘센트 전용 | `power` | 미적용 (콘센트 태그 카드 과밀 우려) | ⬜ 생략 |

---

## 접근성 점검

| 항목 | 결과 |
|---|---|
| 장식 이미지 `aria-hidden="true"` 처리 | ✅ decorative=true 시 자동 처리 |
| 정보 이미지 alt 텍스트 존재 | ✅ mascotAltMap 사용 |
| 빈 alt 처리 (`decorative=false`인데 alt 없음) | ✅ 해당 없음 |
| 버튼 내부에 캐릭터 삽입 | ✅ 없음 |

---

## 모바일 점검 (빌드 기준)

| 항목 | 결과 |
|---|---|
| 360px hero에서 텍스트 가림 여부 | 확인 필요 — hero에 flex+`clamp` 적용했으나 직접 확인 권장 |
| EmptyState CTA 버튼 겹침 여부 | ✅ 이미지 위에 텍스트, CTA 아래 배치 |
| 카드 정보 가독성 | ✅ 카드 내 캐릭터 미삽입 |
| 섹션 헤더 캐릭터 overflow | 확인 필요 — sm(56px) 크기, flexbox justify-between |

---

## Must (즉시 조치 필요)

- [ ] 360px viewport에서 HomePage hero 텍스트 가림 여부 직접 확인
- [ ] PNG 이미지 용량 최적화 (현재 최대 1.2MB) — 앱인토스 심사 전 WebP 변환 권장

## Should (권장 개선)

- [ ] 이미지 lazy loading 또는 dynamic import 적용 (현재 전부 번들 포함)
- [ ] `img/cafe-app-firmly-img.png` → icon/seat 용도 확정 후 추가
- [ ] CafeDetailPage 콘센트 섹션에 `power` 이미지 적용 여부 최종 결정

## Later (추후 고려)

- [ ] 카공냥 애니메이션 (CSS keyframe fade-in)
- [ ] heroMain 이외 추가 hero 이미지 (`map`) 활용 방안
- [ ] 검수 완료 후 `img/` 원본 폴더 정리

---

## Phase 18 앱인토스 제출 반영 문구

> 카공냥은 인천 카공 카페 탐색을 돕는 서비스 마스코트로, 추천 상태·빈 상태·로딩 상태에 맥락에 맞는 이미지로 삽입되어 있습니다.
> 모든 카공냥 이미지는 `aria-hidden` 또는 적절한 alt 텍스트 처리가 되어 있습니다.
