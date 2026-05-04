# 앱인토스 getAnonymousKey 연동 계획

> **작성일**: 2026-04-30  
> **현재 상태**: 로컬 익명 ID 구현 완료 (`src/services/userIdentityService.ts`)  
> **실제 SDK 연동**: 미구현 — 이 문서는 연동 계획 설계안입니다.

---

## 1. 현재 로컬 익명 ID 구조

### 생성 위치

`src/services/userIdentityService.ts`

### 동작 방식

| 함수 | 역할 |
|---|---|
| `getAnonymousUserId()` | 현재 세션의 익명 ID 반환. 없으면 새로 생성 |
| `getLocalAnonymousUserId()` | localStorage에서 ID 읽기만 수행 |
| `setLocalAnonymousUserId(id)` | localStorage에 ID 저장 |
| `clearLocalAnonymousUserId()` | localStorage에서 ID 삭제 |

### localStorage 키

```
kagong_anon_id           → 익명 ID 자체
kagong_favorites_<id>    → 사용자별 즐겨찾기
kagong_recent_views_<id> → 사용자별 최근 본 카페
kagong_events_<id>       → 사용자별 이벤트 로그
```

### ID 생성 알고리즘

- `crypto.randomUUID()` 우선 (iOS 14.1+, Chrome 92+, Android WebView 지원)
- 미지원 환경에서는 수동 UUID v4 fallback

---

## 2. 앱인토스 getAnonymousKey 연동 예상 위치

### 연동 대상 파일

`src/services/userIdentityService.ts` — `getAnonymousUserId()` 함수 내부

### 현재 코드 구조

```ts
export function getAnonymousUserId(): string {
  const existing = getLocalAnonymousUserId();
  if (existing) return existing;

  const newId = generateId();
  setLocalAnonymousUserId(newId);
  return newId;
}
```

### 연동 후 예상 구조 (동기 또는 비동기 분기)

```ts
// 동기 브리지를 제공하는 경우 (예: window.__apptoss.getAnonymousKeySync)
export function getAnonymousUserId(): string {
  const tossKey = window.__apptoss?.getAnonymousKeySync?.();
  if (tossKey) return tossKey;
  return getLocalAnonymousUserId() ?? (() => {
    const id = generateId();
    setLocalAnonymousUserId(id);
    return id;
  })();
}

// 비동기 브리지를 제공하는 경우 (예: window.__apptoss.getAnonymousKey())
// getAnonymousUserId를 async로 전환하고 호출 지점을 App.tsx useEffect에서 처리
```

> **앱인토스 실기기 확인 필요**: getAnonymousKey가 동기인지 비동기인지 파트너 포털에서 확인하세요.

### 영향 범위

앱인토스 연동 시 변경이 필요한 파일:

| 파일 | 변경 내용 |
|---|---|
| `src/services/userIdentityService.ts` | `getAnonymousUserId()` 내부에 SDK 호출 추가 |
| `src/app/App.tsx` | 비동기 브리지인 경우 마운트 시 ID 초기화 useEffect 추가 |

다른 서비스 파일(`favoriteService`, `recentViewService`, `logService`)은 `getAnonymousUserId()`를 호출할 뿐이므로 **변경 불필요**합니다.

---

## 3. 실패 시 local ID fallback 정책

| 상황 | 동작 |
|---|---|
| 앱인토스 WebView가 아닌 환경 (브라우저 테스트) | 로컬 UUID 생성 및 사용 |
| getAnonymousKey 호출 실패 / 타임아웃 | 로컬 UUID로 fallback |
| getAnonymousKey 반환값이 null / undefined | 로컬 UUID로 fallback |
| localStorage 접근 불가 | 메모리 내 임시 ID 사용 (재시작 시 새 ID) |

fallback 발생 여부를 알기 위한 `source: "apptoss" | "local"` 필드가 `AnonUser` 타입에 이미 설계되어 있습니다. 연동 시 이를 기록해 두면 운영 지표 구분에 활용할 수 있습니다.

---

## 4. 기존 localStorage 데이터 migration 정책

### 현재 적용 중인 migration 규칙 (Step 14-2에서 구현)

이미 로컬 ID가 부여된 후에는 `kagong_favorites_<id>` 형태의 키를 사용합니다.

**레거시 키 처리 순서:**

```
1. 사용자 키(kagong_favorites_<id>)에 데이터 있음
   → 그대로 사용 (migration 완료 상태)

2. 사용자 키에 데이터 없음 + 레거시 키(kagong_favorites)에 데이터 있음
   → 레거시 데이터를 사용자 키로 복사 후 반환
   → 레거시 키는 삭제하지 않음 (안전 보존)

3. 둘 다 없음
   → 빈 배열 반환
```

### 앱인토스 연동 시 추가 migration 검토 사항

앱인토스 getAnonymousKey가 로컬 UUID와 다른 ID를 반환하는 경우, 기존 로컬 UUID로 저장된 데이터(`kagong_favorites_<local-uuid>`)가 새 ID(`kagong_favorites_<toss-id>`)와 분리됩니다.

이 경우 아래 두 가지 방안 중 하나를 선택합니다.

| 방안 | 설명 | 권장 상황 |
|---|---|---|
| A. 로컬 데이터 이전 | 앱인토스 ID 첫 취득 시 로컬 UUID 기반 데이터를 이전 | 기존 사용자 경험 보존 중요 |
| B. 신규 시작 | 로컬 데이터는 그대로 두고 앱인토스 ID로 새로 시작 | 단순성 우선 |

> **현재 판단 보류**: 앱인토스 getAnonymousKey의 ID 지속성(재설치 후에도 같은 키인지)이 확인되어야 결정 가능합니다.

---

## 5. 개인정보 보호 원칙

| 항목 | 현재 구현 |
|---|---|
| 익명 ID에 이름/이메일/전화번호 포함 여부 | ❌ UUID만 저장 |
| 위치 좌표 로그 저장 여부 | ❌ payload에 lat/lng 필드 없음 |
| 외부 서버 전송 여부 | ❌ localStorage에만 저장 |
| 익명 ID UI 노출 여부 | ❌ `_uid` 필드는 LogEvent 내부 전용 |
| 개인식별 가능 정보 포함 여부 | ❌ 카페 ID/구/동 등 비식별 정보만 |

---

## 6. 확인 필요 항목

| # | 항목 | 확인 방법 |
|---|---|---|
| A-1 | getAnonymousKey API 존재 여부 및 메서드명 | 앱인토스 파트너 포털 |
| A-2 | 동기/비동기 여부 | 파트너 포털 |
| A-3 | 반환 ID의 형식 (UUID, 자체 포맷 등) | 파트너 포털 |
| A-4 | 재설치 후 같은 ID가 반환되는지 여부 | 실기기 테스트 |
| A-5 | WebView 환경이 아닐 때 getAnonymousKey 호출 결과 | 실기기 테스트 |

---

## 7. 테스트 항목

| # | 항목 | 방법 |
|---|---|---|
| T-1 | getAnonymousUserId 최초 호출 시 UUID 생성 | DevTools → localStorage → `kagong_anon_id` 확인 |
| T-2 | 재로드 후 동일 ID 반환 | 새로고침 후 콘솔에서 `getAnonymousUserId()` 재호출 |
| T-3 | 레거시 즐겨찾기 migration | `kagong_favorites`에 수동 저장 후 앱 로드 → 즐겨찾기 탭 확인 |
| T-4 | 새 즐겨찾기 사용자 키 저장 | 즐겨찾기 추가 후 `kagong_favorites_<id>` 키 생성 확인 |
| T-5 | 로그 payload에 민감정보 없음 | DevTools → localStorage → `kagong_events_<id>` 내 payload 확인 |
| T-6 | clearLocalAnonymousUserId 후 새 ID 생성 | 삭제 후 재호출 → 다른 UUID 생성 확인 |

---

## 8. 다음 Step 제안

| Step | 작업 |
|---|---|
| 14-4 | Supabase 프로젝트 생성 및 schema 적용 |
| 14-5 | seed 스크립트 작성 및 실행 |
| 14-6 | `VITE_DATA_SOURCE=supabase` 전환 테스트 |
| 14-7 | 앱인토스 실기기에서 getAnonymousKey 확인 후 연동 |
