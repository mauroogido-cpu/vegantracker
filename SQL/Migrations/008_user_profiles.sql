-- =============================================================
-- Vegan Tracker — 008_user_profiles.sql
-- User profile: demographic data for personalised RDA calculation
-- and app preferences (locale, currency).
--
-- If a user has no profile row, the app falls back to the
-- hardcoded adult-reference RDA values in src/constants/nutrition.ts
--
-- Run after 003_grants.sql
-- =============================================================

CREATE TABLE user_profiles (
  user_id       UUID        PRIMARY KEY
                              REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Demographics (all optional — drive RDA personalisation) ──
  sex           TEXT        CHECK (sex IN ('male', 'female', 'other')),
  age           SMALLINT    CHECK (age BETWEEN 1 AND 120),
  weight_kg     NUMERIC(5,1) CHECK (weight_kg > 0),

  -- ── Special physiological states (female only, but not enforced
  --    at DB level to keep schema simple; app-layer validation) ──
  pregnant      BOOLEAN     NOT NULL DEFAULT FALSE,
  lactating     BOOLEAN     NOT NULL DEFAULT FALSE,

  -- ── App preferences ──────────────────────────────────────────
  locale        TEXT        NOT NULL DEFAULT 'es'
                              CHECK (locale IN ('en', 'es', 'pt-BR', 'ja')),
  currency      TEXT        NOT NULL DEFAULT 'PEN'
                              CHECK (currency IN ('PEN','ARS','USD','EUR','INR','BRL','JPY')),

  -- ── Timestamps ───────────────────────────────────────────────
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- updated_at TRIGGER
-- =============================================================
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();   -- defined in 001_initial.sql

-- =============================================================
-- RLS — users can only read and write their own row
-- =============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: select own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_profiles: insert own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles: update own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles: delete own"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================
-- GRANTS
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE
  ON user_profiles
  TO authenticated, service_role;

COMMENT ON TABLE user_profiles IS
'One row per user. All demographic fields are optional.
When present they drive get_rda_for_user(); when absent the app
falls back to the generic adult reference values.';
