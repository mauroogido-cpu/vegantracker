-- =============================================================
-- Migration 017: Fix recipes.category CHECK constraint
-- Align DB values with the app's RecipeCategory type.
-- Previous constraint had meal-time values (breakfast/lunch…)
-- which were wrong — those belong to meal_log.meal_type.
-- Adds: sauces, soups
-- =============================================================

ALTER TABLE recipes
  DROP CONSTRAINT IF EXISTS recipes_category_check;

ALTER TABLE recipes
  ALTER COLUMN category SET DEFAULT 'main_dishes';

ALTER TABLE recipes
  ADD CONSTRAINT recipes_category_check
    CHECK (category IN (
      'salads_dips',
      'main_dishes',
      'breads_tortillas',
      'desserts',
      'smoothies',
      'sauces',
      'soups'
    ));
