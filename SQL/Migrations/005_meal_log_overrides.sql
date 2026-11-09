-- =============================================================
-- Vegan Tracker — 005_meal_log_overrides.sql
-- Ingredient-level overrides for a meal log entry.
--
-- A row here can represent three things:
--   1. Quantity adjustment  → excluded = FALSE, quantity_g = new amount
--   2. Extra ingredient     → excluded = FALSE, quantity_g = amount used
--                             (ingredient_id not present in the recipe)
--   3. Excluded ingredient  → excluded = TRUE,  quantity_g = NULL
--                             (ingredient skipped for this log entry)
--
-- Run after 001_initial.sql + 002_rls.sql + 003_grants.sql
-- =============================================================

CREATE TABLE meal_log_ingredient_overrides (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_log_id   UUID         NOT NULL
                   REFERENCES meal_log(id) ON DELETE CASCADE,
  ingredient_id UUID         NOT NULL
                   REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_g    NUMERIC(8,2),          -- NULL when excluded = TRUE
  excluded      BOOLEAN      NOT NULL DEFAULT FALSE,
  UNIQUE (meal_log_id, ingredient_id),
  CONSTRAINT check_override_valid CHECK (
    (excluded = TRUE  AND quantity_g IS NULL) OR
    (excluded = FALSE AND quantity_g IS NOT NULL AND quantity_g > 0)
  )
);

-- Fast lookup of all overrides for a given log entry
CREATE INDEX idx_mloverrides_meal_log_id
  ON meal_log_ingredient_overrides(meal_log_id);

-- =============================================================
-- RLS
-- Access is verified via JOIN to meal_log.user_id so we never
-- expose another user's log data, even indirectly.
-- =============================================================
ALTER TABLE meal_log_ingredient_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_log_ingredient_overrides: select own"
  ON meal_log_ingredient_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_log ml
      WHERE ml.id = meal_log_id
        AND ml.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_log_ingredient_overrides: insert own"
  ON meal_log_ingredient_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_log ml
      WHERE ml.id = meal_log_id
        AND ml.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_log_ingredient_overrides: update own"
  ON meal_log_ingredient_overrides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_log ml
      WHERE ml.id = meal_log_id
        AND ml.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_log ml
      WHERE ml.id = meal_log_id
        AND ml.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_log_ingredient_overrides: delete own"
  ON meal_log_ingredient_overrides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_log ml
      WHERE ml.id = meal_log_id
        AND ml.user_id = auth.uid()
    )
  );

-- =============================================================
-- GRANTS
-- Follows the same pattern as 003_grants.sql.
-- RLS above still filters all row-level access.
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE
  ON meal_log_ingredient_overrides
  TO authenticated, service_role;
