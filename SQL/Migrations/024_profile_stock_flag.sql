-- =============================================================
-- Vegan Tracker — 024_profile_stock_flag.sql
-- Agrega stock_tracking_enabled a user_profiles.
--
-- false (default): costos de receta usan ingredient_costs (comportamiento actual)
-- true:            costos de receta usan WAC de stock_movements
--
-- IDEMPOTENTE — safe to re-run.
-- Run after 023_prep_tasks.sql
-- =============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS stock_tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN user_profiles.stock_tracking_enabled IS
'Cuando TRUE, el módulo Despensa está activado y los costos de receta
usan el WAC de stock_movements en lugar de ingredient_costs.
Desactivado por defecto para mantener compatibilidad con el MVP actual.';
