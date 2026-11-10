-- =============================================================
-- Vegan Tracker — 010_rpc_get_rda.sql
-- RPC: get_rda_for_user
--
-- Returns the personalised RDA for the calling user based on
-- their user_profiles row. Falls back to hardcoded adult
-- defaults when no profile row exists or demographic fields
-- are NULL. Applies vegan bioavailability multipliers.
--
-- Called from the client as:
--   supabase.rpc('get_rda_for_user')
--
-- Returns: JSON object with one key per nutrient column
--          + a "source" key ('profile' | 'default')
--
-- Run after 008_user_profiles.sql + 009_rda_reference.sql
-- =============================================================

CREATE OR REPLACE FUNCTION get_rda_for_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_profile    user_profiles;
  v_sex_lookup TEXT;
  v_ref        rda_reference;
  v_result     jsonb;

  -- ── Fallback defaults (adult generic, matches nutrition.ts) ──
  -- These are the values used when no profile exists. They match
  -- exactly what src/constants/nutrition.ts exports as RDA.
  v_default    jsonb := '{
    "cal":2000,"protein_g":50,"carbs_g":275,"fat_g":78,"fiber_g":28,
    "iron_mg":18,"calcium_mg":1000,"zinc_mg":11,"potassium_mg":4700,
    "sodium_mg":2300,"selenium_mcg":55,"magnesium_mg":420,
    "vit_b12_mcg":2.4,"vit_d_mcg":15,"vit_c_mg":90,"vit_a_rae_mcg":900,
    "folate_mcg":400,"vit_k_mcg":120,"vit_e_mg":15,"vit_b6_mg":1.7,
    "choline_mg":550,"omega3_g":1.6,"saturated_fat_g":22,
    "source":"default"
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

  -- No profile row, or missing key demographic fields → fallback
  IF NOT FOUND OR v_profile.sex IS NULL OR v_profile.age IS NULL THEN
    RETURN v_default;
  END IF;

  -- ── 2. Map 'other' sex to the lower-need reference ────────
  --    Convention: use 'female' values (generally lower) so we
  --    never under-report requirements for non-binary users.
  v_sex_lookup := CASE
    WHEN v_profile.sex = 'male' THEN 'male'
    ELSE 'female'
  END;

  -- ── 3. Look up the matching reference row ─────────────────
  SELECT * INTO v_ref
  FROM rda_reference
  WHERE sex       = v_sex_lookup
    AND age_min  <= v_profile.age
    AND age_max  >= v_profile.age
    AND pregnant  = v_profile.pregnant
    AND lactating = v_profile.lactating
  LIMIT 1;

  -- No matching row (shouldn't happen with the seed data) → fallback
  IF NOT FOUND THEN
    RETURN v_default;
  END IF;

  -- ── 4. Build result JSON, applying vegan multipliers ──────
  --    iron  ×1.8 — lower haem-iron bioavailability (NAD 2016)
  --    zinc  ×1.5 — phytate inhibition (NAD 2016)
  --    All other values taken directly from the reference row.
  v_result := jsonb_build_object(
    'source',          'profile',

    -- Energy & macros
    'cal',             v_ref.cal,
    'protein_g',       v_ref.protein_g,
    'carbs_g',         v_ref.carbs_g,
    'fat_g',           v_ref.fat_g,
    'fiber_g',         v_ref.fiber_g,

    -- Minerals (vegan multipliers on iron and zinc)
    'iron_mg',         ROUND(v_ref.iron_mg     * 1.8, 1),
    'calcium_mg',      v_ref.calcium_mg,
    'zinc_mg',         ROUND(v_ref.zinc_mg     * 1.5, 1),
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
-- GRANTS
-- =============================================================
GRANT EXECUTE ON FUNCTION get_rda_for_user()
  TO authenticated;

REVOKE EXECUTE ON FUNCTION get_rda_for_user()
  FROM public;

COMMENT ON FUNCTION get_rda_for_user() IS
'Returns the personalised RDA for the calling user (auth.uid()).
Looks up user_profiles → rda_reference; falls back to generic
adult values when the profile is incomplete.
Applies vegan bioavailability multipliers: iron ×1.8, zinc ×1.5.
Result includes "source": "profile" | "default".';
