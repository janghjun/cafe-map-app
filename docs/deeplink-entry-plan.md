# 딥링크 `?entry=` 구현 계획

## 지원 entry 목록

| URL | 진입 화면 | 앱인토스 기능 등록 용도 |
|-----|----------|----------------------|
| `/` | 홈 (기본) | 메인 앱 진입 |
| `/?entry=best` | 인천 BEST (DistrictBestPage) | 구/동별 카페 탐색 |
| `/?entry=suggest` | 카페 제안 (SuggestCafePage) | 카페 제안하기 |
| `/?entry=theme` | 테마 카페 (ThemeCafesPage) | 테마별 카페 탐색 |
| `/?entry=<기타>` | 홈 (fallback) | — |

## 구현 방식

- React Router 없이 `navStack` 배열에 초기값을 주입하는 방식
- `INITIAL_NAV = parseEntryNav()` 를 모듈 레벨에서 한 번만 실행
- 딥링크 진입 시 navStack은 `[home, <target>]` 2개 프레임으로 시작 → 뒤로가기 시 홈으로 복귀
- mount 효과에서 extra 프레임 수만큼 `history.pushState` 호출 → Android 하드웨어 뒤로가기 동작 보장

## fallback 정책

- `?entry=` 값이 없거나 알 수 없는 값이면 홈으로 이동
- `?mode=admin`과 동시에 사용 시 admin 모드가 우선 적용 (navStack과 무관하게 early return)

## 앱인토스 기능 등록 시 사용 URL

앱인토스 Mini App 기능 등록 화면에서 각 진입점 URL을 아래와 같이 설정합니다.

```
메인     : https://<your-domain>/
인천BEST : https://<your-domain>/?entry=best
카페제안 : https://<your-domain>/?entry=suggest
테마카페 : https://<your-domain>/?entry=theme
```

## 테스트 방법

| 테스트 케이스 | 예상 결과 |
|-------------|----------|
| `/` | HomePage |
| `/?entry=best` | DistrictBestPage, 뒤로가기 → HomePage |
| `/?entry=suggest` | SuggestCafePage, 뒤로가기 → HomePage |
| `/?entry=theme` | ThemeCafesPage, 뒤로가기 → HomePage |
| `/?entry=unknown` | HomePage (fallback) |
| `/?mode=admin` | AdminLoginPage (entry 무시) |

## 변경 파일

- `src/app/App.tsx` — `parseEntryNav()` + `INITIAL_NAV` 추가, `useState` 초기값 변경, mount effect에 history push 추가

## TODO

- 앱인토스 실기기에서 `?entry=` URL 진입 후 뒤로가기 동작 확인 필요
- 앱인토스가 URL 파라미터를 유지하는지 여부 확인 필요 (WebView 브릿지 방식에 따라 다를 수 있음)
