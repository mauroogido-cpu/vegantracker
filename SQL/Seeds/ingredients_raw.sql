-- =============================================================
-- Vegan Tracker — seeds/ingredients_raw.sql
-- Raw / dry counterparts of cooked ingredients already in the DB.
-- All values are per 100 g of edible portion (USDA SR Legacy 2018).
-- fdc_id = FoodData Central fdcId (SR Legacy).
--
-- Grains: 8 items  (brown rice, white rice, quinoa, whole-wheat
--         pasta, buckwheat, millet, amaranth, corn sweet raw)
-- Legumes: 10 items (lentils, chickpeas, black beans, mung beans,
--          mung bean sprouts, green peas, kidney beans, pinto beans,
--          soybeans, edamame)
-- Vegetables: 1 item (turnip raw)
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

-- ── GRAINS (raw / dry) ─────────────────────────────────────────
('Brown rice (raw)',         'grains', 367,  7.54, 76.20, 3.20,  3.6, 1.290,   9.00, 2.130, 0.000, 0.000, 0.00, 0.032, 169703),
('White rice (raw)',         'grains', 365,  7.13, 80.00, 0.66,  1.3, 4.310,  28.00, 1.090, 0.000, 0.000, 0.00, 0.031, 168877),
('Quinoa (raw)',             'grains', 368, 14.10, 64.20, 6.07,  7.0, 4.570,  47.00, 3.100, 0.000, 0.000, 0.00, 0.260, 168874),
('Whole wheat pasta (dry)',  'grains', 352, 13.90, 73.40, 2.93,  9.2, 3.620,  29.00, 2.970, 0.000, 0.000, 0.00, 0.070, 169738),
('Buckwheat (raw)',          'grains', 343, 13.20, 71.50, 3.40, 10.0, 2.200,  18.00, 2.400, 0.000, 0.000, 0.00, 0.078, 170286),
('Millet (raw)',             'grains', 378, 11.00, 72.80, 4.22,  8.5, 3.010,   8.00, 1.680, 0.000, 0.000, 0.00, 0.118, 169702),
('Amaranth (raw)',           'grains', 371, 13.60, 65.20, 7.02,  6.7, 7.610, 159.00, 2.870, 0.000, 0.000, 4.20, 0.042, 170682),
('Corn, sweet (raw)',        'vegetables', 86,  3.27, 18.70, 1.35,  2.0, 0.520,   2.00, 0.460, 0.000, 0.000, 6.80, 0.014, 169998),

-- ── LEGUMES (raw / dry) ────────────────────────────────────────
('Lentils (raw)',            'legumes', 352, 24.60, 63.40, 1.06, 10.7, 6.510,  35.00, 3.270, 0.000, 0.000, 4.50, 0.112, 172420),
('Chickpeas (raw)',          'legumes', 378, 20.50, 63.00, 6.04, 12.2, 4.310,  57.00, 2.760, 0.000, 0.000, 4.00, 0.102, 173756),
('Black beans (raw)',        'legumes', 341, 21.60, 62.40, 1.42, 15.5, 5.020, 123.00, 3.650, 0.000, 0.000, 0.00, 0.278, 173734),
('Mung beans (raw)',         'legumes', 347, 23.90, 62.60, 1.15, 16.3, 6.740, 132.00, 2.680, 0.000, 0.000, 4.80, 0.027, 174256),
('Green peas (raw)',         'legumes',  81,  5.42, 14.40, 0.40,  5.7, 1.470,  25.00, 1.240, 0.000, 0.000,40.00, 0.035, 170419),
('Kidney beans (raw)',       'legumes', 337, 22.50, 61.30, 1.06, 15.2, 6.690,  83.00, 2.790, 0.000, 0.000, 4.50, 0.358, 173744),
('Pinto beans (raw)',        'legumes', 347, 21.40, 62.60, 1.23, 15.5, 5.070, 113.00, 2.280, 0.000, 0.000, 6.30, 0.237, 175199),
('Soybeans (raw)',           'legumes', 446, 36.50, 30.20,19.90,  9.3,15.700, 277.00, 4.890, 0.000, 0.000, 6.00, 1.330, 174270),
('Edamame (raw)',            'legumes', 147, 13.00, 11.00, 6.80,  4.2, 3.550, 197.00, 0.990, 0.000, 0.000,29.00, 0.376, 169282),
('Mung bean sprouts (raw)', 'legumes',  30,  3.04,  5.94, 0.18,  1.8, 0.910,  13.00, 0.410, 0.000, 0.000,13.20, 0.016, 169957),
('Turnip (raw)',           'vegetables', 28, 0.90,  6.43, 0.10,  1.8, 0.300,  30.00, 0.270, 0.000, 0.000,21.00, 0.040, 170465)
ON CONFLICT DO NOTHING;

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
  -- ── GRAINS (raw) ────────────────────────────────────────────
  ('Brown rice (raw)',        'en', 'Brown rice (raw)'),
  ('Brown rice (raw)',        'es', 'Arroz integral crudo'),
  ('White rice (raw)',        'en', 'White rice (raw)'),
  ('White rice (raw)',        'es', 'Arroz blanco crudo'),
  ('Quinoa (raw)',            'en', 'Quinoa (raw)'),
  ('Quinoa (raw)',            'es', 'Quinua cruda'),
  ('Whole wheat pasta (dry)', 'en', 'Whole wheat pasta (dry)'),
  ('Whole wheat pasta (dry)', 'es', 'Pasta integral seca'),
  ('Buckwheat (raw)',         'en', 'Buckwheat (raw)'),
  ('Buckwheat (raw)',         'es', 'Trigo sarraceno crudo'),
  ('Millet (raw)',            'en', 'Millet (raw)'),
  ('Millet (raw)',            'es', 'Mijo crudo'),
  ('Amaranth (raw)',          'en', 'Amaranth (raw)'),
  ('Amaranth (raw)',          'es', 'Kiwicha cruda'),
  ('Corn, sweet (raw)',       'en', 'Corn, sweet (raw)'),
  ('Corn, sweet (raw)',       'es', 'Choclo crudo'),
  -- ── LEGUMES (raw) ───────────────────────────────────────────
  ('Lentils (raw)',           'en', 'Lentils (raw)'),
  ('Lentils (raw)',           'es', 'Lentejas crudas'),
  ('Chickpeas (raw)',         'en', 'Chickpeas (raw)'),
  ('Chickpeas (raw)',         'es', 'Garbanzos crudos'),
  ('Black beans (raw)',       'en', 'Black beans (raw)'),
  ('Black beans (raw)',       'es', 'Frijoles negros crudos'),
  ('Mung beans (raw)',        'en', 'Mung beans (raw)'),
  ('Mung beans (raw)',        'es', 'Porotos mung crudos'),
  ('Green peas (raw)',        'en', 'Green peas (raw)'),
  ('Green peas (raw)',        'es', 'Arvejas crudas'),
  ('Kidney beans (raw)',      'en', 'Kidney beans (raw)'),
  ('Kidney beans (raw)',      'es', 'Frijoles rojos crudos'),
  ('Pinto beans (raw)',       'en', 'Pinto beans (raw)'),
  ('Pinto beans (raw)',       'es', 'Frijoles pintos crudos'),
  ('Soybeans (raw)',          'en', 'Soybeans (raw)'),
  ('Soybeans (raw)',          'es', 'Soya cruda'),
  ('Edamame (raw)',            'en', 'Edamame (raw)'),
  ('Edamame (raw)',            'es', 'Edamame crudo'),
  ('Mung bean sprouts (raw)', 'en', 'Mung bean sprouts (raw)'),
  ('Mung bean sprouts (raw)', 'es', 'Brotes de mung crudos'),
  ('Turnip (raw)',            'en', 'Turnip (raw)'),
  ('Turnip (raw)',            'es', 'Nabo crudo')
) AS t(name_en, locale, name) ON ing.name_en = t.name_en
ON CONFLICT (ingredient_id, locale) DO NOTHING;

COMMIT;