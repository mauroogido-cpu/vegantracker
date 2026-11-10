-- =============================================================
-- Vegan Tracker — 009_rda_reference.sql
-- RDA reference table seeded with NIH Dietary Reference Intakes
-- (National Academies of Sciences, Engineering, and Medicine).
--
-- Sources:
--   • Vitamins : DRI Tables (NAM, 2024) — ods.od.nih.gov
--   • Minerals : DRI Tables (NAM, 2024)
--   • Vegan multipliers (iron ×1.8, zinc ×1.5) are NOT applied
--     here — they are applied in get_rda_for_user() so the raw
--     NIH values remain auditable in this table.
--
-- Matching logic (in get_rda_for_user):
--   sex IN ('male','female','other') matched to 'male'/'female';
--   'other' falls back to the lower of the two values.
--   pregnant / lactating override the base female row.
--
-- Run after 003_grants.sql
-- =============================================================

CREATE TABLE rda_reference (
  id              SMALLSERIAL  PRIMARY KEY,

  -- ── Demographics ─────────────────────────────────────────────
  sex             TEXT         NOT NULL CHECK (sex IN ('male', 'female')),
  age_min         SMALLINT     NOT NULL,   -- inclusive
  age_max         SMALLINT     NOT NULL,   -- inclusive (use 120 for 71+)
  pregnant        BOOLEAN      NOT NULL DEFAULT FALSE,
  lactating       BOOLEAN      NOT NULL DEFAULT FALSE,

  -- ── Energy & macronutrients ───────────────────────────────────
  cal             NUMERIC(7,1) NOT NULL,   -- kcal/day  (IOM EER estimate)
  protein_g       NUMERIC(6,1) NOT NULL,
  carbs_g         NUMERIC(6,1) NOT NULL,
  fat_g           NUMERIC(6,1) NOT NULL,
  fiber_g         NUMERIC(5,1) NOT NULL,

  -- ── Minerals ─────────────────────────────────────────────────
  iron_mg         NUMERIC(5,1) NOT NULL,
  calcium_mg      NUMERIC(7,1) NOT NULL,
  zinc_mg         NUMERIC(5,1) NOT NULL,
  potassium_mg    NUMERIC(7,1) NOT NULL,
  sodium_mg       NUMERIC(7,1) NOT NULL,
  selenium_mcg    NUMERIC(5,1) NOT NULL,
  magnesium_mg    NUMERIC(6,1) NOT NULL,

  -- ── Vitamins ─────────────────────────────────────────────────
  vit_b12_mcg     NUMERIC(5,1) NOT NULL,
  vit_d_mcg       NUMERIC(5,1) NOT NULL,
  vit_c_mg        NUMERIC(6,1) NOT NULL,
  vit_a_rae_mcg   NUMERIC(6,1) NOT NULL,
  folate_mcg      NUMERIC(6,1) NOT NULL,
  vit_k_mcg       NUMERIC(6,1) NOT NULL,
  vit_e_mg        NUMERIC(5,1) NOT NULL,
  vit_b6_mg       NUMERIC(5,1) NOT NULL,
  choline_mg      NUMERIC(6,1) NOT NULL,

  -- ── Fatty acids ──────────────────────────────────────────────
  omega3_g        NUMERIC(5,1) NOT NULL,
  saturated_fat_g NUMERIC(5,1) NOT NULL,  -- WHO upper limit (<10% of kcal)

  CONSTRAINT rda_ref_age_range CHECK (age_min <= age_max),
  CONSTRAINT rda_ref_unique UNIQUE (sex, age_min, pregnant, lactating)
);

-- Fast lookup
CREATE INDEX idx_rda_ref_lookup
  ON rda_reference (sex, age_min, age_max, pregnant, lactating);

-- =============================================================
-- RLS — read-only for every authenticated user (seed data)
-- =============================================================
ALTER TABLE rda_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rda_reference: authenticated read"
  ON rda_reference FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON rda_reference TO authenticated, service_role;

-- =============================================================
-- SEED — NIH DRI values (2024)
-- Columns: sex, age_min, age_max, pregnant, lactating,
--          cal, protein_g, carbs_g, fat_g, fiber_g,
--          iron_mg, calcium_mg, zinc_mg, potassium_mg, sodium_mg,
--          selenium_mcg, magnesium_mg,
--          vit_b12_mcg, vit_d_mcg, vit_c_mg, vit_a_rae_mcg,
--          folate_mcg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg,
--          omega3_g, saturated_fat_g
-- =============================================================
INSERT INTO rda_reference (
  sex, age_min, age_max, pregnant, lactating,
  cal, protein_g, carbs_g, fat_g, fiber_g,
  iron_mg, calcium_mg, zinc_mg, potassium_mg, sodium_mg, selenium_mcg, magnesium_mg,
  vit_b12_mcg, vit_d_mcg, vit_c_mg, vit_a_rae_mcg, folate_mcg,
  vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg, omega3_g, saturated_fat_g
) VALUES

-- ── MALE ─────────────────────────────────────────────────────
-- 19–30
('male', 19, 30, false, false,
 2500, 56, 300, 78, 38,
 8, 1000, 11, 3400, 2300, 55, 400,
 2.4, 15, 90, 900, 400,
 120, 15, 1.3, 550, 1.6, 25),

-- 31–50
('male', 31, 50, false, false,
 2400, 56, 275, 78, 38,
 8, 1000, 11, 3400, 2300, 55, 420,
 2.4, 15, 90, 900, 400,
 120, 15, 1.3, 550, 1.6, 24),

-- 51–70
('male', 51, 70, false, false,
 2200, 56, 250, 78, 30,
 8, 1000, 11, 3400, 2300, 55, 420,
 2.4, 15, 90, 900, 400,
 120, 15, 1.7, 550, 1.6, 22),

-- 71+
('male', 71, 120, false, false,
 2000, 56, 230, 78, 30,
 8, 1200, 11, 3400, 2300, 55, 420,
 2.4, 20, 90, 900, 400,
 120, 15, 1.7, 550, 1.6, 20),

-- ── FEMALE ───────────────────────────────────────────────────
-- 19–30
('female', 19, 30, false, false,
 2000, 46, 250, 65, 25,
 18, 1000, 8, 2600, 2300, 55, 310,
 2.4, 15, 75, 700, 400,
 90, 15, 1.3, 425, 1.1, 20),

-- 31–50
('female', 31, 50, false, false,
 1800, 46, 225, 65, 25,
 18, 1000, 8, 2600, 2300, 55, 320,
 2.4, 15, 75, 700, 400,
 90, 15, 1.3, 425, 1.1, 18),

-- 51–70
('female', 51, 70, false, false,
 1800, 46, 210, 65, 21,
 8, 1200, 8, 2600, 2300, 55, 320,
 2.4, 15, 75, 700, 400,
 90, 15, 1.5, 425, 1.1, 18),

-- 71+
('female', 71, 120, false, false,
 1600, 46, 190, 65, 21,
 8, 1200, 8, 2600, 2300, 55, 320,
 2.4, 20, 75, 700, 400,
 90, 15, 1.5, 425, 1.1, 16),

-- ── FEMALE — PREGNANT ────────────────────────────────────────
-- 19–30 pregnant
('female', 19, 30, true, false,
 2200, 71, 175, 78, 28,
 27, 1000, 11, 2900, 2300, 60, 350,
 2.6, 15, 85, 770, 600,
 90, 15, 1.9, 450, 1.4, 22),

-- 31–50 pregnant
('female', 31, 50, true, false,
 2200, 71, 175, 78, 28,
 27, 1000, 11, 2900, 2300, 60, 360,
 2.6, 15, 85, 770, 600,
 90, 15, 1.9, 450, 1.4, 22),

-- ── FEMALE — LACTATING ───────────────────────────────────────
-- 19–30 lactating
('female', 19, 30, false, true,
 2500, 71, 210, 78, 29,
 9, 1000, 12, 2800, 2300, 70, 310,
 2.8, 15, 120, 1300, 500,
 90, 19, 2.0, 550, 1.3, 25),

-- 31–50 lactating
('female', 31, 50, false, true,
 2500, 71, 210, 78, 29,
 9, 1000, 12, 2800, 2300, 70, 320,
 2.8, 15, 120, 1300, 500,
 90, 19, 2.0, 550, 1.3, 25);

COMMENT ON TABLE rda_reference IS
'NIH Dietary Reference Intakes (National Academies, 2024) by sex and age group.
Raw values — vegan bioavailability multipliers (iron ×1.8, zinc ×1.5) are
applied at query time in get_rda_for_user(), not stored here.';
