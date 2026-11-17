-- =============================================================
-- Vegan Tracker — 018_user_ingredients_mg_k.sql
-- Add magnesium_mg and potassium_mg to user_ingredients.
--
-- These minerals are commonly shown on supplement labels and
-- some fortified foods. Both nullable (NULL = unknown, not 0).
--
-- IDEMPOTENT — safe to re-run.
-- Run after 017_recipe_category_fix.sql
-- =============================================================

ALTER TABLE user_ingredients
  ADD COLUMN IF NOT EXISTS magnesium_mg  NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS potassium_mg  NUMERIC(8,2);

COMMENT ON COLUMN user_ingredients.magnesium_mg IS
'Magnesium per 100 g in mg. NULL when not stated on the label.';

COMMENT ON COLUMN user_ingredients.potassium_mg IS
'Potassium per 100 g in mg. NULL when not stated on the label.';
