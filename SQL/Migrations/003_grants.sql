-- =============================================================
-- Vegan Tracker — 003_grants.sql
-- Table-level grants for the API roles. RLS (002_rls.sql) still
-- enforces row-level access; these grants only make the objects
-- reachable. Least privilege: no TRUNCATE/REFERENCES/TRIGGER.
--
-- Run after 002_rls.sql. Safe to re-run (GRANT is idempotent).
-- =============================================================

-- Schema usage (required before any table access)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ── Catalog / seed data: read-only ───────────────────────────
GRANT SELECT ON ingredients            TO anon, authenticated, service_role;
GRANT SELECT ON ingredient_translations TO anon, authenticated, service_role;

-- ── User-owned data: authenticated users (RLS filters rows) ──
-- service_role is included so server-only tasks (seed/admin) work.
GRANT SELECT, INSERT, UPDATE, DELETE ON ingredient_costs   TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes            TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_ingredients TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_log           TO authenticated, service_role;

-- ── Anonymous read for the public catalog (SEO / SSR) ────────
-- NOTE: these return rows only once anon SELECT RLS policies
-- exist. Without them anon sees 0 rows (no error).
GRANT SELECT ON recipes            TO anon;
GRANT SELECT ON recipe_ingredients TO anon;

-- ── Sequences & functions ────────────────────────────────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- ── Default privileges for future objects ────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
