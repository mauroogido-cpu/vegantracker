-- =============================================================
-- Vegan Tracker — seeds/ingredients_fruits_tubers.sql
-- Frutas y tubérculos adicionales.
-- Valores por 100 g de porción comestible.
--
-- Fuente principal: USDA SR Legacy 2018 (FoodData Central)
-- Excepciones marcadas con (*):
--   lúcuma, pitahaya — INCAP Tabla de Composición de Alimentos
--   para Centroamérica, 2012 / CENAN-INS Perú 2017.
--
-- Frutas:  7 items (mandarina, melón cantaloupe, melón honeydew,
--           coco, chirimoya, lúcuma*, pitahaya/fruto de dragón*)
-- Tubérculos: 4 items (papa, remolacha, camote, yuca)
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

-- ── FRUTAS ────────────────────────────────────────────────────
-- fdcId 169105 · USDA SR Legacy
('Tangerine (raw)',           'fruits',  53, 0.81, 13.30, 0.31, 1.8, 0.150,  37.00, 0.070, 0.000, 0.000, 26.70, 0.000, 169105),
-- fdcId 169092 · USDA SR Legacy
('Melon, cantaloupe (raw)',   'fruits',  34, 0.84,  8.16, 0.19, 0.9, 0.210,   9.00, 0.180, 0.000, 0.000, 36.70, 0.000, 169092),
-- fdcId 169911 · USDA SR Legacy
('Melon, honeydew (raw)',     'fruits',  36, 0.54,  9.09, 0.14, 0.8, 0.170,   6.00, 0.090, 0.000, 0.000, 18.00, 0.000, 169911),
-- fdcId 170169 · USDA SR Legacy
('Coconut meat (raw)',        'fruits', 354, 3.33, 15.20,33.50, 9.0, 2.430,  14.00, 1.100, 0.000, 0.000,  3.30, 0.000, 170169),
-- fdcId 173953 · USDA SR Legacy
('Cherimoya (raw)',           'fruits',  75, 1.57, 17.70, 0.68, 3.0, 0.270,  10.00, 0.160, 0.000, 0.000, 12.60, 0.159, 173953),
-- (*) Lúcuma — INCAP/CENAN; fdc_id NULL (no figura en SR Legacy 2018)
('Lucuma (raw)',              'fruits', 123, 1.50, 29.40, 0.60, 2.4, 0.430,  16.00, 0.400, 0.000, 0.000,  5.40, 0.000, NULL),
-- (*) Pitahaya roja — INCAP/CENAN; fdc_id NULL (no figura en SR Legacy 2018)
('Pitahaya, red (raw)',       'fruits',  60, 1.18, 12.94, 0.43, 2.9, 1.900,  18.00, 0.400, 0.000, 0.000,  9.20, 0.000, NULL),

-- ── TUBÉRCULOS ────────────────────────────────────────────────
-- fdcId 170026 · USDA SR Legacy
('Potato (raw)',              'vegetables', 77, 2.05, 17.50, 0.09, 2.1, 0.810,  12.00, 0.300, 0.000, 0.000, 19.70, 0.000, 170026),
-- fdcId 169145 · USDA SR Legacy
('Beet (raw)',                'vegetables', 43, 1.61,  9.56, 0.17, 2.8, 0.800,  16.00, 0.350, 0.000, 0.000,  4.90, 0.000, 169145),
-- fdcId 168482 · USDA SR Legacy
('Sweet potato (raw)',        'vegetables', 86, 1.57, 20.10, 0.05, 3.0, 0.610,  30.00, 0.300, 0.000, 0.000,  2.40, 0.000, 168482),
-- fdcId 169985 · USDA SR Legacy
('Cassava (raw)',             'vegetables',160, 1.36, 38.10, 0.28, 1.8, 0.270,  16.00, 0.340, 0.000, 0.000, 20.60, 0.000, 169985)

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
  -- ── FRUTAS ──────────────────────────────────────────────────
  ('Tangerine (raw)',         'en', 'Tangerine (raw)'),
  ('Tangerine (raw)',         'es', 'Mandarina (cruda)'),
  ('Melon, cantaloupe (raw)', 'en', 'Melon, cantaloupe (raw)'),
  ('Melon, cantaloupe (raw)', 'es', 'Melón cantaloupe (crudo)'),
  ('Melon, honeydew (raw)',   'en', 'Melon, honeydew (raw)'),
  ('Melon, honeydew (raw)',   'es', 'Melón verde (crudo)'),
  ('Coconut meat (raw)',      'en', 'Coconut meat (raw)'),
  ('Coconut meat (raw)',      'es', 'Coco (crudo)'),
  ('Cherimoya (raw)',         'en', 'Cherimoya (raw)'),
  ('Cherimoya (raw)',         'es', 'Chirimoya (cruda)'),
  ('Lucuma (raw)',            'en', 'Lucuma (raw)'),
  ('Lucuma (raw)',            'es', 'Lúcuma (cruda)'),
  ('Pitahaya, red (raw)',     'en', 'Pitahaya, red (raw)'),
  ('Pitahaya, red (raw)',     'es', 'Pitahaya roja (cruda)'),
  -- ── TUBÉRCULOS ──────────────────────────────────────────────
  ('Potato (raw)',            'en', 'Potato (raw)'),
  ('Potato (raw)',            'es', 'Papa (cruda)'),
  ('Beet (raw)',              'en', 'Beet (raw)'),
  ('Beet (raw)',              'es', 'Remolacha (cruda)'),
  ('Sweet potato (raw)',      'en', 'Sweet potato (raw)'),
  ('Sweet potato (raw)',      'es', 'Camote (crudo)'),
  ('Cassava (raw)',           'en', 'Cassava (raw)'),
  ('Cassava (raw)',           'es', 'Yuca (cruda)')
) AS t(name_en, locale, name) ON ing.name_en = t.name_en
ON CONFLICT (ingredient_id, locale) DO NOTHING;

COMMIT;
