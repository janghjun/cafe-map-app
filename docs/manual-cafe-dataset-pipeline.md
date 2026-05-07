# 수동 카공 카페 데이터셋 파이프라인

> 수동 수집 인천 카공 카페 후보를 검증하고 서비스 반영 계획까지 만드는 전체 파이프라인입니다.  
> 이 파이프라인의 결과물은 즉시 서비스에 반영되지 않습니다.  
> **운영자가 최종 검수·승인한 후에만 실제 서비스 데이터에 반영됩니다.**

---

## 전체 실행 순서

```bash
# 1. 원본 JSON 로드 및 정규화
npm run load:manual-cafes -- --input incheon-kagong-manual-dataset.json

# 2. 기존 데이터와 중복 탐지
npm run detect:manual-duplicates

# 3. 네이버 지역 검색 API로 실존 검증 (API 키 필요)
export NAVER_CLIENT_ID=<your_client_id>
export NAVER_CLIENT_SECRET=<your_client_secret>
npm run verify:manual-cafes

# 4. 검증 통과 후보를 Cafe seed 형식으로 변환
npm run convert:manual-seed

# 5. 기존 데이터와 병합 계획 생성
npm run plan:manual-merge
```

---

## 단계별 입력·출력 파일

### Step 1 — 데이터 로드 (`load:manual-cafes`)

| 구분 | 파일 |
|---|---|
| **입력** | `incheon-kagong-manual-dataset.json` |
| **출력** | `data/manual/normalized-manual-kagong-cafes.json` |
| **출력** | `data/manual/manual-kagong-invalid-records.json` |

검증 기준:
- `name` 필드 필수 (없으면 invalid로 분리)
- `id` 없으면 `manual-gen-XXXX`로 자동 생성
- `suggestedScores` 없으면 기본값 3으로 보정
- `rawReviewMemo` 보관 (앱 노출 금지 표시)

---

### Step 2 — 중복 탐지 (`detect:manual-duplicates`)

| 구분 | 파일 |
|---|---|
| **입력** | `data/manual/normalized-manual-kagong-cafes.json` |
| **입력** | `src/data/cafes.mock.ts` (기존 690개 카페) |
| **출력** | `data/manual/manual-cafe-duplicate-report.json` |

중복 판단 기준:
- 카페명 bigram 유사도 ≥ 0.75 + district 일치 → `duplicate_candidate`
- 카페명 유사도 ≥ 0.45 → `ambiguous`
- 그 외 → `new_candidate`

---

### Step 3 — Naver API 검증 (`verify:manual-cafes`)

| 구분 | 파일 |
|---|---|
| **입력** | `data/manual/normalized-manual-kagong-cafes.json` |
| **출력** | `data/manual/verified-manual-kagong-cafes.json` |
| **출력** | `data/manual/manual-kagong-verification-report.json` |

검색 전략:
1. `{카페명} 인천` — 카페명만으로 검색 후 반환된 주소로 지역 검증
2. `{카페명}` — fallback

검증 결과:
| 상태 | 조건 |
|---|---|
| `verified_basic` | 이름 유사도×0.75 + 위치 점수×0.25 ≥ 0.65 |
| `ambiguous` | 종합 점수 0.45 ~ 0.65 |
| `not_found` | 종합 점수 < 0.45 |

저장 금지 필드: `description`(리뷰 발췌), `link`(블로그 URL)  
저장 허용 필드: `title`, `address`, `roadAddress`, `category`, `mapx`, `mapy`

---

### Step 4 — Seed 변환 (`convert:manual-seed`)

| 구분 | 파일 |
|---|---|
| **입력** | `data/manual/verified-manual-kagong-cafes.json` |
| **출력** | `data/manual/manual-cafe-seed-candidates.json` |

변환 규칙:
- `verificationStatus === "verified_basic"`인 항목만 처리
- `ambiguous`, `not_found` 항목은 제외
- `status: "pending"` (active 아님 — 운영자 승인 후 변경)
- `rawReviewMemo` seed에 포함 안 함
- `sourceScore`, `sourceRating`, `sourceReviewCount` seed에 포함 안 함
- 좌표 변환: `lat = parseInt(mapy) / 1e7`, `lng = parseInt(mapx) / 1e7`

---

### Step 5 — 병합 계획 생성 (`plan:manual-merge`)

| 구분 | 파일 |
|---|---|
| **입력** | `data/manual/manual-cafe-seed-candidates.json` |
| **입력** | `data/manual/manual-cafe-duplicate-report.json` |
| **입력** | `src/data/cafes.mock.ts` |
| **출력** | `data/manual/manual-cafe-merge-plan.json` |

병합 규칙:
| 구분 | 조건 |
|---|---|
| `add` | 중복 없는 신규 후보 |
| `update` | 기존 카페와 명확히 중복 (속성 점수 보완) |
| `skip` | 중복 불명확 or 기존 카페가 `curated` |

---

## 환경 변수 설정

네이버 개발자센터에서 검색 API 키를 발급받아 설정합니다.

```bash
# .env.local 파일에 추가 (git에 커밋하지 마세요)
NAVER_CLIENT_ID=<your_naver_client_id>
NAVER_CLIENT_SECRET=<your_naver_client_secret>

# 또는 스크립트 실행 전 export
export NAVER_CLIENT_ID=<your_naver_client_id>
export NAVER_CLIENT_SECRET=<your_naver_client_secret>
```

tsx 스크립트는 `.env.local`을 자동으로 읽지 않으므로 `export`로 직접 주입하거나  
`dotenv`를 사용해 환경 변수를 로드해야 합니다.

---

## 앱 노출 금지 필드

파이프라인 중간 파일에는 내부 검수용 데이터가 포함됩니다.  
아래 필드는 **앱 화면에 절대 노출하지 마세요.**

| 필드 | 이유 |
|---|---|
| `rawReviewMemo` | 외부 리뷰 원문 — 저작권·앱인토스 정책 리스크 |
| `sourceScore` | 외부 플랫폼 점수 |
| `sourceRating` | 외부 플랫폼 별점 |
| `sourceReviewCount` | 외부 리뷰 수 |

앱에 표시할 수 있는 문구: **`operatorSummaryDraft` → `summary` 필드만 사용**

---

## 실패 시 확인 항목

### `load:manual-cafes` 실패
- `incheon-kagong-manual-dataset.json` 파일이 프로젝트 루트에 있는지 확인
- `--input` 경로가 정확한지 확인
- JSON 형식이 올바른지 확인

### `detect:manual-duplicates` 실패
- `data/manual/normalized-manual-kagong-cafes.json`이 존재하는지 확인 (Step 1 먼저 실행)
- `src/data/cafes.mock.ts`에 `MOCK_CAFES` export가 있는지 확인

### `verify:manual-cafes` 실패
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 환경 변수 설정 여부 확인
- API 할당량 초과 여부 확인 (하루 25,000건 제한)
- 디스크 공간 부족 확인 (`ENOSPC` 오류 시)

### `convert:manual-seed` 실패
- `data/manual/verified-manual-kagong-cafes.json`이 존재하는지 확인 (Step 3 먼저 실행)

### `plan:manual-merge` 실패
- `data/manual/manual-cafe-seed-candidates.json`이 존재하는지 확인 (Step 4 먼저 실행)
- `data/manual/manual-cafe-duplicate-report.json`이 존재하는지 확인 (Step 2 먼저 실행)

---

## 운영자 최종 승인 절차

이 파이프라인은 **검증 계획을 만드는 도구**입니다.  
실제 서비스 반영은 아래 순서를 따릅니다.

1. `data/manual/manual-cafe-merge-plan.json` 열어 `add`/`update`/`skip` 목록 검토
2. 각 항목의 카페명·주소·운영자 요약을 직접 확인
3. 승인 항목을 `src/data/cafes.mock.ts`에 수동으로 반영
   - `add`: `MOCK_CAFES` 배열에 새 항목 추가 (`status: "active"`)
   - `update`: 기존 항목의 속성 점수·태그 수정
4. `verificationStatus: "curated"` 승격은 운영자 직접 확인 후에만 가능
5. `rawReviewMemo`, `sourceScore`, `sourceRating`, `sourceReviewCount`는 앱 노출 필드에 절대 포함 금지

---

## 현재 파이프라인 실행 결과 (2026-05-06 기준)

| 단계 | 결과 |
|---|---|
| 총 수동 수집 후보 | 65개 |
| 정규화 완료 | 65개 (무효: 0개) |
| 중복 탐지 | 신규 46 / 중복 12 / 모호 7 |
| Naver API 검증 | verified_basic 30 / ambiguous 24 / not_found 11 |
| Seed 변환 완료 | 30개 |
| 병합 계획 | add 14 / update 12 / skip 4 |
| ambiguous 수동 확인 필요 | 24개 |

> 검수 가이드는 `docs/manual-cafe-review-guide.md`를 참고하세요.
