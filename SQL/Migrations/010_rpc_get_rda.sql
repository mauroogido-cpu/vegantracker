-- =============================================================
-- Vegan Tracker — 010_rpc_get_rda.sql  (v4 — revised macro targets)
-- RPC: get_rda_for_user
--
-- Calorie:  Mifflin-St Jeor × PAL  (when height+weight present)
-- Protein:  weight_kg × 0.8 g/kg   (WHO/RDA standard; fallback table)
-- Carbs:    55 % of TDEE / 4 kcal/g (AMDR mid-point 45-65 %)
-- Fat:      20 % of TDEE / 9 kcal/g (AMDR minimum floor, not mid-point)
--           Fat uses min_only logic: being above floor is fine
--
-- Extra metadata returned for dashboard display:
--   "tdee"          → calculated TDEE (kcal), null if not calculated
--   "weight_kg"     → user weight in kg, null if not set
--   "cal_source"    → 'calculated' | 'table' | 'default'
--   "macros_source" → 'derived'   | 'table' | 'default'
--
-- Run after 008_user_profiles.sql + 009_rda_reference.sql
-- v4 also requires 016_profile_height_activity.sql (height_cm, activity_level).
--          + 016_profile_height_activity.sql
-- =============================================================

CREATE OR REPLACE FUNCTION get_rda_for_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid;
  v_profile      user_profiles;
  v_sex_lookup   TEXT;
  v_ref          rda_reference;
  v_result       jsonb;

  -- Calorie / macro variables
  v_bmr          NUMERIC;
  v_pal          NUMERIC;
  v_tdee         NUMERIC;
  v_protein_g    NUMERIC;
  v_carbs_g      NUMERIC;
  v_fat_g        NUMERIC;
  v_cal_source   TEXT;
  v_macro_source TEXT;

  -- ── Fallback defaults (matches src/constants/nutrition.ts) ──
  v_default jsonb := '{
    "cal":2000,"protein_g":50,"carbs_g":275,"fat_g":44,"fiber_g":28,
    "iron_mg":18,"calcium_mg":1000,"zinc_mg":11,"potassium_mg":4700,
    "sodium_mg":2300,"selenium_mcg":55,"magnesium_mg":420,
    "vit_b12_mcg":2.4,"vit_d_mcg":15,"vit_c_mg":90,"vit_a_rae_mcg":900,
    "folate_mcg":400,"vit_k_mcg":120,"vit_e_mg":15,"vit_b6_mg":1.7,
    "choline_mg":550,"omega3_g":1.6,"saturated_fat_g":22,
    "source":"default","cal_source":"default","macros_source":"default",
    "tdee":null,"weight_kg":null
  }';
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- ── 1. Load user profile ──────────────────────────────────
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND OR v_profile.sex IS NULL OR v_profile.age IS NULL THEN
    RETURN v_default;
  END IF;

  -- ── 2. Map 'other' → female (lower-need reference) ───────
  v_sex_lookup := CASE
    WHEN v_profile.sex = 'male' THEN 'male'
    ELSE 'female'
  END;

  -- ── 3. Look up reference row ──────────────────────────────
  SELECT * INTO v_ref
  FROM rda_reference
  WHERE sex       = v_sex_lookup
    AND age_min  <= v_profile.age
    AND age_max  >= v_profile.age
    AND pregnant  = v_profile.pregnant
    AND lactating = v_profile.lactating
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN v_default;
  END IF;

  -- ── 4. Calorie calculation (Mifflin-St Jeor + PAL) ───────
  IF v_profile.height_cm IS NOT NULL AND v_profile.weight_kg IS NOT NULL THEN

    v_bmr := 10 * v_profile.weight_kg
           + 6.25 * v_profile.height_cm
           - 5   * v_profile.age
           + CASE WHEN v_profile.sex = 'male' THEN 5 ELSE -161 END;

    v_pal := CASE COALESCE(v_profile.activity_level, 'sedentary')
      WHEN 'sedentary'         THEN 1.2
      WHEN 'lightly_active'    THEN 1.375
      WHEN 'moderately_active' THEN 1.55
      WHEN 'very_active'       THEN 1.725
      ELSE                          1.2
    END;

    v_tdee       := ROUND(v_bmr * v_pal);
    v_cal_source := 'calculated';

  ELSE
    v_tdee       := v_ref.cal;
    v_cal_source := 'table';
  END IF;

  -- ── 5. Macro calculation ──────────────────────────────────
  --
  -- Protein: weight_kg × 0.8 g/kg  (WHO/RDA standard)
  --   Falls back to reference-table value when weight is unknown.
  --
  -- Carbs: 55 % of TDEE / 4 kcal/g  (AMDR 45–65 %, mid-point)
  -- Fat:   20 % of TDEE / 9 kcal/g  (AMDR minimum floor)
  --   fat_g is treated as min_only: being above 20 % is not flagged.
  --   Both always derived from TDEE when source is 'profile'.

  IF v_profile.weight_kg IS NOT NULL THEN
    v_protein_g    := ROUND(v_profile.weight_kg * 0.8, 1);
    v_macro_source := 'derived';
  ELSE
    v_protein_g    := v_ref.protein_g;
    v_macro_source := 'table';
  END IF;

  -- Carbs and fat always from TDEE (profile path reached here means
  -- sex + age are present; TDEE is at minimum the table value).
  v_carbs_g := ROUND((v_tdee * 0.55) / 4);
  v_fat_g   := ROUND((v_tdee * 0.20) / 9, 1);   -- AMDR minimum floor

  -- ── 6. Build result JSON ──────────────────────────────────
  v_result := jsonb_build_object(
    'source',          'profile',
    'cal_source',      v_cal_source,
    'macros_source',   v_macro_source,

    -- Metadata for dashboard display
    'tdee',            v_tdee,
    'weight_kg',       v_profile.weight_kg,

    -- Energy
    'cal',             v_tdee,

    -- Macros (personalised)
    'protein_g',       v_protein_g,
    'carbs_g',         v_carbs_g,
    'fat_g',           v_fat_g,

    -- Fiber (table — no body-composition derivation)
    'fiber_g',         v_ref.fiber_g,

    -- Minerals (vegan multipliers on iron and zinc)
    'iron_mg',         ROUND(v_ref.iron_mg  * 1.8, 1),
    'calcium_mg',      v_ref.calcium_mg,
    'zinc_mg',         ROUND(v_ref.zinc_mg  * 1.5, 1),
    'potassium_mg',    v_ref.potassium_mg,
    'sodium_mg',       v_ref.sodium_mg,
    'selenium_mcg',    v_ref.selenium_mcg,
    'magnesium_mg',    v_ref.magnesium_mg,

    -- Vitamins
    'vit_b12_mcg',     v_ref.vit_b12_mcg,
    'vit_d_mcg',       v_ref.vit_d_mcg,
    'vit_c_mg',        v_ref.vit_c_mg,
    'vit_a_rae_mcg',   v_ref.vit_a_rae_mcg,
    'folate_mcg',      v_ref.folate_mcg,
    'vit_k_mcg',       v_ref.vit_k_mcg,
    'vit_e_mg',        v_ref.vit_e_mg,
    'vit_b6_mg',       v_ref.vit_b6_mg,
    'choline_mg',      v_ref.choline_mg,

    -- Fatty acids
    'omega3_g',        v_ref.omega3_g,
    'saturated_fat_g', v_ref.saturated_fat_g
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN RAISE;
END;
$$;

-- =============================================================
-- GRANTS (unchanged)
-- =============================================================
GRANT EXECUTE ON FUNCTION get_rda_for_user() TO authenticated;
REVOKE EXECUTE ON FUNCTION get_rda_for_user() FROM public;

COMMENT ON FUNCTION get_rda_for_user() IS
'Returns personalised RDA for the calling user (auth.uid()).
Calories: Mifflin-St Jeor BMR × PAL when height+weight present.
Protein:  weight_kg × 0.8 g/kg (WHO/RDA standard); falls back to table.
Carbs:    55% of TDEE / 4 kcal/g (AMDR mid-point 45–65%).
Fat:      20% of TDEE / 9 kcal/g (AMDR minimum floor; min_only logic).
Vegan multipliers: iron ×1.8, zinc ×1.5 (AND 2016).
Metadata: tdee, weight_kg, cal_source, macros_source.';
