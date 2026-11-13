-- =============================================================
-- Vegan Tracker — 015_current_user_id_secure_history.sql
--
-- 1. Creates public.current_user_id() — a thin wrapper over
--    auth.uid() that isolates the Supabase auth dependency.
--    Future: swap the body to migrate to another auth provider
--    without touching any other function or policy.
--
-- 2. Rewrites get_meal_log_history to remove p_user_id from its
--    signature. The function now reads the current user internally
--    via current_user_id(), closing the cross-user data leak
--    (any authenticated user could previously read another user's
--    history by passing their UUID).
--
-- Client call changes:
--   BEFORE: supabase.rpc('get_meal_log_history', { p_user_id, p_from, p_to })
--   AFTER:  supabase.rpc('get_meal_log_history', { p_from, p_to })
--
-- Run after 014_history_user_ingredient.sql
-- =============================================================


-- ── 1. Auth identity wrapper ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

COMMENT ON FUNCTION public.current_user_id() IS
'Returns the UUID of the currently authenticated user.
Wraps auth.uid() so the Supabase auth dependency is isolated
to a single function. Replace the body here when migrating to
another auth provider.';

-- No GRANT needed: SECURITY INVOKER — the caller's own permissions apply.


-- ── 2. Drop old signature before redefining ─────────────────────────────────
-- CREATE OR REPLACE cannot change the parameter list, so we drop first.

DROP FUNCTION IF EXISTS get_meal_log_history(UUID, DATE, DATE);


-- ── 3. Rewrite get_meal_log_history (no p_user_id parameter) ───────────────

CREATE OR REPLACE FUNCTION get_meal_log_history(
  p_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_to   DATE DEFAULT CURRENT_DATE
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
  WITH

  -- Resolve caller identity once; every WHERE clause references this.
  caller AS (
    SELECT current_user_id() AS uid
  ),

  -- ── CTE 1: effective ingredient quantities per log entry ────────────────
  effective_quantities AS (

    -- 1a. Recipe entries — recipe ingredients scaled by servings ratio,
    --     overridden per-ingredient where a non-excluded override exists.
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ri.ingredient_id,
      NULL::UUID      AS user_ingredient_id,
      CASE
        WHEN ov.id IS NOT NULL AND ov.excluded = FALSE
          THEN ov.quantity_g
        ELSE ri.quantity_g * (ml.servings / r.servings::NUMERIC)
      END             AS quantity_g
    FROM meal_log ml
    CROSS JOIN caller
    JOIN recipes r
      ON r.id = ml.recipe_id
    JOIN recipe_ingredients ri
      ON ri.recipe_id = ml.recipe_id
    LEFT JOIN meal_log_ingredient_overrides ov
      ON ov.meal_log_id = ml.id
     AND ov.ingredient_id = ri.ingredient_id
    WHERE ml.user_id    = caller.uid
      AND ml.logged_at BETWEEN p_from AND p_to
      AND ml.recipe_id IS NOT NULL
      AND NOT COALESCE(ov.excluded, FALSE)

    UNION ALL

    -- 1b. Recipe entries — extra ingredients (overrides not in recipe)
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      ov.ingredient_id,
      NULL::UUID      AS user_ingredient_id,
      ov.quantity_g
    FROM meal_log ml
    CROSS JOIN caller
    JOIN meal_log_ingredient_overrides ov
      ON ov.meal_log_id = ml.id
    WHERE ml.user_id    = caller.uid
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
      ml.ingredient_id,
      NULL::UUID      AS user_ingredient_id,
      ml.quantity_g
    FROM meal_log ml
    CROSS JOIN caller
    WHERE ml.user_id         = caller.uid
      AND ml.logged_at      BETWEEN p_from AND p_to
      AND ml.recipe_id      IS NULL
      AND ml.ingredient_id  IS NOT NULL

    UNION ALL

    -- 1d. User ingredient entries
    SELECT
      ml.id           AS log_id,
      ml.logged_at,
      NULL::UUID      AS ingredient_id,
      ml.user_ingredient_id,
      ml.quantity_g
    FROM meal_log ml
    CROSS JOIN caller
    WHERE ml.user_id              = caller.uid
      AND ml.logged_at           BETWEEN p_from AND p_to
      AND ml.recipe_id           IS NULL
      AND ml.user_ingredient_id  IS NOT NULL
  ),

  -- ── CTE 2: join to get nutrient values ──────────────────────────────────
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

GRANT EXECUTE ON FUNCTION get_meal_log_history(DATE, DATE)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION get_meal_log_history(DATE, DATE)
  FROM public;

COMMENT ON FUNCTION get_meal_log_history(DATE, DATE) IS
'Returns one row per logged date in [p_from, p_to] with aggregated
nutrition totals for the currently authenticated user.
Handles recipe entries (with/without overrides), extra ingredients,
loose public ingredient entries, and user_ingredient entries.
NULL nutrients in user_ingredients are treated as 0.
Default window: last 30 days up to today.
Security: user identity is resolved internally via current_user_id()
— the caller cannot read another user''s data.';
