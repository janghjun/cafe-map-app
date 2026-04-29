-- ================================================================
-- 카공 어디가? 인천편 — Supabase PostgreSQL 스키마 초안
-- 작성일: 2026-04-28
-- ================================================================
-- 주의: 이 파일은 설계 문서입니다. 직접 실행 전 검수/수정 후
--       Supabase 대시보드 또는 마이그레이션 도구로 적용하세요.
-- ================================================================

-- ----------------------------------------------------------------
-- 확장: gen_random_uuid() — Supabase에서 기본 활성화됨
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- 헬퍼: updated_at 자동 갱신 트리거 함수
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- 1. cafes — 카페 기본 정보
--    TypeScript: src/types/cafe.ts `Cafe`
-- ================================================================
CREATE TABLE cafes (
  id                  UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT             NOT NULL,
  district            TEXT             NOT NULL,     -- 구 (예: 연수구)
  dong                TEXT             NOT NULL,     -- 동 (예: 송도동)
  address             TEXT             NOT NULL,
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  phone               TEXT,
  summary             TEXT,                          -- 한 줄 요약
  open_hours_summary  TEXT,                          -- 영업시간 요약 문자열
  is_24_hours         BOOLEAN          NOT NULL DEFAULT false,
  naver_map_url       TEXT,
  status              TEXT             NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('active', 'pending', 'closed')),
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_cafes_status   ON cafes (status);
CREATE INDEX idx_cafes_district ON cafes (district);
CREATE INDEX idx_cafes_dong     ON cafes (district, dong);

-- TODO: RLS — 일반 사용자는 status='active' 행만 SELECT 가능
-- ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "active_cafes_read" ON cafes
--   FOR SELECT USING (status = 'active');

CREATE TRIGGER set_cafes_updated_at
  BEFORE UPDATE ON cafes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ================================================================
-- 2. cafe_attributes — 카공 적합도 점수 (cafes 1:1)
--    TypeScript: `CafeAttributes` (0–5 척도)
-- ================================================================
CREATE TABLE cafe_attributes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id          UUID        NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  quiet_score      SMALLINT    NOT NULL DEFAULT 0 CHECK (quiet_score      BETWEEN 0 AND 5),
  solo_score       SMALLINT    NOT NULL DEFAULT 0 CHECK (solo_score       BETWEEN 0 AND 5),
  group_score      SMALLINT    NOT NULL DEFAULT 0 CHECK (group_score      BETWEEN 0 AND 5),
  outlet_score     SMALLINT    NOT NULL DEFAULT 0 CHECK (outlet_score     BETWEEN 0 AND 5),
  wifi_score       SMALLINT    NOT NULL DEFAULT 0 CHECK (wifi_score       BETWEEN 0 AND 5),
  stay_score       SMALLINT    NOT NULL DEFAULT 0 CHECK (stay_score       BETWEEN 0 AND 5),
  coffee_score     SMALLINT    NOT NULL DEFAULT 0 CHECK (coffee_score     BETWEEN 0 AND 5),
  dessert_score    SMALLINT    NOT NULL DEFAULT 0 CHECK (dessert_score    BETWEEN 0 AND 5),
  late_open_score  SMALLINT    NOT NULL DEFAULT 0 CHECK (late_open_score  BETWEEN 0 AND 5),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cafe_id)  -- 카페당 속성 1행 보장
);

-- TODO: RLS — cafes 정책과 연동
-- ALTER TABLE cafe_attributes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "active_cafe_attributes_read" ON cafe_attributes
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM cafes WHERE cafes.id = cafe_id AND cafes.status = 'active')
--   );

CREATE TRIGGER set_cafe_attributes_updated_at
  BEFORE UPDATE ON cafe_attributes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ================================================================
-- 3. cafe_tags — 카공 태그 (cafes 1:N)
--    TypeScript: `CafeTag` union type
-- ================================================================
CREATE TABLE cafe_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id    UUID        NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  tag        TEXT        NOT NULL
               CHECK (tag IN (
                 'quiet', 'talkable', 'outlet', 'wifi',
                 'late_open', '24hours', 'coffee', 'dessert',
                 'solo', 'group'
               )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, tag)  -- 카페당 동일 태그 중복 방지
);

CREATE INDEX idx_cafe_tags_cafe_id ON cafe_tags (cafe_id);
CREATE INDEX idx_cafe_tags_tag     ON cafe_tags (tag);

-- TODO: RLS — cafes 정책과 연동
-- ALTER TABLE cafe_tags ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- 4. favorites — 즐겨찾기 (익명 사용자 기반)
--    현재: localStorage `kagong_favorites` 대체 예정
-- ================================================================
CREATE TABLE favorites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_key   TEXT        NOT NULL,  -- 앱인토스 익명 식별키 (추후 연동)
  cafe_id    UUID        NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (anon_key, cafe_id)
);

CREATE INDEX idx_favorites_anon_key ON favorites (anon_key);
CREATE INDEX idx_favorites_cafe_id  ON favorites (cafe_id);

-- TODO: RLS — 자신의 anon_key 행만 읽기/쓰기/삭제 가능
-- ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_favorites" ON favorites
--   FOR ALL USING (anon_key = current_setting('app.current_anon_key', true));


-- ================================================================
-- 5. recent_views — 최근 본 카페 (익명 사용자 기반)
--    현재: localStorage `kagong_recent_views` 대체 예정
--    최신 순 정렬은 viewed_at DESC로 처리
-- ================================================================
CREATE TABLE recent_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_key   TEXT        NOT NULL,
  cafe_id    UUID        NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- primary key 기반으로 중복 허용 (같은 카페를 여러 번 봤을 때 모두 기록)
  -- 앱 단에서 MAX_ITEMS=20 슬라이싱 처리
);

CREATE INDEX idx_recent_views_anon_key ON recent_views (anon_key, viewed_at DESC);
CREATE INDEX idx_recent_views_cafe_id  ON recent_views (cafe_id);

-- TODO: RLS — 자신의 anon_key 행만 접근 가능
-- ALTER TABLE recent_views ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_recent_views" ON recent_views
--   FOR ALL USING (anon_key = current_setting('app.current_anon_key', true));


-- ================================================================
-- 6. filter_logs — 사용자 행동 이벤트 로그
--    현재: localStorage `kagong_events` 대체 예정
--    payload는 JSONB로 관리 (좌표 미포함 — privacy 정책)
-- ================================================================
CREATE TABLE filter_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_key    TEXT,                          -- NULL 허용: 식별 전 이벤트
  event_name  TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_filter_logs_event_name  ON filter_logs (event_name);
CREATE INDEX idx_filter_logs_anon_key    ON filter_logs (anon_key) WHERE anon_key IS NOT NULL;
CREATE INDEX idx_filter_logs_created_at  ON filter_logs (created_at DESC);

-- TODO: RLS — INSERT는 누구나 가능, SELECT는 운영자만
-- ALTER TABLE filter_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "insert_logs" ON filter_logs FOR INSERT WITH CHECK (true);
-- CREATE POLICY "admin_read_logs" ON filter_logs FOR SELECT USING (
--   current_setting('app.role', true) = 'admin'
-- );


-- ================================================================
-- 7. district_best_rankings — 구/동별 BEST 큐레이션
--    현재: DistrictBestPage의 calcBestScore() 인메모리 정렬 대체 예정
-- ================================================================
CREATE TABLE district_best_rankings (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id     UUID         NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  district    TEXT         NOT NULL,
  dong        TEXT         NOT NULL DEFAULT '전체',  -- '전체' = 구 전체 랭킹
  rank        SMALLINT     NOT NULL CHECK (rank BETWEEN 1 AND 10),
  score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_curated  BOOLEAN      NOT NULL DEFAULT true,   -- true: 운영자 직접 선정
  period      TEXT         NOT NULL DEFAULT 'current',  -- 예: '2025-Q2', 'current'
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (district, dong, rank, period)
);

CREATE INDEX idx_district_best_lookup  ON district_best_rankings (district, dong, period);
CREATE INDEX idx_district_best_cafe_id ON district_best_rankings (cafe_id);

-- TODO: RLS — SELECT는 누구나, INSERT/UPDATE는 운영자만
-- ALTER TABLE district_best_rankings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "read_rankings" ON district_best_rankings FOR SELECT USING (true);

CREATE TRIGGER set_district_best_updated_at
  BEFORE UPDATE ON district_best_rankings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ================================================================
-- 8. user_suggestions — 사용자 카페 제안
--    현재: localStorage `kagong_suggestions` + SuggestCafePage 대체 예정
-- ================================================================
CREATE TABLE user_suggestions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_key       TEXT,                    -- NULL 허용: 익명 제출 가능
  cafe_name      TEXT        NOT NULL,
  address        TEXT        NOT NULL,
  reason         TEXT        NOT NULL DEFAULT '',
  tags           TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  review_status  TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewer_note  TEXT,                    -- 운영자 검수 메모
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ             -- 검수 완료 시각
);

CREATE INDEX idx_user_suggestions_status ON user_suggestions (review_status);

-- TODO: RLS — INSERT는 누구나, SELECT/UPDATE는 운영자만
-- ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "insert_suggestion" ON user_suggestions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "admin_read_suggestion" ON user_suggestions FOR SELECT USING (
--   current_setting('app.role', true) = 'admin'
-- );


-- ================================================================
-- 9. raw_cafe_candidates — 자동 수집 후보 풀 (운영자용)
--    TypeScript: `CafeCandidate` 타입 매핑
-- ================================================================
CREATE TABLE raw_cafe_candidates (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type         TEXT         NOT NULL
                        CHECK (source_type IN (
                          'naver_blog', 'naver_cafe', 'naver_local',
                          'instagram', 'manual', 'user_suggestion'
                        )),
  source_keyword      TEXT         NOT NULL DEFAULT '',
  candidate_name      TEXT         NOT NULL,
  candidate_address   TEXT,
  candidate_url       TEXT,
  extracted_keywords  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence_score    NUMERIC(4,2) NOT NULL DEFAULT 0
                        CHECK (confidence_score BETWEEN 0 AND 1),
  review_status       TEXT         NOT NULL DEFAULT 'pending'
                        CHECK (review_status IN ('pending', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  reviewed_at         TIMESTAMPTZ
);

CREATE INDEX idx_raw_candidates_status      ON raw_cafe_candidates (review_status);
CREATE INDEX idx_raw_candidates_source_type ON raw_cafe_candidates (source_type);

-- TODO: RLS — 운영자만 전체 접근
-- ALTER TABLE raw_cafe_candidates ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- TypeScript ↔ SQL 컬럼 네이밍 비교 (참고용)
-- ================================================================
-- TS camelCase          → SQL snake_case
-- cafe.openHoursSummary → cafes.open_hours_summary
-- cafe.is24Hours        → cafes.is_24_hours
-- cafe.naverMapUrl      → cafes.naver_map_url
-- attr.quietScore       → cafe_attributes.quiet_score
-- attr.soloScore        → cafe_attributes.solo_score
-- attr.groupScore       → cafe_attributes.group_score
-- attr.outletScore      → cafe_attributes.outlet_score
-- attr.wifiScore        → cafe_attributes.wifi_score
-- attr.stayScore        → cafe_attributes.stay_score
-- attr.coffeeScore      → cafe_attributes.coffee_score
-- attr.dessertScore     → cafe_attributes.dessert_score
-- attr.lateOpenScore    → cafe_attributes.late_open_score
-- candidate.sourceType  → raw_cafe_candidates.source_type
-- candidate.reviewStatus→ raw_cafe_candidates.review_status / user_suggestions.review_status
-- ================================================================
