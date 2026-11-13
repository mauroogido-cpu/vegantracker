-- =============================================================
-- Vegan Tracker — 014_history_user_ingredient.sql
-- Updates get_meal_log_history to include user_ingredient entries
-- (entries where user_ingredient_id IS NOT NULL).
--
-- Run after 013_meal_log_user_ingredient.sql
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
  WITH effective_quantities AS (

    -- 1a. Recipe entries — recipe ingredients scaled by servings ratio,
    --     overridden per-ingredient where a non-excluded override exists.
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      ri.ingredient_id,
      NULL::UUID      AS user_ingredient_id,
      CASE
        WHEN ov.id IS NOT NULL AND ov.excluded = FALSE
          THEN ov.quantity_g
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
      AND NOT COALESCE(ov.excluded, FALSE)

    UNION ALL

    -- 1b. Recipe entries — extra ingredients (overrides not in recipe)
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      ov.ingredient_id,
      NULL::UUID      AS user_ingredient_id,
      ov.quantity_g
    FROM meal_log ml
    JOIN meal_log_ingredient_overrides ov
      ON ov.meal_log_id = ml.id
    WHERE ml.user_id    = p_user_id
      AND ml.logged_at BETWEEN p_from AND p_to
      AND ml.recipe_id IS NOT NULL
      AND ov.excluded   = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri2
        WHERE ri2.recipe_id     = ml.recipe_id
          AND ri2.ingredient_id = ov.ingredient_id
      )

    UNION ALL

    -- 1c. Loose public ingredient entries
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      ml.ingredient_id,
      NULL::UUID      AS user_ingredient_id,
      ml.quantity_g
    FROM meal_log ml
    WHERE ml.user_id         = p_user_id
      AND ml.logged_at      BETWEEN p_from AND p_to
      AND ml.recipe_id      IS NULL
      AND ml.ingredient_id  IS NOT NULL

    UNION ALL

    -- 1d. User ingredient entries (NEW)
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.user_id,
      NULL::UUID      AS ingredient_id,
      ml.user_ingredient_id,
      ml.quantity_g
    FROM meal_log ml
    WHERE ml.user_id              = p_user_id
      AND ml.logged_at           BETWEEN p_from AND p_to
      AND ml.recipe_id           IS NULL
      AND ml.user_ingredient_id  IS NOT NULL
  ),

  -- ── CTE 2: join to get nutrient values ──────────────────────────────────
  -- Public ingredients and user_ingredients are joined separately and
  -- coalesced so NULL nutrient values in user_ingredients become 0.
  nutrient_rows AS (
    -- From public ingredients table
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
    WHERE eq.ingredient_id IS NOT NULL

    UNION ALL

    -- From user_ingredients table (NULL nutrients treated as 0)
    SELECT
      eq.logged_at,
      eq.log_id,
      (COALESCE(ui.cal,         0) * eq.quantity_g / 100) AS cal,
      (COALESCE(ui.protein_g,   0) * eq.quantity_g / 100) AS protein_g,
      (COALESCE(ui.carbs_g,     0) * eq.quantity_g / 100) AS carbs_g,
      (COALESCE(ui.fat_g,       0) * eq.quantity_g / 100) AS fat_g,
      (COALESCE(ui.fiber_g,     0) * eq.quantity_g / 100) AS fiber_g,
      (COALESCE(ui.iron_mg,     0) * eq.quantity_g / 100) AS iron_mg,
      (COALESCE(ui.calcium_mg,  0) * eq.quantity_g / 100) AS calcium_mg,
      (COALESCE(ui.zinc_mg,     0) * eq.quantity_g / 100) AS zinc_mg,
      (COALESCE(ui.vit_b12_mcg, 0) * eq.quantity_g / 100) AS vit_b12_mcg,
      (COALESCE(ui.vit_d_mcg,   0) * eq.quantity_g / 100) AS vit_d_mcg,
      (COALESCE(ui.vit_c_mg,    0) * eq.quantity_g / 100) AS vit_c_mg,
      (COALESCE(ui.omega3_g,    0) * eq.quantity_g / 100) AS omega3_g
    FROM effective_quantities eq
    JOIN user_ingredients ui ON ui.id = eq.user_ingredient_id
    WHERE eq.user_ingredient_id IS NOT NULL
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

GRANT EXECUTE ON FUNCTION get_meal_log_history(UUID, DATE, DATE) TO authenticated;
REVOKE EXECUTE ON FUNCTION get_meal_log_history(UUID, DATE, DATE) FROM public;

COMMENT ON FUNCTION get_meal_log_history(UUID, DATE, DATE) IS
'Returns one row per logged date in [p_from, p_to] with aggregated
nutrition totals. Handles recipe entries (with/without overrides),
extra ingredients, loose public ingredient entries, and user_ingredient
entries. NULL nutrients in user_ingredients are treated as 0.
Default window: last 30 days up to today.';
