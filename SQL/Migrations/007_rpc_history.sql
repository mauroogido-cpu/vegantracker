-- =============================================================
-- Vegan Tracker — 007_rpc_history.sql
-- RPC: get_meal_log_history
--
-- Returns one row per logged date for a user, with aggregated
-- nutrition totals computed server-side.
--
-- Handles three entry types:
--   1. Recipe entry without overrides  → scale recipe ingredients by servings
--   2. Recipe entry with overrides     → per-ingredient: use override qty or
--                                        recipe default; skip excluded
--   3. Loose ingredient entry          → quantity_g × nutrient / 100
--
-- Called from client as:
--   supabase.rpc('get_meal_log_history', { p_user_id, p_from, p_to })
--
-- Run after 006_rpc_log_meal.sql
-- =============================================================

CREATE OR REPLACE FUNCTION get_meal_log_history(
  p_user_id UUID,
  p_from    DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_to      DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  logged_at    DATE,
  entry_count  INTEGER,
  cal          NUMERIC,
  protein_g    NUMERIC,
  carbs_g      NUMERIC,
  fat_g        NUMERIC,
  fiber_g      NUMERIC,
  iron_mg      NUMERIC,
  calcium_mg   NUMERIC,
  zinc_mg      NUMERIC,
  vit_b12_mcg  NUMERIC,
  vit_d_mcg    NUMERIC,
  vit_c_mg     NUMERIC,
  omega3_g     NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- ── CTE 1: effective ingredient quantities per log entry ────────────────
  -- For every (log_entry, ingredient) pair we determine the effective grams.
  WITH effective_quantities AS (

    -- 1a. Recipe entries — recipe ingredients scaled by servings ratio,
    --     overridden per-ingredient where a non-excluded override exists.
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      ri.ingredient_id,
      CASE
        -- Override present and not excluded → use override quantity
        WHEN ov.id IS NOT NULL AND ov.excluded = FALSE
          THEN ov.quantity_g
        -- No override → scale recipe default by servings ratio
        ELSE ri.quantity_g * (ml.servings / r.servings::NUMERIC)
      END             AS quantity_g
    FROM meal_log ml
    JOIN recipes r
      ON r.id = ml.recipe_id
    JOIN recipe_ingredients ri
      ON ri.recipe_id = ml.recipe_id
    LEFT JOIN meal_log_ingredient_overrides ov
      ON ov.meal_log_id = ml.id
     AND ov.ingredient_id = ri.ingredient_id
    WHERE ml.user_id    = p_user_id
      AND ml.logged_at BETWEEN p_from AND p_to
      AND ml.recipe_id IS NOT NULL
      -- Drop the row if the ingredient is excluded for this entry
      AND NOT COALESCE(ov.excluded, FALSE)

    UNION ALL

    -- 1b. Recipe entries — extra ingredients (overrides whose ingredient_id
    --     is NOT present in recipe_ingredients for that recipe).
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      ov.ingredient_id,
      ov.quantity_g
    FROM meal_log ml
    JOIN meal_log_ingredient_overrides ov
      ON ov.meal_log_id = ml.id
    WHERE ml.user_id    = p_user_id
      AND ml.logged_at BETWEEN p_from AND p_to
      AND ml.recipe_id IS NOT NULL
      AND ov.excluded   = FALSE
      -- Keep only extras: ingredient not in the recipe
      AND NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri2
        WHERE ri2.recipe_id     = ml.recipe_id
          AND ri2.ingredient_id = ov.ingredient_id
      )

    UNION ALL

    -- 1c. Loose ingredient entries (no recipe)
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      ml.ingredient_id,
      ml.quantity_g
    FROM meal_log ml
    WHERE ml.user_id      = p_user_id
      AND ml.logged_at   BETWEEN p_from AND p_to
      AND ml.recipe_id   IS NULL
      AND ml.ingredient_id IS NOT NULL
  ),

  -- ── CTE 2: join ingredients to get nutrient values ──────────────────────
  nutrient_rows AS (
    SELECT
      eq.logged_at,
      eq.log_id,
      (ing.cal         * eq.quantity_g / 100) AS cal,
      (ing.protein_g   * eq.quantity_g / 100) AS protein_g,
      (ing.carbs_g     * eq.quantity_g / 100) AS carbs_g,
      (ing.fat_g       * eq.quantity_g / 100) AS fat_g,
      (ing.fiber_g     * eq.quantity_g / 100) AS fiber_g,
      (ing.iron_mg     * eq.quantity_g / 100) AS iron_mg,
      (ing.calcium_mg  * eq.quantity_g / 100) AS calcium_mg,
      (ing.zinc_mg     * eq.quantity_g / 100) AS zinc_mg,
      (ing.vit_b12_mcg * eq.quantity_g / 100) AS vit_b12_mcg,
      (ing.vit_d_mcg   * eq.quantity_g / 100) AS vit_d_mcg,
      (ing.vit_c_mg    * eq.quantity_g / 100) AS vit_c_mg,
      (ing.omega3_g    * eq.quantity_g / 100) AS omega3_g
    FROM effective_quantities eq
    JOIN ingredients ing ON ing.id = eq.ingredient_id
  )

  -- ── Final aggregation: one row per date ─────────────────────────────────
  SELECT
    nr.logged_at,
    COUNT(DISTINCT nr.log_id)::INTEGER  AS entry_count,
    ROUND(SUM(nr.cal),         2)       AS cal,
    ROUND(SUM(nr.protein_g),   2)       AS protein_g,
    ROUND(SUM(nr.carbs_g),     2)       AS carbs_g,
    ROUND(SUM(nr.fat_g),       2)       AS fat_g,
    ROUND(SUM(nr.fiber_g),     2)       AS fiber_g,
    ROUND(SUM(nr.iron_mg),     3)       AS iron_mg,
    ROUND(SUM(nr.calcium_mg),  2)       AS calcium_mg,
    ROUND(SUM(nr.zinc_mg),     3)       AS zinc_mg,
    ROUND(SUM(nr.vit_b12_mcg), 3)       AS vit_b12_mcg,
    ROUND(SUM(nr.vit_d_mcg),   3)       AS vit_d_mcg,
    ROUND(SUM(nr.vit_c_mg),    2)       AS vit_c_mg,
    ROUND(SUM(nr.omega3_g),    3)       AS omega3_g
  FROM nutrient_rows nr
  GROUP BY nr.logged_at
  ORDER BY nr.logged_at DESC;
$$;

-- Grant execution to authenticated users only
GRANT EXECUTE ON FUNCTION get_meal_log_history(UUID, DATE, DATE)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION get_meal_log_history(UUID, DATE, DATE)
  FROM public;

COMMENT ON FUNCTION get_meal_log_history(UUID, DATE, DATE) IS
'Returns one row per logged date in [p_from, p_to] with aggregated
nutrition totals. Handles recipe entries (with/without overrides),
extra ingredients added per-entry, and loose ingredient entries.
Default window: last 30 days up to today.';
