-- =============================================================
-- Vegan Tracker — 016_profile_height_activity.sql
-- Add height_cm and activity_level to user_profiles.
-- These fields enable Mifflin-St Jeor calorie calculation
-- in get_rda_for_user().
--
-- Run after 008_user_profiles.sql and before the v4 of
-- 010_rpc_get_rda.sql, which reads both columns.
-- =============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS height_cm    NUMERIC(5,1)
    CHECK (height_cm BETWEEN 50 AND 300),

  ADD COLUMN IF NOT EXISTS activity_level TEXT
    DEFAULT 'sedentary'
    CHECK (activity_level IN (
      'sedentary',       -- desk job, little/no exercise          PAL 1.2
      'lightly_active',  -- light exercise 1–3 days/week          PAL 1.375
      'moderately_active',-- moderate exercise 3–5 days/week      PAL 1.55
      'very_active'      -- hard exercise 6–7 days/week           PAL 1.725
    ));

COMMENT ON COLUMN user_profiles.height_cm IS
'Body height in centimetres. Required for Mifflin-St Jeor calorie
calculation together with weight_kg, age and sex.';

COMMENT ON COLUMN user_profiles.activity_level IS
'Physical activity level. Mapped to a PAL multiplier in
get_rda_for_user() to convert BMR → TDEE (calorie target).
Defaults to sedentary (PAL 1.2) when not specified.';
