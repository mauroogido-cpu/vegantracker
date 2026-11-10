-- migration_fix_nutrients.sql
-- Fills in the 10 extended nutrient columns for ingredients that were inserted
-- after migration_nutrients.sql ran (mostly fruits) and therefore still have 0s.
-- Sources: USDA SR Legacy 2018 (https://fdc.nal.usda.gov/)
-- Idempotent: uses WHERE fdc_id = ... so safe to re-run.
-- Lucuma and Pitahaya red have no USDA fdc_id in SR Legacy 2018; they remain 0.

-- Tangerine (fdc_id=169105)
UPDATE ingredients SET
  potassium_mg     = 166,
  sodium_mg        = 2,
  selenium_mcg     = 0.1,
  vit_a_rae_mcg    = 34,
  folate_mcg       = 16,
  magnesium_mg     = 12,
  vit_k_mcg        = 0.0,
  vit_e_mg         = 0.2,
  vit_b6_mg        = 0.078,
  choline_mg       = 10.2
WHERE fdc_id = 169105
  AND (potassium_mg = 0 OR sodium_mg = 0 OR selenium_mcg = 0
       OR vit_a_rae_mcg = 0 OR folate_mcg = 0 OR magnesium_mg = 0
       OR vit_e_mg = 0 OR vit_b6_mg = 0 OR choline_mg = 0);

-- Melon, cantaloupe (fdc_id=169092)
UPDATE ingredients SET
  potassium_mg     = 267,
  sodium_mg        = 16,
  selenium_mcg     = 0.4,
  vit_a_rae_mcg    = 169,
  folate_mcg       = 21,
  magnesium_mg     = 12,
  vit_k_mcg        = 2.5,
  vit_e_mg         = 0.05,
  vit_b6_mg        = 0.072,
  choline_mg       = 7.6
WHERE fdc_id = 169092
  AND (potassium_mg = 0 OR sodium_mg = 0 OR selenium_mcg = 0
       OR vit_a_rae_mcg = 0 OR folate_mcg = 0 OR magnesium_mg = 0
       OR vit_k_mcg = 0 OR vit_e_mg = 0 OR vit_b6_mg = 0 OR choline_mg = 0);

-- Melon, honeydew (fdc_id=169911)
UPDATE ingredients SET
  potassium_mg     = 228,
  sodium_mg        = 18,
  selenium_mcg     = 0.7,
  vit_a_rae_mcg    = 3,
  folate_mcg       = 19,
  magnesium_mg     = 10,
  vit_k_mcg        = 2.9,
  vit_e_mg         = 0.02,
  vit_b6_mg        = 0.088,
  choline_mg       = 7.6
WHERE fdc_id = 169911
  AND (potassium_mg = 0 OR sodium_mg = 0 OR selenium_mcg = 0
       OR vit_a_rae_mcg = 0 OR folate_mcg = 0 OR magnesium_mg = 0
       OR vit_k_mcg = 0 OR vit_e_mg = 0 OR vit_b6_mg = 0 OR choline_mg = 0);

-- Coconut meat (fdc_id=170169)
UPDATE ingredients SET
  potassium_mg     = 356,
  sodium_mg        = 20,
  selenium_mcg     = 10.1,
  vit_a_rae_mcg    = 0,
  folate_mcg       = 26,
  magnesium_mg     = 32,
  vit_k_mcg        = 0.2,
  vit_e_mg         = 0.24,
  vit_b6_mg        = 0.054,
  choline_mg       = 12.1
WHERE fdc_id = 170169
  AND (potassium_mg = 0 OR sodium_mg = 0 OR selenium_mcg = 0
       OR folate_mcg = 0 OR magnesium_mg = 0
       OR vit_k_mcg = 0 OR vit_e_mg = 0 OR vit_b6_mg = 0 OR choline_mg = 0);

-- Cherimoya (fdc_id=173953)
-- Note: selenium_mcg, vit_a_rae_mcg, vit_k_mcg, choline_mg not measured in SR Legacy 2018
UPDATE ingredients SET
  potassium_mg     = 287,
  sodium_mg        = 7,
  selenium_mcg     = 0,
  vit_a_rae_mcg    = 0,
  folate_mcg       = 23,
  magnesium_mg     = 17,
  vit_k_mcg        = 0,
  vit_e_mg         = 0.27,
  vit_b6_mg        = 0.257,
  choline_mg       = 0
WHERE fdc_id = 173953
  AND (potassium_mg = 0 OR sodium_mg = 0 OR folate_mcg = 0
       OR magnesium_mg = 0 OR vit_e_mg = 0 OR vit_b6_mg = 0);

-- Mung bean sprouts (fdc_id=169957)
UPDATE ingredients SET
  potassium_mg     = 149,
  sodium_mg        = 6,
  selenium_mcg     = 0.6,
  vit_a_rae_mcg    = 1,
  folate_mcg       = 61,
  magnesium_mg     = 21,
  vit_k_mcg        = 33,
  vit_e_mg         = 0.1,
  vit_b6_mg        = 0.088,
  choline_mg       = 14.4
WHERE fdc_id = 169957
  AND (potassium_mg = 0 OR sodium_mg = 0 OR selenium_mcg = 0
       OR vit_a_rae_mcg = 0 OR folate_mcg = 0 OR magnesium_mg = 0
       OR vit_k_mcg = 0 OR vit_e_mg = 0 OR vit_b6_mg = 0 OR choline_mg = 0);

-- Turnip (fdc_id=170465)
UPDATE ingredients SET
  potassium_mg     = 191,
  sodium_mg        = 67,
  selenium_mcg     = 0.7,
  vit_a_rae_mcg    = 0,
  folate_mcg       = 15,
  magnesium_mg     = 11,
  vit_k_mcg        = 0.1,
  vit_e_mg         = 0.03,
  vit_b6_mg        = 0.09,
  choline_mg       = 11.1
WHERE fdc_id = 170465
  AND (potassium_mg = 0 OR sodium_mg = 0 OR selenium_mcg = 0
       OR folate_mcg = 0 OR magnesium_mg = 0
       OR vit_k_mcg = 0 OR vit_e_mg = 0 OR vit_b6_mg = 0 OR choline_mg = 0);
