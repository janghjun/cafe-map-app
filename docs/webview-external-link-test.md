# WebView 외부 링크 테스트 체크리스트

> Step 12-2 구현 후 실기기 검증이 필요한 항목  
> 외부 링크 = "네이버 지도에서 보기" 버튼 (`CafeDetailPage`)

---

## 현재 구현 방식

```
cafe.naverMapUrl 존재
  → 해당 URL 그대로 사용 (직접 링크)

cafe.naverMapUrl 없음
  → https://map.naver.com/v5/search/{encodeURIComponent(카페명 + 주소)} 생성

<a href={mapUrl} target="_blank" rel="noopener noreferrer">
  네이버 지도에서 보기
</a>
```

**로그:** `direction_click` 이벤트에 `cafeId`, `cafeDistrict`, `source("direct"|"search")` 만 기록  
좌표(lat/lng), 주소, 전화번호는 로그에 포함되지 않습니다.

---

## 브라우저에서 확인 가능한 항목

| # | 확인 항목 | 기대 결과 | 확인 |
|---|---|---|---|
| B-1 | 한글 카페명이 포함된 카페 상세 → "네이버 지도에서 보기" 클릭 | URL이 정상적으로 인코딩되어 네이버 지도 탭이 열림 | |
| B-2 | `naverMapUrl`이 있는 카페 상세 | mock 데이터의 URL로 이동 (검색 URL 생성 없음) | |
| B-3 | `naverMapUrl`이 없는 카페 상세 (mock에 없음 — 임시 제거 테스트) | `이름+주소` 검색 URL로 네이버 지도 이동 | |
| B-4 | `rel="noopener noreferrer"` 속성 존재 여부 | 개발자도구 Elements 탭에서 확인 | |
| B-5 | 버튼 문구 | "네이버 지도에서 보기" 로 표시 | |
| B-6 | `direction_click` 로그에 민감 정보 없음 | 개발자도구 Console에서 `[log] direction_click` 페이로드 확인 — lat/lng/address 없음 | |

---

## 앱인토스 Android WebView 실기기 확인 항목

| # | 확인 항목 | 중요도 | 비고 |
|---|---|---|---|
| A-1 | `target="_blank"` 링크가 WebView 외부(시스템 브라우저 또는 네이버 지도 앱)로 열리는지 | **필수** | WebView 내부에서 열리면 앱을 벗어날 수 없게 됨 |
| A-2 | 링크 클릭 후 앱으로 복귀(백 버튼)가 가능한지 | **필수** | 시스템 브라우저가 열렸다면 복귀 가능해야 함 |
| A-3 | 한글이 포함된 검색 URL이 깨지지 않고 네이버 지도에서 올바른 결과를 보여주는지 | 권장 | `encodeURIComponent` 처리 검증 |
| A-4 | iOS Safari WebView에서도 동일하게 동작하는지 | 권장 | |

---

## A-1이 실패하는 경우 (링크가 WebView 내부에서 열림) 대응 방안

**증상**: "네이버 지도에서 보기" 클릭 시 WebView 안에서 네이버 지도가 열려 앱으로 돌아올 수 없음

**대응 옵션:**

1. **앱인토스 브리지 API 확인**: 외부 URL 열기 전용 브리지 API가 있는지 확인
   ```ts
   // 브리지 API 있는 경우 예시 (앱인토스 문서 확인 필요)
   // window.Toss?.openExternalUrl(mapUrl)
   ```

2. **`window.open()` 교체**: 일부 WebView에서 `<a target="_blank">` 대신 `window.open(url, "_blank")`가 외부 브라우저를 여는 경우가 있음
   ```tsx
   // CafeDetailPage.tsx 수정 예시
   <button onClick={() => { window.open(mapUrl, "_blank"); }}>
     네이버 지도에서 보기
   </button>
   ```

3. **`target="_self"` 비권장**: 현재 WebView 내에서 네이버 지도를 열어 앱으로 복귀가 어려움

---

## 현재 정책 요약

| 항목 | 현재 상태 |
|---|---|
| 외부 링크 방식 | `<a target="_blank" rel="noopener noreferrer">` |
| URL 인코딩 | `encodeURIComponent` 적용 |
| 앱 스킴 (nmap://) | 제거됨 |
| 길찾기 API | 미사용 |
| 로그 개인정보 | lat/lng/address 미포함 확인 |
| 버튼 문구 | "네이버 지도에서 보기" |
| 링크 강조 여부 | 보조 기능으로 위치 (저장하기 버튼과 동등 레벨) |
