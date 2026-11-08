-- =============================================================
-- Vegan Tracker — seeds/ingredients.sql
-- ~80 plant-based ingredients with nutritional data from
-- USDA FoodData Central (SR Legacy / Foundation Foods).
-- All values are per 100 g of edible portion.
-- fdc_id references the FoodData Central NDB number.
--
-- After inserting ingredients we insert EN + ES translations.
-- Additional locales (pt-BR, ja) go in separate migration files.
-- =============================================================

BEGIN;

-- =============================================================
-- INGREDIENTS
-- Columns: name_en, category,
--          cal, protein_g, carbs_g, fat_g, fiber_g,
--          iron_mg, calcium_mg, zinc_mg,
--          vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
--          fdc_id
-- =============================================================

-- Stage the seed rows in a temp table first so this script is
-- idempotent: existing rows are updated in place and only missing
-- rows are inserted (no duplicates on re-run).
DROP TABLE IF EXISTS _seed_ingredients;
CREATE TEMP TABLE _seed_ingredients (
  name_en     TEXT,
  category    TEXT,
  cal         NUMERIC(8,2),
  protein_g   NUMERIC(8,2),
  carbs_g     NUMERIC(8,2),
  fat_g       NUMERIC(8,2),
  fiber_g     NUMERIC(8,2),
  iron_mg     NUMERIC(8,3),
  calcium_mg  NUMERIC(8,2),
  zinc_mg     NUMERIC(8,3),
  vit_b12_mcg NUMERIC(8,3),
  vit_d_mcg   NUMERIC(8,3),
  vit_c_mg    NUMERIC(8,2),
  omega3_g    NUMERIC(8,3),
  fdc_id      INTEGER
) ON COMMIT DROP;

INSERT INTO _seed_ingredients
  (name_en, category,
   cal,    protein_g, carbs_g, fat_g,  fiber_g,
   iron_mg, calcium_mg, zinc_mg,
   vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   fdc_id)
VALUES

-- ── FRUITS ────────────────────────────────────────────────────
('Banana',          'fruits',  89,   1.09, 22.84,  0.33,  2.6,  0.260,   5.00, 0.150, 0.000, 0.000,  8.70, 0.027, 9040),
('Mango',           'fruits',  60,   0.82, 14.98,  0.38,  1.6,  0.160,  11.00, 0.090, 0.000, 0.000, 36.40, 0.049, 9176),
('Avocado',         'fruits', 160,   2.00,  8.53, 14.66,  6.7,  0.550,  12.00, 0.640, 0.000, 0.000, 10.00, 0.111, 9037),
('Papaya',          'fruits',  43,   0.47, 10.82,  0.26,  1.7,  0.250,  20.00, 0.080, 0.000, 0.000, 60.90, 0.009, 9226),
('Orange',          'fruits',  47,   0.94, 11.75,  0.12,  2.4,  0.100,  40.00, 0.070, 0.000, 0.000, 53.20, 0.011, 9200),
('Strawberry',      'fruits',  32,   0.67,  7.68,  0.30,  2.0,  0.410,  16.00, 0.140, 0.000, 0.000, 58.80, 0.065, 9316),
('Pineapple',       'fruits',  50,   0.54, 13.12,  0.12,  1.4,  0.290,  13.00, 0.120, 0.000, 0.000, 47.80, 0.018, 9266),
('Watermelon',      'fruits',  30,   0.61,  7.55,  0.15,  0.4,  0.240,   7.00, 0.100, 0.000, 0.000,  8.10, 0.050, 9326),
('Passion fruit',   'fruits',  97,   2.20, 23.38,  0.70, 10.4,  1.600,  12.00, 0.100, 0.000, 0.000, 30.00, 0.040, 9218),
('Lemon',           'fruits',  29,   1.10,  9.32,  0.30,  2.8,  0.600,  26.00, 0.060, 0.000, 0.000, 53.00, 0.025, 9150),
('Blueberry',       'fruits',  57,   0.74, 14.49,  0.33,  2.4,  0.280,   6.00, 0.160, 0.000, 0.000,  9.70, 0.058, 9050),
('Kiwi',            'fruits',  61,   1.14, 14.66,  0.52,  3.0,  0.310,  34.00, 0.140, 0.000, 0.000, 92.70, 0.042, 9148),
('Peach',           'fruits',  39,   0.91,  9.54,  0.25,  1.5,  0.250,   6.00, 0.170, 0.000, 0.000,  6.60, 0.009, 9236),
('Grape',           'fruits',  69,   0.72, 18.10,  0.16,  0.9,  0.360,  10.00, 0.070, 0.000, 0.000,  3.20, 0.011, 9132),
('Apple',           'fruits',  52,   0.26, 13.81,  0.17,  2.4,  0.120,   6.00, 0.040, 0.000, 0.000,  4.60, 0.009, 9003),

-- ── VEGETABLES ────────────────────────────────────────────────
('Spinach',         'vegetables',  23,  2.86,  3.63,  0.39,  2.2,  2.710,  99.00, 0.530, 0.000, 0.000,  28.10, 0.138, 11457),
('Broccoli',        'vegetables',  34,  2.82,  6.64,  0.37,  2.6,  0.730,  47.00, 0.410, 0.000, 0.000,  89.20, 0.021, 11090),
('Kale',            'vegetables',  49,  4.28,  8.75,  0.93,  3.6,  1.470, 150.00, 0.560, 0.000, 0.000, 120.00, 0.180, 11233),
('Sweet potato',    'vegetables',  86,  1.57, 20.12,  0.05,  3.0,  0.610,  30.00, 0.300, 0.000, 0.000,   2.40, 0.000, 11507),
('Carrot',          'vegetables',  41,  0.93,  9.58,  0.24,  2.8,  0.300,  33.00, 0.240, 0.000, 0.000,   5.90, 0.002, 11124),
('Tomato',          'vegetables',  18,  0.88,  3.89,  0.20,  1.2,  0.270,  10.00, 0.170, 0.000, 0.000,  13.70, 0.003, 11529),
('Cucumber',        'vegetables',  15,  0.65,  3.63,  0.11,  0.5,  0.280,  16.00, 0.200, 0.000, 0.000,   2.80, 0.003, 11205),
('Red bell pepper', 'vegetables',  31,  0.99,  6.03,  0.30,  2.1,  0.430,   7.00, 0.250, 0.000, 0.000, 127.70, 0.021, 11821),
('Zucchini',        'vegetables',  17,  1.21,  3.11,  0.32,  1.0,  0.370,  16.00, 0.320, 0.000, 0.000,  17.90, 0.023, 11477),
('Onion',           'vegetables',  40,  1.10,  9.34,  0.10,  1.7,  0.210,  23.00, 0.170, 0.000, 0.000,   7.40, 0.001, 11282),
('Cauliflower',     'vegetables',  25,  1.92,  4.97,  0.28,  2.0,  0.420,  22.00, 0.270, 0.000, 0.000,  48.20, 0.037, 11135),
('Beetroot',        'vegetables',  43,  1.61,  9.56,  0.17,  2.8,  0.800,  16.00, 0.350, 0.000, 0.000,   4.90, 0.000, 11080),
('Celery',          'vegetables',  16,  0.69,  2.97,  0.17,  1.6,  0.200,  40.00, 0.130, 0.000, 0.000,   3.10, 0.021, 11143),
('Bok choy',        'vegetables',  13,  1.50,  2.18,  0.20,  1.0,  0.800, 105.00, 0.190, 0.000, 0.000,  45.00, 0.019, 11116),
('Pumpkin',         'vegetables',  26,  1.00,  6.50,  0.10,  0.5,  0.800,  21.00, 0.320, 0.000, 0.000,   9.00, 0.001, 11422),
('Corn (cooked)',   'vegetables',  96,  3.41, 20.98,  1.50,  2.0,  0.520,   2.00, 0.460, 0.000, 0.000,   6.20, 0.023, 11168),
('Garlic',          'vegetables', 149,  6.36, 33.06,  0.50,  2.1,  1.700, 181.00, 1.160, 0.000, 0.000,  31.20, 0.019, 11215),

-- ── GRAINS ────────────────────────────────────────────────────
('Brown rice (cooked)',       'grains', 112, 2.32, 23.51, 0.83, 1.8, 0.530, 10.00, 0.620, 0.000, 0.000,  0.00, 0.009, 20037),
('White rice (cooked)',       'grains', 130, 2.69, 28.17, 0.28, 0.4, 0.200, 10.00, 0.490, 0.000, 0.000,  0.00, 0.001, 20045),
('Quinoa (cooked)',           'grains', 120, 4.40, 21.30, 1.92, 2.8, 1.490, 17.00, 1.090, 0.000, 0.000,  0.00, 0.088, 20137),
('Oats (dry)',                'grains', 389,16.89, 66.27, 6.90,10.6, 4.720, 54.00, 3.970, 0.000, 0.000,  0.00, 0.111, 20040),
('Whole wheat pasta (cooked)','grains', 124, 5.33, 26.54, 0.54, 3.9, 1.270, 21.00, 0.980, 0.000, 0.000,  0.00, 0.023, 20420),
('Buckwheat (cooked)',        'grains',  92, 3.38, 19.94, 0.62, 2.7, 0.800,  7.00, 0.720, 0.000, 0.000,  0.00, 0.047, 20009),
('Millet (cooked)',           'grains', 119, 3.51, 23.67, 1.00, 1.3, 0.630,  3.00, 0.910, 0.000, 0.000,  0.00, 0.030, 20031),
('Amaranth (cooked)',         'grains', 102, 3.80, 18.69, 1.60, 2.1, 2.100, 47.00, 0.860, 0.000, 0.000,  0.00, 0.025, 20001),

-- ── LEGUMES ───────────────────────────────────────────────────
('Lentils (cooked)',       'legumes', 116, 9.02, 20.13, 0.38, 7.9, 3.330, 19.00, 1.270, 0.000, 0.000, 1.50, 0.037, 16069),
('Chickpeas (cooked)',     'legumes', 164, 8.86, 27.42, 2.59, 7.6, 2.890, 49.00, 1.530, 0.000, 0.000, 1.30, 0.042, 16057),
('Black beans (cooked)',   'legumes', 132, 8.86, 23.71, 0.54, 8.7, 2.100, 23.00, 1.120, 0.000, 0.000, 0.00, 0.179, 16015),
('Mung beans (cooked)',    'legumes', 105, 7.02, 19.15, 0.38, 7.6, 1.400, 27.00, 0.840, 0.000, 0.000, 1.00, 0.055, 16080),
('Green peas (cooked)',    'legumes',  84, 5.42, 15.63, 0.22, 5.5, 1.540, 25.00, 1.190, 0.000, 0.000,14.20, 0.023, 11310),
('Edamame (cooked)',       'legumes', 121,11.91,  8.91, 5.20, 5.2, 2.270, 60.00, 1.370, 0.000, 0.000, 6.10, 0.300, 11210),
('Kidney beans (cooked)',  'legumes', 127, 8.67, 22.80, 0.50, 7.4, 2.940, 28.00, 1.070, 0.000, 0.000, 1.20, 0.182, 16033),
('Pinto beans (cooked)',   'legumes', 143, 9.01, 26.83, 0.65, 9.0, 2.990, 40.00, 1.230, 0.000, 0.000, 1.60, 0.198, 16043),
('Soybeans (cooked)',      'legumes', 173,16.64,  9.93, 9.00, 6.0, 5.140, 102.00,1.150, 0.000, 0.000, 1.70, 0.750, 16109),

-- ── PROTEINS (plant-based) ────────────────────────────────────
('Tofu, firm',          'proteins',  76,  8.08,  1.87,  4.78, 0.3, 1.610, 350.00, 0.800, 0.000, 0.000, 0.10, 0.189, 16126),
('Tofu, silken',        'proteins',  55,  4.80,  2.00,  2.70, 0.0, 0.800,  23.00, 0.500, 0.000, 0.000, 0.00, 0.100, 16130),
('Tempeh',              'proteins', 193, 18.54,  9.39, 10.80, 0.0, 2.700, 111.00, 1.730, 0.000, 0.000, 0.00, 0.350, 16114),
('Seitan',              'proteins', 370, 75.00, 14.00,  1.90, 0.6, 5.200, 142.00, 0.500, 0.000, 0.000, 0.00, 0.030, 16425),
('Nutritional yeast',   'proteins', 325, 49.95, 37.50,  5.50,16.6,19.100,  25.00, 5.900, 0.100, 0.000, 0.00, 0.100, 11939),
('TVP (dry)',           'proteins', 331, 51.50, 33.90,  1.00,13.4, 9.460, 303.00, 2.840, 0.000, 0.000, 0.00, 0.300, 16128),

-- ── SEEDS & NUTS ──────────────────────────────────────────────
('Chia seeds',      'seeds', 486, 16.54, 42.12, 30.74, 34.4,  7.720, 631.00, 4.580, 0.000, 0.000,  1.60, 17.830, 12006),
('Flaxseeds',       'seeds', 534, 18.29, 28.88, 42.16, 27.3,  5.730, 255.00, 4.340, 0.000, 0.000,  0.60, 22.810, 12220),
('Hemp seeds',      'seeds', 553, 31.56,  8.67, 48.75,  4.0,  7.950,  70.00, 9.900, 0.000, 0.000,  0.50,  8.680, 12012),
('Sesame seeds',    'seeds', 573, 17.73, 23.45, 49.67, 11.8, 14.550, 975.00, 7.750, 0.000, 0.000,  0.00,  0.376, 12023),
('Sunflower seeds', 'seeds', 584, 20.78, 20.00, 51.46,  8.6,  5.250,  78.00, 5.000, 0.000, 0.000,  1.40,  0.066, 12036),
('Pumpkin seeds',   'seeds', 559, 30.23, 10.71, 49.05,  6.0,  8.070,  46.00, 7.810, 0.000, 0.000,  1.90,  0.045, 12016),
('Almonds',         'seeds', 579, 21.15, 21.55, 49.93, 12.5,  3.710, 264.00, 3.120, 0.000, 0.000,  0.00,  0.003, 12061),
('Cashews',         'seeds', 553, 18.22, 30.19, 43.85,  3.3,  6.680,  37.00, 5.780, 0.000, 0.000,  0.50,  0.062, 12087),
('Walnuts',         'seeds', 654, 15.23, 13.71, 65.21,  6.7,  2.910,  98.00, 3.090, 0.000, 0.000,  1.30,  9.080, 12155),
('Brazil nuts',     'seeds', 659, 14.32, 12.27, 67.10,  7.5,  2.430, 160.00, 4.060, 0.000, 0.000,  0.70,  0.019, 12078),
('Peanuts',         'seeds', 567, 25.80, 16.13, 49.24,  8.5,  4.580,  92.00, 3.270, 0.000, 0.000,  0.00,  0.003, 16087),
('Tahini',          'seeds', 595, 16.96, 21.19, 53.76,  9.3,  8.950, 426.00, 4.620, 0.000, 0.000,  0.00,  0.413, 12167),

-- ── OTHER ─────────────────────────────────────────────────────
('Olive oil',               'other', 884,  0.00,  0.00,100.00,  0.0,  0.560,   1.00, 0.000, 0.000, 0.000,  0.00, 0.761, 4053),
('Coconut milk (canned)',   'other', 197,  2.02,  2.81, 21.33,  2.2,  1.640,  16.00, 0.670, 0.000, 0.000,  1.00, 0.025, 12117),
('Coconut oil',             'other', 862,  0.00,  0.00,100.00,  0.0,  0.000,   0.00, 0.000, 0.000, 0.000,  0.00, 0.000, 4047),
('Miso paste',              'other', 199, 11.69, 26.47,  6.00,  5.4,  2.500,  57.00, 2.560, 0.080, 0.000,  0.00, 0.280, 16112),
('Tamari / soy sauce',      'other',  53,  8.14,  4.93,  0.10,  0.8,  2.400,  20.00, 0.500, 0.000, 0.000,  0.00, 0.025, 16124),
('Cocoa powder',            'other', 228, 19.60, 57.90, 13.70, 33.2, 13.860, 128.00, 6.810, 0.000, 0.000,  0.00, 0.013, 19165),
('Dark chocolate (≥70%)',   'other', 598,  7.79, 45.90, 42.63, 10.9, 11.900,  73.00, 3.310, 0.000, 0.000,  0.00, 0.065, 19081),
('Nori (dried seaweed)',    'other',  35,  5.81,  5.11,  0.28,  0.0,  1.800,  70.00, 1.050, 0.064, 0.000, 39.00, 0.100, 11239),
('Wakame (dried seaweed)',  'other',  45,  3.03,  9.14,  0.64,  0.5,  2.180, 150.00, 0.380, 0.000, 0.000,  3.00, 0.168, 11669),
('Almond milk (unswtnd)',   'other',  15,  0.42,  0.58,  1.21,  0.3,  0.370, 184.00, 0.070, 0.000, 1.100,  0.00, 0.001, 93607),
('Oat milk (unswtnd)',      'other',  46,  1.00,  8.00,  1.50,  0.5,  0.200, 120.00, 0.100, 0.000, 1.100,  0.00, 0.020, 2097194),
('Ginger (raw)',            'other',  80,  1.82, 17.77,  0.75,  2.0,  0.600,  16.00, 0.340, 0.000, 0.000,  5.00, 0.131, 11216),
('Turmeric (powder)',       'other', 312,  9.68, 67.14,  3.25, 22.7, 55.000, 183.00, 4.500, 0.000, 0.000,  0.70, 0.483, 2060),
('Hummus',                  'other', 177,  7.73, 14.29,  9.60,  6.0,  2.440,  38.00, 1.260, 0.000, 0.000,  2.10, 0.071, 16158),
-- Peruvian superfoods
('Camu camu (powder)',      'other',  25,  0.40,  6.00,  0.10,  0.4,  0.300,  15.00, 0.100, 0.000, 0.000,2145.00, 0.000, 1097876),
('Maca root (powder)',      'other', 325, 14.40, 71.40,  2.20,  7.1, 16.000, 250.00, 3.800, 0.000, 0.000,  1.70, 0.000, 1100874),
('Lucuma (powder)',         'other',  99,  1.50, 24.00,  0.50,  1.9,  0.400,  16.00, 0.300, 0.000, 0.000,  0.00, 0.010, 2347669),
('Yuca / Cassava (cooked)', 'other', 160,  1.36, 38.06,  0.28,  1.8,  0.270,  16.00, 0.340, 0.000, 0.000, 20.60, 0.001, 11134);

-- Update rows that already exist (also applies data fixes such as
-- the corrected Spinach fdc_id) ...
UPDATE ingredients AS i
SET category    = s.category,
    cal         = s.cal,
    protein_g   = s.protein_g,
    carbs_g     = s.carbs_g,
    fat_g       = s.fat_g,
    fiber_g     = s.fiber_g,
    iron_mg     = s.iron_mg,
    calcium_mg  = s.calcium_mg,
    zinc_mg     = s.zinc_mg,
    vit_b12_mcg = s.vit_b12_mcg,
    vit_d_mcg   = s.vit_d_mcg,
    vit_c_mg    = s.vit_c_mg,
    omega3_g    = s.omega3_g,
    fdc_id      = s.fdc_id
FROM _seed_ingredients AS s
WHERE i.name_en = s.name_en;

-- ... and insert only the ones that don't exist yet (first run).
INSERT INTO ingredients
  (name_en, category,
   cal,    protein_g, carbs_g, fat_g,  fiber_g,
   iron_mg, calcium_mg, zinc_mg,
   vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   fdc_id)
SELECT s.name_en, s.category,
       s.cal, s.protein_g, s.carbs_g, s.fat_g, s.fiber_g,
       s.iron_mg, s.calcium_mg, s.zinc_mg,
       s.vit_b12_mcg, s.vit_d_mcg, s.vit_c_mg, s.omega3_g,
       s.fdc_id
FROM _seed_ingredients AS s
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients AS i WHERE i.name_en = s.name_en
);

-- =============================================================
-- INGREDIENT TRANSLATIONS
-- We use a CTE so we can reference ingredients by name_en
-- without hardcoding UUIDs.
-- =============================================================

WITH ing AS (
  SELECT id, name_en FROM ingredients
)
INSERT INTO ingredient_translations (ingredient_id, locale, name)
SELECT ing.id, t.locale, t.name
FROM ing
JOIN (VALUES
  -- ── FRUITS ──────────────────────────────────────────────────
  ('Banana',          'en', 'Banana'),
  ('Banana',          'es', 'Banana'),
  ('Mango',           'en', 'Mango'),
  ('Mango',           'es', 'Mango'),
  ('Avocado',         'en', 'Avocado'),
  ('Avocado',         'es', 'Palta'),
  ('Papaya',          'en', 'Papaya'),
  ('Papaya',          'es', 'Papaya'),
  ('Orange',          'en', 'Orange'),
  ('Orange',          'es', 'Naranja'),
  ('Strawberry',      'en', 'Strawberry'),
  ('Strawberry',      'es', 'Fresa'),
  ('Pineapple',       'en', 'Pineapple'),
  ('Pineapple',       'es', 'Piña'),
  ('Watermelon',      'en', 'Watermelon'),
  ('Watermelon',      'es', 'Sandía'),
  ('Passion fruit',   'en', 'Passion fruit'),
  ('Passion fruit',   'es', 'Maracuyá'),
  ('Lemon',           'en', 'Lemon'),
  ('Lemon',           'es', 'Limón'),
  ('Blueberry',       'en', 'Blueberry'),
  ('Blueberry',       'es', 'Arándano'),
  ('Kiwi',            'en', 'Kiwi'),
  ('Kiwi',            'es', 'Kiwi'),
  ('Peach',           'en', 'Peach'),
  ('Peach',           'es', 'Durazno'),
  ('Grape',           'en', 'Grape'),
  ('Grape',           'es', 'Uva'),
  ('Apple',           'en', 'Apple'),
  ('Apple',           'es', 'Manzana'),
  -- ── VEGETABLES ──────────────────────────────────────────────
  ('Spinach',         'en', 'Spinach'),
  ('Spinach',         'es', 'Espinaca'),
  ('Broccoli',        'en', 'Broccoli'),
  ('Broccoli',        'es', 'Brócoli'),
  ('Kale',            'en', 'Kale'),
  ('Kale',            'es', 'Col rizada'),
  ('Sweet potato',    'en', 'Sweet potato'),
  ('Sweet potato',    'es', 'Camote'),
  ('Carrot',          'en', 'Carrot'),
  ('Carrot',          'es', 'Zanahoria'),
  ('Tomato',          'en', 'Tomato'),
  ('Tomato',          'es', 'Tomate'),
  ('Cucumber',        'en', 'Cucumber'),
  ('Cucumber',        'es', 'Pepino'),
  ('Red bell pepper', 'en', 'Red bell pepper'),
  ('Red bell pepper', 'es', 'Pimiento rojo'),
  ('Zucchini',        'en', 'Zucchini'),
  ('Zucchini',        'es', 'Zapallito'),
  ('Onion',           'en', 'Onion'),
  ('Onion',           'es', 'Cebolla'),
  ('Cauliflower',     'en', 'Cauliflower'),
  ('Cauliflower',     'es', 'Coliflor'),
  ('Beetroot',        'en', 'Beetroot'),
  ('Beetroot',        'es', 'Betarraga'),
  ('Celery',          'en', 'Celery'),
  ('Celery',          'es', 'Apio'),
  ('Bok choy',        'en', 'Bok choy'),
  ('Bok choy',        'es', 'Col china'),
  ('Pumpkin',         'en', 'Pumpkin'),
  ('Pumpkin',         'es', 'Zapallo'),
  ('Corn (cooked)',   'en', 'Corn (cooked)'),
  ('Corn (cooked)',   'es', 'Choclo cocido'),
  ('Garlic',          'en', 'Garlic'),
  ('Garlic',          'es', 'Ajo'),
  -- ── GRAINS ──────────────────────────────────────────────────
  ('Brown rice (cooked)',        'en', 'Brown rice (cooked)'),
  ('Brown rice (cooked)',        'es', 'Arroz integral cocido'),
  ('White rice (cooked)',        'en', 'White rice (cooked)'),
  ('White rice (cooked)',        'es', 'Arroz blanco cocido'),
  ('Quinoa (cooked)',            'en', 'Quinoa (cooked)'),
  ('Quinoa (cooked)',            'es', 'Quinua cocida'),
  ('Oats (dry)',                 'en', 'Oats (dry)'),
  ('Oats (dry)',                 'es', 'Avena cruda'),
  ('Whole wheat pasta (cooked)', 'en', 'Whole wheat pasta (cooked)'),
  ('Whole wheat pasta (cooked)', 'es', 'Pasta integral cocida'),
  ('Buckwheat (cooked)',         'en', 'Buckwheat (cooked)'),
  ('Buckwheat (cooked)',         'es', 'Trigo sarraceno cocido'),
  ('Millet (cooked)',            'en', 'Millet (cooked)'),
  ('Millet (cooked)',            'es', 'Mijo cocido'),
  ('Amaranth (cooked)',          'en', 'Amaranth (cooked)'),
  ('Amaranth (cooked)',          'es', 'Kiwicha cocida'),
  -- ── LEGUMES ─────────────────────────────────────────────────
  ('Lentils (cooked)',       'en', 'Lentils (cooked)'),
  ('Lentils (cooked)',       'es', 'Lentejas cocidas'),
  ('Chickpeas (cooked)',     'en', 'Chickpeas (cooked)'),
  ('Chickpeas (cooked)',     'es', 'Garbanzos cocidos'),
  ('Black beans (cooked)',   'en', 'Black beans (cooked)'),
  ('Black beans (cooked)',   'es', 'Frijoles negros cocidos'),
  ('Mung beans (cooked)',    'en', 'Mung beans (cooked)'),
  ('Mung beans (cooked)',    'es', 'Porotos mung cocidos'),
  ('Green peas (cooked)',    'en', 'Green peas (cooked)'),
  ('Green peas (cooked)',    'es', 'Arvejas cocidas'),
  ('Edamame (cooked)',       'en', 'Edamame (cooked)'),
  ('Edamame (cooked)',       'es', 'Edamame cocido'),
  ('Kidney beans (cooked)',  'en', 'Kidney beans (cooked)'),
  ('Kidney beans (cooked)',  'es', 'Frijoles rojos cocidos'),
  ('Pinto beans (cooked)',   'en', 'Pinto beans (cooked)'),
  ('Pinto beans (cooked)',   'es', 'Frijoles pintos cocidos'),
  ('Soybeans (cooked)',      'en', 'Soybeans (cooked)'),
  ('Soybeans (cooked)',      'es', 'Soya cocida'),
  -- ── PROTEINS ────────────────────────────────────────────────
  ('Tofu, firm',          'en', 'Tofu, firm'),
  ('Tofu, firm',          'es', 'Tofu firme'),
  ('Tofu, silken',        'en', 'Tofu, silken'),
  ('Tofu, silken',        'es', 'Tofu sedoso'),
  ('Tempeh',              'en', 'Tempeh'),
  ('Tempeh',              'es', 'Tempeh'),
  ('Seitan',              'en', 'Seitan'),
  ('Seitan',              'es', 'Seitán'),
  ('Nutritional yeast',   'en', 'Nutritional yeast'),
  ('Nutritional yeast',   'es', 'Levadura nutricional'),
  ('TVP (dry)',           'en', 'TVP (dry)'),
  ('TVP (dry)',           'es', 'Proteína de soja texturizada'),
  -- ── SEEDS & NUTS ────────────────────────────────────────────
  ('Chia seeds',      'en', 'Chia seeds'),
  ('Chia seeds',      'es', 'Semillas de chía'),
  ('Flaxseeds',       'en', 'Flaxseeds'),
  ('Flaxseeds',       'es', 'Semillas de lino'),
  ('Hemp seeds',      'en', 'Hemp seeds'),
  ('Hemp seeds',      'es', 'Semillas de cáñamo'),
  ('Sesame seeds',    'en', 'Sesame seeds'),
  ('Sesame seeds',    'es', 'Semillas de sésamo'),
  ('Sunflower seeds', 'en', 'Sunflower seeds'),
  ('Sunflower seeds', 'es', 'Semillas de girasol'),
  ('Pumpkin seeds',   'en', 'Pumpkin seeds'),
  ('Pumpkin seeds',   'es', 'Pepitas de calabaza'),
  ('Almonds',         'en', 'Almonds'),
  ('Almonds',         'es', 'Almendras'),
  ('Cashews',         'en', 'Cashews'),
  ('Cashews',         'es', 'Cajú'),
  ('Walnuts',         'en', 'Walnuts'),
  ('Walnuts',         'es', 'Nueces'),
  ('Brazil nuts',     'en', 'Brazil nuts'),
  ('Brazil nuts',     'es', 'Nueces de Brasil'),
  ('Peanuts',         'en', 'Peanuts'),
  ('Peanuts',         'es', 'Maní'),
  ('Tahini',          'en', 'Tahini'),
  ('Tahini',          'es', 'Tahini'),
  -- ── OTHER ───────────────────────────────────────────────────
  ('Olive oil',               'en', 'Olive oil'),
  ('Olive oil',               'es', 'Aceite de oliva'),
  ('Coconut milk (canned)',   'en', 'Coconut milk (canned)'),
  ('Coconut milk (canned)',   'es', 'Leche de coco (enlatada)'),
  ('Coconut oil',             'en', 'Coconut oil'),
  ('Coconut oil',             'es', 'Aceite de coco'),
  ('Miso paste',              'en', 'Miso paste'),
  ('Miso paste',              'es', 'Pasta de miso'),
  ('Tamari / soy sauce',      'en', 'Tamari / soy sauce'),
  ('Tamari / soy sauce',      'es', 'Tamari / salsa de soja'),
  ('Cocoa powder',            'en', 'Cocoa powder'),
  ('Cocoa powder',            'es', 'Cacao en polvo'),
  ('Dark chocolate (≥70%)',   'en', 'Dark chocolate (≥70%)'),
  ('Dark chocolate (≥70%)',   'es', 'Chocolate negro (≥70%)'),
  ('Nori (dried seaweed)',    'en', 'Nori (dried seaweed)'),
  ('Nori (dried seaweed)',    'es', 'Alga nori seca'),
  ('Wakame (dried seaweed)',  'en', 'Wakame (dried seaweed)'),
  ('Wakame (dried seaweed)',  'es', 'Alga wakame seca'),
  ('Almond milk (unswtnd)',   'en', 'Almond milk (unsweetened)'),
  ('Almond milk (unswtnd)',   'es', 'Leche de almendras (sin azúcar)'),
  ('Oat milk (unswtnd)',      'en', 'Oat milk (unsweetened)'),
  ('Oat milk (unswtnd)',      'es', 'Leche de avena (sin azúcar)'),
  ('Ginger (raw)',            'en', 'Ginger (raw)'),
  ('Ginger (raw)',            'es', 'Jengibre fresco'),
  ('Turmeric (powder)',       'en', 'Turmeric (powder)'),
  ('Turmeric (powder)',       'es', 'Cúrcuma en polvo'),
  ('Hummus',                  'en', 'Hummus'),
  ('Hummus',                  'es', 'Hummus'),
  ('Camu camu (powder)',      'en', 'Camu camu (powder)'),
  ('Camu camu (powder)',      'es', 'Camu camu en polvo'),
  ('Maca root (powder)',      'en', 'Maca root (powder)'),
  ('Maca root (powder)',      'es', 'Maca en polvo'),
  ('Lucuma (powder)',         'en', 'Lucuma (powder)'),
  ('Lucuma (powder)',         'es', 'Lúcuma en polvo'),
  ('Yuca / Cassava (cooked)', 'en', 'Yuca / Cassava (cooked)'),
  ('Yuca / Cassava (cooked)', 'es', 'Yuca cocida')
) AS t(name_en, locale, name) ON ing.name_en = t.name_en
ON CONFLICT (ingredient_id, locale) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
