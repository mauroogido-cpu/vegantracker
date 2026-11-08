-- =============================================================
-- Vegan Tracker — seeds/ingredients_flours.sql
-- Flours / meals — dry, uncooked.
-- All values are per 100 g of edible portion (USDA SR Legacy 2018).
-- fdc_id = FoodData Central fdcId (SR Legacy).
--
-- Grains: 5 items  (all-purpose wheat flour, whole wheat flour,
--         oat flour, rice flour, corn masa harina)
-- Legumes: 1 item  (chickpea flour / besan)
-- =============================================================

BEGIN;

-- =============================================================
-- INGREDIENTS
-- =============================================================

INSERT INTO ingredients
  (name_en, category,
   cal,    protein_g, carbs_g, fat_g,  fiber_g,
   iron_mg, calcium_mg, zinc_mg,
   vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   fdc_id)
VALUES

-- ── FLOURS — GRAINS ───────────────────────────────────────────
('Wheat flour, all-purpose',  'grains', 364, 10.33, 76.31,  0.98,  2.7,  4.640,  15.00, 0.700, 0.000, 0.000, 0.00, 0.047, 169761),
('Wheat flour, whole-grain',  'grains', 340, 13.21, 72.57,  2.50, 10.7,  3.880,  34.00, 2.600, 0.000, 0.000, 0.00, 0.054, 169737),
('Oat flour',                 'grains', 404, 14.66, 65.70,  9.12,  6.5,  4.720,  54.00, 3.970, 0.000, 0.000, 0.00, 0.111, 173903),
('Rice flour (white)',        'grains', 366,  6.00, 80.13,  1.42,  2.4,  0.350,  10.00, 1.000, 0.000, 0.000, 0.00, 0.021, 20062),
('Corn masa harina',          'grains', 361,  8.50, 74.10,  3.84,  7.3,  3.390, 162.00, 1.580, 0.000, 0.000, 0.00, 0.040, 170919),

-- ── FLOURS — LEGUMES ──────────────────────────────────────────
('Chickpea flour (besan)',    'legumes', 387, 22.39, 57.82,  6.69, 10.8,  4.860,  45.00, 2.950, 0.000, 0.000, 0.00, 0.088, 174286);

-- =============================================================
-- INGREDIENT TRANSLATIONS
-- =============================================================

WITH ing AS (
  SELECT id, name_en FROM ingredients
)
INSERT INTO ingredient_translations (ingredient_id, locale, name)
SELECT ing.id, t.locale, t.name
FROM ing
JOIN (VALUES
  -- ── FLOURS ──────────────────────────────────────────────────
  ('Wheat flour, all-purpose', 'en', 'Wheat flour, all-purpose'),
  ('Wheat flour, all-purpose', 'es', 'Harina de trigo sin preparar'),
  ('Wheat flour, whole-grain', 'en', 'Wheat flour, whole-grain'),
  ('Wheat flour, whole-grain', 'es', 'Harina de trigo integral'),
  ('Oat flour',                'en', 'Oat flour'),
  ('Oat flour',                'es', 'Harina de avena'),
  ('Rice flour (white)',       'en', 'Rice flour (white)'),
  ('Rice flour (white)',       'es', 'Harina de arroz blanco'),
  ('Corn masa harina',         'en', 'Corn masa harina'),
  ('Corn masa harina',         'es', 'Harina de maíz (masa harina)'),
  ('Chickpea flour (besan)',   'en', 'Chickpea flour (besan)'),
  ('Chickpea flour (besan)',   'es', 'Harina de garbanzo (besan)')
) AS t(name_en, locale, name) ON ing.name_en = t.name_en;

COMMIT;
