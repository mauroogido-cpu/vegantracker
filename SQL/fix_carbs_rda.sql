-- Fix carbs_g in rda_reference: replace NIH brain-minimum (130g)
-- with AMDR-based practical targets (45-65% of daily energy).
-- Run this in Supabase SQL Editor.

UPDATE rda_reference SET carbs_g = 300 WHERE sex = 'male'   AND age_min = 19;
UPDATE rda_reference SET carbs_g = 275 WHERE sex = 'male'   AND age_min = 31;
UPDATE rda_reference SET carbs_g = 250 WHERE sex = 'male'   AND age_min = 51;
UPDATE rda_reference SET carbs_g = 230 WHERE sex = 'male'   AND age_min = 71;

UPDATE rda_reference SET carbs_g = 250 WHERE sex = 'female' AND age_min = 19 AND pregnant = false AND lactating = false;
UPDATE rda_reference SET carbs_g = 225 WHERE sex = 'female' AND age_min = 31 AND pregnant = false AND lactating = false;
UPDATE rda_reference SET carbs_g = 210 WHERE sex = 'female' AND age_min = 51;
UPDATE rda_reference SET carbs_g = 190 WHERE sex = 'female' AND age_min = 71;

UPDATE rda_reference SET carbs_g = 290 WHERE sex = 'female' AND pregnant  = true;
UPDATE rda_reference SET carbs_g = 290 WHERE sex = 'female' AND lactating = true;

-- Verify:
SELECT sex, age_min, age_max, pregnant, lactating, carbs_g FROM rda_reference ORDER BY sex, age_min;
