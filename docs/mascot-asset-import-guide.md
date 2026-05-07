# 카공냥 Asset 정리 가이드

## 원본 → 최종 파일 매핑

| 원본 파일명 | 최종 경로 | 사용 화면 | 상태 |
|---|---|---|---|
| `img/cafe-app-searching-img.png` | `state/kagongnyang-searching.png` | LoadingState | 적용 완료 |
| `img/cafe-app-sitting-img.png` | `state/kagongnyang-sitting.png` | 추천 결과 운영자 추천 섹션 | 적용 완료 |
| `img/cafe-app-thinking-img.png` | `state/kagongnyang-thinking.png` | 추천 결과 조건 기반 섹션 | 적용 완료 |
| `img/cafe-app-warning-img.png` | `state/kagongnyang-warning.png` | EmptyState (추천 결과 없음) | 적용 완료 |
| `img/cafe-app-night-img.png` | `state/kagongnyang-night.png` | ThemeCafesPage 야간 탭 | 적용 완료 |
| `img/cafe-app-power-img.png` | `feature/kagongnyang-power.png` | CafeDetailPage 콘센트 섹션 | 적용 완료 |
| `img/cafe-app-wifi-img.png` | `feature/kagongnyang-wifi.png` | CafeDetailPage 와이파이 섹션 | 적용 완료 |
| `img/cafe-app-checking-img.png` | `feature/kagongnyang-checking.png` | ThemeCafesPage 이번 주 추천 탭 | 적용 완료 |
| `img/cafe-app-map-img.png` | `feature/kagongnyang-map.png` | HomePage hero (보조) | 적용 완료 |
| `img/cafe-app-looking-img.png` | `feature/kagongnyang-laptop.png` | CafeDetailPage 카공 적합도 섹션 | 적용 완료 |
| `img/cafe-app-sitting main-img.png` | `hero/kagongnyang-hero-main.png` | HomePage hero 메인 | 적용 완료 |
| `img/cafe-app-enjoying-img.png` | `empty/kagongnyang-empty-favorite.png` | FavoritesPage 빈 상태 | 적용 완료 |
| `img/cafe-app-standing-img.png` | `empty/kagongnyang-empty-course.png` | Course 빈 상태 | 적용 완료 |
| `img/cafe-app-slightly-img.png` | `empty/kagongnyang-empty-result.png` | RecentViewsPage 빈 상태 | 적용 완료 |

## 보류 파일 목록

아래 파일은 의미 중복 가능성이 있어 코드에서 import하지 않습니다.

| 보류 파일명 | 보류 이유 | 추후 재분류 후보 |
|---|---|---|
| `img/cafe-app-firmly-img.png` | seatIcon 후보, 별도 확정 필요 | `icon/kagongnyang-seat.png` |
| `img/cafe-app-folded-img.png` | checking 대체 후보 | `feature/kagongnyang-checking.png` 교체용 |
| `img/cafe-app-checklist-img.png` | checking 대체 후보 | `feature/kagongnyang-checking.png` 교체용 |
| `img/cafe-app-sniffing-img.png` | searching 대체 후보 | `state/kagongnyang-searching.png` 교체용 |

## 추후 삭제 가능 여부

- `img/` 원본 폴더는 모든 화면 적용 완료 및 QA 통과 후 삭제 가능합니다.
- 보류 파일 4개는 추후 결정 후 삭제 또는 편입합니다.
