-- =============================================================
-- Vegan Tracker — seeds/sweeteners_dates_raisins.sql
-- Endulzantes naturales, dátiles y pasas de uva.
-- All values per 100 g (USDA SR Legacy 2018).
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

-- ── SWEETENERS ────────────────────────────────────────────────
('Sugar (white, granulated)', 'other', 387,  0.00, 100.00, 0.00, 0.0,  0.050,   1.00, 0.010, 0.000, 0.000, 0.00, 0.000, 169655),
-- Panela / mascabo / turbinado — USDA los agrupa bajo "Sugar, turbinado" (fdc_id 170674)
('Panela / raw cane sugar',   'other', 399,  0.00,  99.80, 0.00, 0.0,  0.370,  12.00, 0.030, 0.000, 0.000, 0.00, 0.000, 170674),

-- ── DRIED FRUITS (endulzantes naturales) ──────────────────────
('Dates, medjool',            'fruits', 277,  1.81,  75.00, 0.15, 6.7,  0.900,  64.00, 0.440, 0.000, 0.000, 0.00, 0.000, 168191),
('Dates, deglet noor',        'fruits', 282,  2.45,  75.00, 0.39, 8.0,  1.020,  39.00, 0.290, 0.000, 0.000, 0.40, 0.003, 171726),
('Raisins (dark, seedless)',  'fruits', 299,  3.30,  79.30, 0.25, 4.5,  1.790,  62.00, 0.360, 0.000, 0.000, 2.30, 0.014, 168165);

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
  -- ── SWEETENERS ───────────────────────────────────────────────
  ('Sugar (white, granulated)', 'en', 'Sugar (white, granulated)'),
  ('Sugar (white, granulated)', 'es', 'Azúcar blanca'),
  ('Panela / raw cane sugar',   'en', 'Panela / raw cane sugar'),
  ('Panela / raw cane sugar',   'es', 'Panela'),
  -- ── DRIED FRUITS ─────────────────────────────────────────────
  ('Dates, medjool',            'en', 'Dates, medjool'),
  ('Dates, medjool',            'es', 'Dátiles medjool'),
  ('Dates, deglet noor',        'en', 'Dates, deglet noor'),
  ('Dates, deglet noor',        'es', 'Dátiles deglet noor'),
  ('Raisins (dark, seedless)',  'en', 'Raisins (dark, seedless)'),
  ('Raisins (dark, seedless)',  'es', 'Pasas de uva')
) AS t(name_en, locale, name) ON ing.name_en = t.name_en;

COMMIT;
