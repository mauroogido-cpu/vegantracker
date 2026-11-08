-- =============================================================
-- Vegan Tracker — 001_initial.sql
-- Full schema: tables, indexes, triggers
-- All nutritional values are per 100 g of ingredient
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- INGREDIENTS
-- Seed data (no user ownership). Nutritional values from USDA
-- FoodData Central (fdc_id keeps the reference).
-- =============================================================
CREATE TABLE ingredients (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en     TEXT        NOT NULL,
  category    TEXT        NOT NULL
                CHECK (category IN (
                  'fruits', 'vegetables', 'grains',
                  'legumes', 'proteins', 'seeds', 'other'
                )),
  -- Energy & macronutrients (per 100 g)
  cal         NUMERIC(8,2) NOT NULL DEFAULT 0,
  protein_g   NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs_g     NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat_g       NUMERIC(8,2) NOT NULL DEFAULT 0,
  fiber_g     NUMERIC(8,2) NOT NULL DEFAULT 0,
  -- Minerals
  iron_mg     NUMERIC(8,3) NOT NULL DEFAULT 0,
  calcium_mg  NUMERIC(8,2) NOT NULL DEFAULT 0,
  zinc_mg     NUMERIC(8,3) NOT NULL DEFAULT 0,
  -- Vitamins & micronutrients
  vit_b12_mcg NUMERIC(8,3) NOT NULL DEFAULT 0,
  vit_d_mcg   NUMERIC(8,3) NOT NULL DEFAULT 0,
  vit_c_mg    NUMERIC(8,2) NOT NULL DEFAULT 0,
  omega3_g    NUMERIC(8,3) NOT NULL DEFAULT 0,
  -- Source traceability
  fdc_id      INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INGREDIENT TRANSLATIONS
-- One row per (ingredient, locale). EN rows duplicate name_en
-- so queries can always use a single JOIN.
-- =============================================================
CREATE TABLE ingredient_translations (
  id            UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID  NOT NULL
                  REFERENCES ingredients(id) ON DELETE CASCADE,
  locale        TEXT  NOT NULL
                  CHECK (locale IN ('en', 'es', 'pt-BR', 'ja')),
  name          TEXT  NOT NULL,
  UNIQUE (ingredient_id, locale)
);

-- =============================================================
-- INGREDIENT COSTS  (per user, per purchase)
-- price_per_100g is a computed column to avoid stale math.
-- =============================================================
CREATE TABLE ingredient_costs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id   UUID        NOT NULL
                    REFERENCES ingredients(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL
                    REFERENCES auth.users(id) ON DELETE CASCADE,
  price           NUMERIC(10,2) NOT NULL,
  quantity_g      NUMERIC(10,2) NOT NULL,
  price_per_100g  NUMERIC(10,4)
                    GENERATED ALWAYS AS (price / quantity_g * 100) STORED,
  currency        TEXT        NOT NULL DEFAULT 'PEN'
                    CHECK (currency IN ('PEN','ARS','USD','EUR','INR','BRL','JPY')),
  store           TEXT,
  purchased_at    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- RECIPES
-- is_public = true  → visible in the shared catalog.
-- source_recipe_id  → set when forked from another recipe.
-- =============================================================
CREATE TABLE recipes (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL
                     REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  servings         INTEGER     NOT NULL DEFAULT 1
                     CHECK (servings > 0),
  category         TEXT        NOT NULL DEFAULT 'other'
                     CHECK (category IN (
                       'breakfast', 'lunch', 'dinner',
                       'snack', 'dessert', 'other'
                     )),
  is_public        BOOLEAN     NOT NULL DEFAULT FALSE,
  source_recipe_id UUID
                     REFERENCES recipes(id) ON DELETE SET NULL,
  prep_time_min    INTEGER,
  instructions     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- RECIPE INGREDIENTS
-- quantity_g is the amount of this ingredient in the recipe.
-- sort_order lets the UI display ingredients in a custom order.
-- =============================================================
CREATE TABLE recipe_ingredients (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     UUID        NOT NULL
                  REFERENCES recipes(id)     ON DELETE CASCADE,
  ingredient_id UUID        NOT NULL
                  REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity_g    NUMERIC(8,2) NOT NULL
                  CHECK (quantity_g > 0),
  notes         TEXT,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  UNIQUE (recipe_id, ingredient_id)
);

-- =============================================================
-- MEAL LOG
-- Supports two entry types (enforced by CHECK constraint):
--   Recipe entry  → recipe_id IS NOT NULL, servings IS NOT NULL
--   Loose entry   → ingredient_id IS NOT NULL, quantity_g IS NOT NULL
-- =============================================================
CREATE TABLE meal_log (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL
                  REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
  meal_type     TEXT        NOT NULL
                  CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  recipe_id     UUID        REFERENCES recipes(id)     ON DELETE SET NULL,
  ingredient_id UUID        REFERENCES ingredients(id) ON DELETE SET NULL,
  servings      NUMERIC(6,2),   -- used when recipe_id is set
  quantity_g    NUMERIC(8,2),   -- used when ingredient_id is set
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meal_log_one_source CHECK (
    (
      recipe_id     IS NOT NULL AND
      ingredient_id IS NULL     AND
      servings      IS NOT NULL AND
      quantity_g    IS NULL
    ) OR (
      ingredient_id IS NOT NULL AND
      recipe_id     IS NULL     AND
      quantity_g    IS NOT NULL AND
      servings      IS NULL
    )
  )
);

-- =============================================================
-- INDEXES
-- =============================================================

-- ingredient_translations: lookups by ingredient and by locale
CREATE INDEX idx_itrans_ingredient_id ON ingredient_translations(ingredient_id);
CREATE INDEX idx_itrans_locale        ON ingredient_translations(locale);

-- ingredient_costs: user browsing their own prices for an ingredient
CREATE INDEX idx_icosts_ingredient_user ON ingredient_costs(ingredient_id, user_id);

-- recipes: user's recipe list + partial index for the public catalog
CREATE INDEX idx_recipes_user_id  ON recipes(user_id);
CREATE INDEX idx_recipes_public   ON recipes(is_public)
  WHERE is_public = TRUE;

-- recipe_ingredients: ingredient list for a recipe
CREATE INDEX idx_ri_recipe_id ON recipe_ingredients(recipe_id);

-- meal_log: daily diary queries (always filtered by user + date)
CREATE INDEX idx_meal_log_user_date ON meal_log(user_id, logged_at);

-- =============================================================
-- updated_at TRIGGER for recipes
-- =============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();
