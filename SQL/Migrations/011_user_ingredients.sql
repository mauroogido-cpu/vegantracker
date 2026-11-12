-- =============================================================
-- Vegan Tracker — 011_user_ingredients.sql
-- User-owned ingredient catalog for manually entered products
-- (processed foods, local brands, items with partial label data).
--
-- Design decisions:
--   • All nutritional fields are NULLABLE — a NULL means "unknown",
--     NOT zero. The app layer must distinguish NULL from 0 when
--     computing daily totals (show "incomplete data" indicator).
--   • user_id references auth.users(id) directly, consistent with
--     the rest of the schema (ingredient_costs, recipes, meal_log).
--   • status workflow:  'private' → 'pending_review' → (promoted to
--     public ingredients table by admin, row deleted here)
--   • barcode (EAN-13 / UPC-A) stored as TEXT to avoid leading-zero
--     loss and to support regional formats.
--   • source_ingredient_id: set when this item was derived from
--     a public ingredient.
--
-- IDEMPOTENT — safe to re-run if already applied.
-- Run after 010_rpc_get_rda.sql
-- =============================================================

-- =============================================================
-- TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS user_ingredients (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          NOT NULL
                                REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Identity ──────────────────────────────────────────────
  name_en       TEXT          NOT NULL,
  name_es       TEXT,                        -- optional local name
  brand         TEXT,                        -- e.g. "Gloria", "Laive"
  barcode       TEXT,                        -- EAN-13 / UPC-A
  category      TEXT          NOT NULL DEFAULT 'other'
                                CHECK (category IN (
                                  'fruits', 'vegetables', 'grains',
                                  'legumes', 'proteins', 'seeds', 'other'
                                )),

  -- ── Energy & macronutrients (per 100 g) — all NULLABLE ───
  cal           NUMERIC(8,2),
  protein_g     NUMERIC(8,2),
  carbs_g       NUMERIC(8,2),
  fat_g         NUMERIC(8,2),
  fiber_g       NUMERIC(8,2),
  saturated_fat_g NUMERIC(8,2),
  sugar_g       NUMERIC(8,2),
  sodium_mg     NUMERIC(8,2),               -- common on processed labels

  -- ── Minerals — all NULLABLE ───────────────────────────────
  iron_mg       NUMERIC(8,3),
  calcium_mg    NUMERIC(8,2),
  zinc_mg       NUMERIC(8,3),

  -- ── Vitamins & micronutrients — all NULLABLE ─────────────
  vit_b12_mcg   NUMERIC(8,3),
  vit_d_mcg     NUMERIC(8,3),
  vit_c_mg      NUMERIC(8,2),
  omega3_g      NUMERIC(8,3),

  -- ── Review / promotion workflow ───────────────────────────
  status        TEXT          NOT NULL DEFAULT 'private'
                                CHECK (status IN (
                                  'private',
                                  'pending_review',
                                  'rejected'
                                )),
  submitted_at  TIMESTAMPTZ,

  source_ingredient_id UUID
                                REFERENCES ingredients(id) ON DELETE SET NULL,

  -- ── Timestamps ────────────────────────────────────────────
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
-- updated_at TRIGGER
-- =============================================================
DROP TRIGGER IF EXISTS trg_user_ingredients_updated_at ON user_ingredients;
CREATE TRIGGER trg_user_ingredients_updated_at
  BEFORE UPDATE ON user_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_user_ing_user_id
  ON user_ingredients(user_id);

CREATE INDEX IF NOT EXISTS idx_user_ing_name_en
  ON user_ingredients(user_id, name_en);

CREATE INDEX IF NOT EXISTS idx_user_ing_pending
  ON user_ingredients(status)
  WHERE status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_user_ing_barcode
  ON user_ingredients(barcode)
  WHERE barcode IS NOT NULL;

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE user_ingredients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- select
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_ingredients'
      AND policyname = 'user_ingredients: select own'
  ) THEN
    CREATE POLICY "user_ingredients: select own"
      ON user_ingredients FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_ingredients'
      AND policyname = 'user_ingredients: insert own'
  ) THEN
    CREATE POLICY "user_ingredients: insert own"
      ON user_ingredients FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_ingredients'
      AND policyname = 'user_ingredients: update own'
  ) THEN
    CREATE POLICY "user_ingredients: update own"
      ON user_ingredients FOR UPDATE
      TO authenticated
      USING     (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_ingredients'
      AND policyname = 'user_ingredients: delete own'
  ) THEN
    CREATE POLICY "user_ingredients: delete own"
      ON user_ingredients FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;

-- =============================================================
-- GRANTS  (always idempotent)
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE
  ON user_ingredients
  TO authenticated, service_role;

-- =============================================================
-- COMMENTS  (always idempotent)
-- =============================================================
COMMENT ON TABLE user_ingredients IS
'User-owned ingredient catalog for manually entered processed foods
and local products. All nutritional columns are nullable (NULL = unknown,
not zero). Rows in status ''pending_review'' are candidates for promotion
to the public ingredients table by an admin.';

COMMENT ON COLUMN user_ingredients.cal IS
'Calories per 100 g. NULL when not stated on the label.';

COMMENT ON COLUMN user_ingredients.sodium_mg IS
'Sodium per 100 g. Included here because processed foods commonly list it.';

COMMENT ON COLUMN user_ingredients.barcode IS
'EAN-13 or UPC-A barcode as TEXT to preserve leading zeros.
Not enforced as unique — two users can independently add the same product.';

COMMENT ON COLUMN user_ingredients.status IS
'private: visible only to this user.
pending_review: user requested promotion to the public catalog.
rejected: admin reviewed and decided not to promote.';
