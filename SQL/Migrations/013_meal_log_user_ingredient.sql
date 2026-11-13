-- =============================================================
-- Vegan Tracker — 013_meal_log_user_ingredient.sql
-- Extends meal_log to support user-owned ingredients.
--
-- Problem: meal_log.ingredient_id FK points only to the public
--   `ingredients` table. User ingredients live in `user_ingredients`
--   and have UUIDs unknown to `ingredients`.
--
-- Solution: add user_ingredient_id (nullable FK → user_ingredients),
--   update the one-source CHECK constraint to allow this new source,
--   and update log_meal_with_overrides to accept it.
--
-- IDEMPOTENT — safe to re-run.
-- Run after 012_unaccent_search.sql
-- =============================================================

-- ── 1. New column ─────────────────────────────────────────────
ALTER TABLE meal_log
  ADD COLUMN IF NOT EXISTS user_ingredient_id UUID
    REFERENCES user_ingredients(id) ON DELETE SET NULL;

-- ── 2. Replace CHECK constraint ───────────────────────────────
-- Drop old (3-branch) constraint; add new (4-branch) one.
ALTER TABLE meal_log
  DROP CONSTRAINT IF EXISTS meal_log_one_source;

ALTER TABLE meal_log
  ADD CONSTRAINT meal_log_one_source CHECK (
    -- recipe entry
    (
      recipe_id          IS NOT NULL AND
      ingredient_id      IS NULL     AND
      user_ingredient_id IS NULL     AND
      servings           IS NOT NULL AND
      quantity_g         IS NULL
    )
    OR
    -- public ingredient entry
    (
      ingredient_id      IS NOT NULL AND
      recipe_id          IS NULL     AND
      user_ingredient_id IS NULL     AND
      quantity_g         IS NOT NULL AND
      servings           IS NULL
    )
    OR
    -- user ingredient entry
    (
      user_ingredient_id IS NOT NULL AND
      recipe_id          IS NULL     AND
      ingredient_id      IS NULL     AND
      quantity_g         IS NOT NULL AND
      servings           IS NULL
    )
  );

-- ── 3. Index for user_ingredient_id lookups ───────────────────
CREATE INDEX IF NOT EXISTS idx_meal_log_user_ing_id
  ON meal_log(user_ingredient_id)
  WHERE user_ingredient_id IS NOT NULL;

-- ── 4. Updated RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_meal_with_overrides(
  entry     jsonb,
  overrides jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_log_id    uuid;
  v_log_row   meal_log;
  v_override  jsonb;
BEGIN
  -- ── 1. Auth check ──────────────────────────────────────────
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF (entry->>'user_id')::uuid <> v_user_id THEN
    RAISE EXCEPTION 'forbidden: user_id mismatch';
  END IF;

  -- ── 2. Insert meal_log row ─────────────────────────────────
  INSERT INTO meal_log (
    user_id,
    logged_at,
    meal_type,
    recipe_id,
    ingredient_id,
    user_ingredient_id,
    servings,
    quantity_g,
    notes
  )
  VALUES (
    v_user_id,
    (entry->>'logged_at')::date,
    entry->>'meal_type',
    (entry->>'recipe_id')::uuid,
    (entry->>'ingredient_id')::uuid,
    (entry->>'user_ingredient_id')::uuid,
    (entry->>'servings')::numeric,
    (entry->>'quantity_g')::numeric,
    entry->>'notes'
  )
  RETURNING * INTO v_log_row;

  v_log_id := v_log_row.id;

  -- ── 3. Insert overrides ────────────────────────────────────
  IF jsonb_array_length(overrides) > 0 THEN
    FOR v_override IN SELECT * FROM jsonb_array_elements(overrides)
    LOOP
      INSERT INTO meal_log_ingredient_overrides (
        meal_log_id,
        ingredient_id,
        quantity_g,
        excluded
      )
      VALUES (
        v_log_id,
        (v_override->>'ingredient_id')::uuid,
        CASE
          WHEN (v_override->>'excluded')::boolean = TRUE THEN NULL
          ELSE (v_override->>'quantity_g')::numeric
        END,
        COALESCE((v_override->>'excluded')::boolean, FALSE)
      );
    END LOOP;
  END IF;

  -- ── 4. Return ──────────────────────────────────────────────
  RETURN to_jsonb(v_log_row);

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION log_meal_with_overrides(jsonb, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION log_meal_with_overrides(jsonb, jsonb) FROM public;

COMMENT ON FUNCTION log_meal_with_overrides(jsonb, jsonb) IS
'Inserts a meal_log entry and its ingredient overrides atomically.
entry fields: user_id, logged_at, meal_type, recipe_id, ingredient_id,
  user_ingredient_id, servings, quantity_g, notes.
Exactly one of recipe_id, ingredient_id, user_ingredient_id must be non-null.';
