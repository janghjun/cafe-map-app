# Supabase RLS (Row Level Security) 적용 계획

> **작성일**: 2026-04-29  
> **적용 시점**: MVP+ 이후 (현재 RLS 비활성화 상태)  
> **현재 상태**: `supabase-schema.sql`의 RLS 블록은 모두 주석 처리되어 있음

---

## 테이블별 정책 요약

| 테이블 | 익명 사용자 | 인증 사용자 | 운영자 |
|---|---|---|---|
| `cafes` | active 행 SELECT | active 행 SELECT | 전체 |
| `cafe_attributes` | cafes 연동 SELECT | cafes 연동 SELECT | 전체 |
| `cafe_tags` | cafes 연동 SELECT | cafes 연동 SELECT | 전체 |
| `favorites` | 자신의 anon_key 행 전체 | 자신의 행 전체 | 전체 |
| `recent_views` | 자신의 anon_key 행 전체 | 자신의 행 전체 | 전체 |
| `filter_logs` | INSERT만 | INSERT만 | 전체 |
| `district_best_rankings` | SELECT | SELECT | 전체 |
| `user_suggestions` | INSERT만 | INSERT만 | 전체 |
| `raw_cafe_candidates` | 접근 불가 | 접근 불가 | 전체 |
| `wifi_reports` | INSERT만 / 자신의 행 SELECT | INSERT만 / 자신의 행 SELECT | 전체 |
| `cafe_themes` | is_active=true SELECT | is_active=true SELECT | 전체 |
| `cafe_theme_picks` | 활성 테마 SELECT | 활성 테마 SELECT | 전체 |
| `place_verifications` | 접근 불가 | 접근 불가 | 전체 |

---

## 정책 상세

### 1. cafes / cafe_attributes / cafe_tags

공개 읽기 — `status = 'active'` 조건 필터.

```sql
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_cafes" ON cafes
  FOR SELECT USING (status = 'active');

ALTER TABLE cafe_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_cafe_attributes" ON cafe_attributes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cafes WHERE id = cafe_id AND status = 'active')
  );

ALTER TABLE cafe_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_cafe_tags" ON cafe_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cafes WHERE id = cafe_id AND status = 'active')
  );
```

### 2. favorites / recent_views

익명 식별키(`anon_key`) 기반 자기 데이터 격리.

앱인토스 익명 식별키 연동 전까지는 클라이언트에서 UUID를 생성해 localStorage에 보관하고
`app.current_anon_key` 세션 변수로 전달하는 방식을 사용합니다.

```sql
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_favorites" ON favorites
  FOR ALL USING (anon_key = current_setting('app.current_anon_key', true));

ALTER TABLE recent_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_recent_views" ON recent_views
  FOR ALL USING (anon_key = current_setting('app.current_anon_key', true));
```

> **Phase 14 TODO**: 앱인토스 익명 식별키 연동 후 `anon_key` 설정 방식을 재검토합니다.

### 3. filter_logs

쓰기 전용 — 사용자는 INSERT만 가능, 조회는 운영자만.

```sql
ALTER TABLE filter_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_logs" ON filter_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_logs" ON filter_logs
  FOR SELECT USING (current_setting('app.role', true) = 'admin');
```

### 4. district_best_rankings

완전 공개 읽기.

```sql
ALTER TABLE district_best_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_rankings" ON district_best_rankings
  FOR SELECT USING (true);
```

### 5. user_suggestions

제출만 가능, 결과 조회 불가.

```sql
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_suggestion" ON user_suggestions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_suggestion" ON user_suggestions
  FOR SELECT USING (current_setting('app.role', true) = 'admin');
```

### 6. raw_cafe_candidates

운영자 전용 — 일반 사용자 접근 차단.

```sql
ALTER TABLE raw_cafe_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only" ON raw_cafe_candidates
  FOR ALL USING (current_setting('app.role', true) = 'admin');
```

### 7. wifi_reports

제출은 누구나, 자신의 제보만 조회 가능. 전체 집계는 service_role로 처리.

```sql
ALTER TABLE wifi_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_wifi_report" ON wifi_reports
  FOR INSERT WITH CHECK (true);
CREATE POLICY "own_wifi_report" ON wifi_reports
  FOR SELECT USING (anon_key = current_setting('app.current_anon_key', true));
```

### 8. cafe_themes / cafe_theme_picks

활성 테마만 공개 읽기. 수정은 운영자만.

```sql
ALTER TABLE cafe_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_themes" ON cafe_themes
  FOR SELECT USING (is_active = true);

ALTER TABLE cafe_theme_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_theme_picks" ON cafe_theme_picks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cafe_themes WHERE id = theme_id AND is_active = true)
  );
```

### 9. place_verifications

운영자 전용 — 일반 사용자 접근 차단.

```sql
ALTER TABLE place_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_verifications" ON place_verifications
  FOR ALL USING (current_setting('app.role', true) = 'admin');
```

---

## 적용 전 확인 사항

| # | 항목 |
|---|---|
| R-1 | Supabase anon key로 RLS 우회 불가 여부 검증 |
| R-2 | `current_setting('app.current_anon_key', true)` 전달 방식 결정 (JWT claim vs custom header) |
| R-3 | 운영자 역할 부여 방식 결정 (Supabase Auth role vs service_role key) |
| R-4 | `filter_logs` INSERT 페이로드에 개인정보(좌표, 주소 등) 포함 여부 최종 확인 |

---

## 적용 순서 (제안)

1. `cafes`, `cafe_attributes`, `cafe_tags` — 가장 먼저 적용 (단순 읽기 필터)
2. `district_best_rankings` — 완전 공개이므로 동시에 적용 가능
3. `filter_logs` — INSERT 정책은 간단하므로 조기 적용 가능
4. `user_suggestions` — 제출 기능 Supabase 전환 시 함께 적용
5. `favorites`, `recent_views` — anon_key 전달 방식 확정 후 적용
6. `raw_cafe_candidates` — 운영자 페이지 구현 시 적용
