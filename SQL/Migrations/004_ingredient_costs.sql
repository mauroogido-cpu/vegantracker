-- =============================================================
-- Vegan Tracker — 004_ingredient_costs.sql
-- Align ingredient_costs with the app code:
--   1. price_per_100g is stored as a plain column (the app computes
--      price / quantity_g * 100). If 001 created it as GENERATED,
--      convert it so it can be written on insert/upsert.
--   2. UNIQUE (user_id, ingredient_id) so upsert(..., { onConflict })
--      works (one cost row per user + ingredient).
--
-- Idempotent: safe to re-run.
-- =============================================================

-- 1. Convert price_per_100g from a generated column to a plain one.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ingredient_costs'
      AND column_name  = 'price_per_100g'
      AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE public.ingredient_costs DROP COLUMN price_per_100g;
    ALTER TABLE public.ingredient_costs ADD COLUMN price_per_100g NUMERIC(10,4);
    UPDATE public.ingredient_costs
      SET price_per_100g = ROUND(price / NULLIF(quantity_g, 0) * 100, 4);
  END IF;
END $$;

-- 2. One cost row per (user, ingredient) for ON CONFLICT upsert.
CREATE UNIQUE INDEX IF NOT EXISTS ingredient_costs_user_ingredient_uidx
  ON public.ingredient_costs (user_id, ingredient_id);
