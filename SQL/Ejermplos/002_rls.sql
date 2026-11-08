-- =============================================================
-- Vegan Tracker — 002_rls.sql
-- Row Level Security policies for all tables
-- Run after 001_initial.sql
-- =============================================================

-- Enable RLS on every table
ALTER TABLE ingredients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_costs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log               ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- INGREDIENTS — read-only for every authenticated user
-- (seed data managed by admins, not by end-users)
-- =============================================================
CREATE POLICY "ingredients: authenticated read"
  ON ingredients
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================
-- INGREDIENT TRANSLATIONS — same as ingredients
-- =============================================================
CREATE POLICY "ingredient_translations: authenticated read"
  ON ingredient_translations
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================
-- INGREDIENT COSTS — full CRUD, own rows only
-- =============================================================
CREATE POLICY "ingredient_costs: select own"
  ON ingredient_costs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ingredient_costs: insert own"
  ON ingredient_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ingredient_costs: update own"
  ON ingredient_costs
  FOR UPDATE
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ingredient_costs: delete own"
  ON ingredient_costs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================
-- RECIPES — own recipes + public catalog
-- =============================================================
CREATE POLICY "recipes: select own or public"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "recipes: insert own"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "recipes: update own"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "recipes: delete own"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================
-- RECIPE INGREDIENTS
-- SELECT: visible if the parent recipe is accessible
-- INSERT/UPDATE/DELETE: only if the parent recipe belongs to the user
-- =============================================================
CREATE POLICY "recipe_ingredients: select if recipe accessible"
  ON recipe_ingredients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.user_id = auth.uid() OR r.is_public = TRUE)
    )
  );

CREATE POLICY "recipe_ingredients: insert if own recipe"
  ON recipe_ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients: update if own recipe"
  ON recipe_ingredients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients: delete if own recipe"
  ON recipe_ingredients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND r.user_id = auth.uid()
    )
  );

-- =============================================================
-- MEAL LOG — full CRUD, own rows only
-- =============================================================
CREATE POLICY "meal_log: select own"
  ON meal_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "meal_log: insert own"
  ON meal_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_log: update own"
  ON meal_log
  FOR UPDATE
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_log: delete own"
  ON meal_log
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
