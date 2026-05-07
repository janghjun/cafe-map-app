# 수동 수집 카페 후보 운영자 검수 가이드

> 이 문서는 `data/manual/manual-cafe-merge-plan.json`을 바탕으로  
> 수동 수집 카페 후보를 운영자가 검토·승인하는 방법을 설명합니다.

---

## 1. 검수 파일 위치

| 파일 | 설명 |
|---|---|
| `data/manual/manual-cafe-merge-plan.json` | 운영자 검수 주요 파일 — add/update/skip 목록 |
| `data/manual/verified-manual-kagong-cafes.json` | Naver API 검증 원본 (좌표·카테고리 포함) |
| `data/manual/manual-kagong-verification-report.json` | 검증 결과 요약 (신뢰도 점수) |
| `data/manual/manual-cafe-seed-candidates.json` | 서비스 반영 형태로 변환된 seed 후보 |

---

## 2. 병합 계획 구조

`manual-cafe-merge-plan.json`의 `plan` 항목은 세 가지로 나뉩니다.

### add — 신규 추가 후보
기존 690개 데이터에 없는 새 카페입니다.

```json
{
  "action": "add",
  "seed": { /* Cafe 구조와 동일한 필드 */ },
  "reason": "신규 후보 (중복 없음)"
}
```

검토 항목:
- `seed.name` — 카페명이 정확한지
- `seed.district` / `seed.dong` — 지역이 올바른지
- `seed.summary` — `operatorSummaryDraft` 기반. 앱에 표시될 문구. 직접 수정 가능
- `seed.verificationStatus` — `verified_basic` (Naver API 검증 통과)
- `seed.status` — 반드시 `pending` 상태. 운영자 승인 후 `active`로 변경

승인 방법:
1. `seed.status`를 `"pending"` → `"active"`로 변경
2. `src/data/cafes.mock.ts`의 `MOCK_CAFES` 배열에 직접 추가
3. 필요 시 `verificationStatus`를 `"curated"`로 승격 (운영자 직접 확인 후에만)

---

### update — 기존 카페 속성 업데이트
이미 등록된 카페에 수동 수집 속성 점수와 태그를 보완합니다.

```json
{
  "action": "update",
  "matchedCafeId": "...",
  "matchedCafeName": "...",
  "manualId": "manual-XXXX",
  "changes": {
    "summary": "운영자 요약 초안",
    "suggestedScores": { "quietScore": 4, "outletScore": 5, ... },
    "suggestedTags": ["outlet", "quiet", "solo"],
    "manualBoostEligible": true,
    "manualPriority": "high",
    "manualSourceId": "manual-XXXX"
  },
  "reason": "..."
}
```

검토 항목:
- `matchedCafeName`이 실제 같은 카페인지 확인
- `changes.suggestedScores`가 실제 카공 환경에 부합하는지 확인
- `changes.summary`를 기존 summary 대신 사용할지 판단

승인 방법:
1. `cafes.mock.ts`에서 `matchedCafeId`로 해당 카페를 찾아 직접 수정
2. `manualBoostEligible: true`, `manualPriority`, `manualSourceId`, `studySignals`, `suggestedTags` 필드 추가
3. 속성 점수 변경 시 `attributes` 오브젝트를 `suggestedScores` 기준으로 업데이트

---

### skip — 건너뜀 (수동 확인 필요)
중복 여부가 불확실하거나 검증이 실패한 항목입니다.

```json
{
  "action": "skip",
  "manualId": "manual-XXXX",
  "manualName": "카페명",
  "reason": "모호한 중복 (유사도 XX%) — 운영자 직접 확인 필요"
}
```

처리 방법:
- 실제 카페를 검색해 기존 데이터와 동일한지 직접 확인
- 동일하면 `update` 방식으로 수동 처리
- 다른 카페면 `add` 방식으로 신규 등록

---

## 3. 앱 노출 금지 필드

다음 필드는 **어떤 경우에도 앱 화면에 노출하면 안 됩니다.**

| 필드 | 이유 |
|---|---|
| `rawReviewMemo` | 외부 리뷰 원문 — 저작권·약관 리스크 |
| `sourceScore` | 외부 플랫폼 점수 — 복제 금지 |
| `sourceRating` | 외부 플랫폼 별점 — 복제 금지 |
| `sourceReviewCount` | 외부 리뷰 수 — 복제 금지 |

앱에 표시할 수 있는 문구는 `operatorSummaryDraft`(→ `summary` 필드)만입니다.

---

## 4. curated 승격 기준

`verificationStatus: "verified_basic"` → `"curated"` 승격은 아래 조건을 모두 만족할 때만 허용합니다.

- 운영자가 직접 해당 카페를 방문하거나 전화로 확인
- 카공 속성 점수를 직접 검수
- `summary` 문구를 직접 검토·수정

자동 스크립트로 curated 처리하지 마세요.

---

## 5. 추천 가산점 (manualBoost)

승인 후 `manualBoostEligible: true`가 설정된 카페는 추천·검색·BEST 랭킹에서 자동으로 가산점을 받습니다.

| 조건 | 가산점 |
|---|---|
| `verified_basic` 상태 | +2점 |
| `manualPriority: "high"` | +1점 |
| 카공 시그널+태그 ≥ 7개 | +2점 |
| 카공 시그널+태그 ≥ 3개 | +1점 |
| **최대** | **5점** |

> `sourceRating`, `sourceScore`, `sourceReviewCount`는 가산점 계산에 사용하지 않습니다.

---

## 6. ambiguous 후보 수동 검증

`data/manual/manual-kagong-verification-report.json`에서 `verificationStatus: "ambiguous"` 항목을 확인하세요.  
24개의 ambiguous 후보는 Naver API 신뢰도가 0.45~0.65 사이로 자동 판단이 어렵습니다.

처리 방법:
1. `verifiedName`과 `verifiedAddress`를 네이버 지도에서 직접 확인
2. 실존하는 카페면 `verificationStatus`를 `"verified_basic"`으로 수동 변경 후 seed 변환 재실행
3. 없는 카페면 `"not_found"`로 표시

재실행 명령:
```bash
npm run convert:manual-seed
npm run plan:manual-merge
```
