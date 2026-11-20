-- =============================================================
-- Vegan Tracker — 026_rpc_history_v2.sql
-- RPC: get_meal_log_history (replace with all 22 nutrients)
--
-- Adds to v1: potassium_mg, sodium_mg, selenium_mcg,
--             vit_a_rae_mcg, folate_mcg, vit_k_mcg, vit_e_mg,
--             vit_b6_mg, magnesium_mg, choline_mg, saturated_fat_g
--
-- Run after 007_rpc_history.sql
-- =============================================================

DROP FUNCTION IF EXISTS get_meal_log_history(date, date);

CREATE OR REPLACE FUNCTION get_meal_log_history(
  p_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_to   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  logged_at       DATE,
  entry_count     INTEGER,
  cal             NUMERIC,
  protein_g       NUMERIC,
  carbs_g         NUMERIC,
  fat_g           NUMERIC,
  saturated_fat_g NUMERIC,
  fiber_g         NUMERIC,
  iron_mg         NUMERIC,
  calcium_mg      NUMERIC,
  zinc_mg         NUMERIC,
  magnesium_mg    NUMERIC,
  potassium_mg    NUMERIC,
  sodium_mg       NUMERIC,
  selenium_mcg    NUMERIC,
  vit_a_rae_mcg   NUMERIC,
  vit_b6_mg       NUMERIC,
  vit_b12_mcg     NUMERIC,
  vit_c_mg        NUMERIC,
  vit_d_mcg       NUMERIC,
  vit_e_mg        NUMERIC,
  vit_k_mcg       NUMERIC,
  folate_mcg      NUMERIC,
  choline_mg      NUMERIC,
  omega3_g        NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH effective_quantities AS (

    -- 1a. Recipe entries con overrides
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ri.ingredient_id,
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
    WHERE ml.user_id    = auth.uid()
      AND ml.logged_at BETWEEN p_from AND p_to
      AND ml.recipe_id IS NOT NULL
      AND NOT COALESCE(ov.excluded, FALSE)

    UNION ALL

    -- 1b. Ingredientes extra (overrides fuera de la receta)
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ov.ingredient_id,
      ov.quantity_g
    FROM meal_log ml
    JOIN meal_log_ingredient_overrides ov
      ON ov.meal_log_id = ml.id
    WHERE ml.user_id    = auth.uid()
      AND ml.logged_at BETWEEN p_from AND p_to
      AND ml.recipe_id IS NOT NULL
      AND ov.excluded   = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri2
        WHERE ri2.recipe_id     = ml.recipe_id
          AND ri2.ingredient_id = ov.ingredient_id
      )

    UNION ALL

    -- 1c. Ingredientes sueltos
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ml.ingredient_id,
      ml.quantity_g
    FROM meal_log ml
    WHERE ml.user_id      = auth.uid()
      AND ml.logged_at   BETWEEN p_from AND p_to
      AND ml.recipe_id   IS NULL
      AND ml.ingredient_id IS NOT NULL
  ),

  nutrient_rows AS (
    SELECT
      eq.logged_at,
      eq.log_id,
      (ing.cal             * eq.quantity_g / 100) AS cal,
      (ing.protein_g       * eq.quantity_g / 100) AS protein_g,
      (ing.carbs_g         * eq.quantity_g / 100) AS carbs_g,
      (ing.fat_g           * eq.quantity_g / 100) AS fat_g,
      (ing.saturated_fat_g * eq.quantity_g / 100) AS saturated_fat_g,
      (ing.fiber_g         * eq.quantity_g / 100) AS fiber_g,
      (ing.iron_mg         * eq.quantity_g / 100) AS iron_mg,
      (ing.calcium_mg      * eq.quantity_g / 100) AS calcium_mg,
      (ing.zinc_mg         * eq.quantity_g / 100) AS zinc_mg,
      (ing.magnesium_mg    * eq.quantity_g / 100) AS magnesium_mg,
      (ing.potassium_mg    * eq.quantity_g / 100) AS potassium_mg,
      (ing.sodium_mg       * eq.quantity_g / 100) AS sodium_mg,
      (ing.selenium_mcg    * eq.quantity_g / 100) AS selenium_mcg,
      (ing.vit_a_rae_mcg   * eq.quantity_g / 100) AS vit_a_rae_mcg,
      (ing.vit_b6_mg       * eq.quantity_g / 100) AS vit_b6_mg,
      (ing.vit_b12_mcg     * eq.quantity_g / 100) AS vit_b12_mcg,
      (ing.vit_c_mg        * eq.quantity_g / 100) AS vit_c_mg,
      (ing.vit_d_mcg       * eq.quantity_g / 100) AS vit_d_mcg,
      (ing.vit_e_mg        * eq.quantity_g / 100) AS vit_e_mg,
      (ing.vit_k_mcg       * eq.quantity_g / 100) AS vit_k_mcg,
      (ing.folate_mcg      * eq.quantity_g / 100) AS folate_mcg,
      (ing.choline_mg      * eq.quantity_g / 100) AS choline_mg,
      (ing.omega3_g        * eq.quantity_g / 100) AS omega3_g
    FROM effective_quantities eq
    JOIN ingredients ing ON ing.id = eq.ingredient_id
  )

  SELECT
    nr.logged_at,
    COUNT(DISTINCT nr.log_id)::INTEGER  AS entry_count,
    ROUND(SUM(nr.cal),             2)   AS cal,
    ROUND(SUM(nr.protein_g),       2)   AS protein_g,
    ROUND(SUM(nr.carbs_g),         2)   AS carbs_g,
    ROUND(SUM(nr.fat_g),           2)   AS fat_g,
    ROUND(SUM(nr.saturated_fat_g), 2)   AS saturated_fat_g,
    ROUND(SUM(nr.fiber_g),         2)   AS fiber_g,
    ROUND(SUM(nr.iron_mg),         3)   AS iron_mg,
    ROUND(SUM(nr.calcium_mg),      2)   AS calcium_mg,
    ROUND(SUM(nr.zinc_mg),         3)   AS zinc_mg,
    ROUND(SUM(nr.magnesium_mg),    2)   AS magnesium_mg,
    ROUND(SUM(nr.potassium_mg),    2)   AS potassium_mg,
    ROUND(SUM(nr.sodium_mg),       2)   AS sodium_mg,
    ROUND(SUM(nr.selenium_mcg),    3)   AS selenium_mcg,
    ROUND(SUM(nr.vit_a_rae_mcg),   2)   AS vit_a_rae_mcg,
    ROUND(SUM(nr.vit_b6_mg),       3)   AS vit_b6_mg,
    ROUND(SUM(nr.vit_b12_mcg),     3)   AS vit_b12_mcg,
    ROUND(SUM(nr.vit_c_mg),        2)   AS vit_c_mg,
    ROUND(SUM(nr.vit_d_mcg),       3)   AS vit_d_mcg,
    ROUND(SUM(nr.vit_e_mg),        3)   AS vit_e_mg,
    ROUND(SUM(nr.vit_k_mcg),       2)   AS vit_k_mcg,
    ROUND(SUM(nr.folate_mcg),      2)   AS folate_mcg,
    ROUND(SUM(nr.choline_mg),      2)   AS choline_mg,
    ROUND(SUM(nr.omega3_g),        3)   AS omega3_g
  FROM nutrient_rows nr
  GROUP BY nr.logged_at
  ORDER BY nr.logged_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_meal_log_history(DATE, DATE)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION get_meal_log_history(DATE, DATE)
  FROM public;

COMMENT ON FUNCTION get_meal_log_history(DATE, DATE) IS
'Returns one row per logged date in [p_from, p_to] with aggregated
nutrition totals for all 22 nutrients. Handles recipe entries
(with/without overrides), extra ingredients, and loose ingredient
entries. Default window: last 30 days up to today.';
