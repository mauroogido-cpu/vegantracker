-- ============================================================
-- Migration 008: add saturated_fat_g column
-- Source: USDA FoodData Central SR Legacy 2018
-- All values per 100 g edible portion.
-- ============================================================

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS saturated_fat_g NUMERIC DEFAULT 0;

-- ── FRUITS ────────────────────────────────────────────────────
-- Blueberries, raw (fdc_id=9050)
UPDATE ingredients SET saturated_fat_g = 0.028 WHERE fdc_id = 9050;
-- Bananas, raw (fdc_id=9040)
UPDATE ingredients SET saturated_fat_g = 0.112 WHERE fdc_id = 9040;
-- Cherimoya, raw (fdc_id=9067)
UPDATE ingredients SET saturated_fat_g = 0.233 WHERE name_en = 'Cherimoya';
-- Coconut meat, raw (fdc_id=12117)
UPDATE ingredients SET saturated_fat_g = 29.7 WHERE name_en = 'Coconut meat';
-- Dates, deglet noor (fdc_id=9087)
UPDATE ingredients SET saturated_fat_g = 0.032 WHERE name_en = 'Dates, deglet noor';
-- Dates, medjool (fdc_id=9089)
UPDATE ingredients SET saturated_fat_g = 0.040 WHERE name_en = 'Dates, medjool';
-- Peaches, raw (fdc_id=9236)
UPDATE ingredients SET saturated_fat_g = 0.019 WHERE fdc_id = 9236;
-- Strawberries, raw (fdc_id=9316)
UPDATE ingredients SET saturated_fat_g = 0.015 WHERE fdc_id = 9316;
-- Kiwifruit, green, raw (fdc_id=9148)
UPDATE ingredients SET saturated_fat_g = 0.029 WHERE fdc_id = 9148;
-- Lemons, raw, without peel (fdc_id=9150)
UPDATE ingredients SET saturated_fat_g = 0.039 WHERE fdc_id = 9150;
-- Lucuma — not in USDA SR Legacy; total fat ~0.6 g, sat fat estimated ~0.1 g
UPDATE ingredients SET saturated_fat_g = 0.1 WHERE name_en = 'Lucuma';
-- Tangerines, raw (fdc_id=9218 or 169105)
UPDATE ingredients SET saturated_fat_g = 0.039 WHERE name_en = 'Tangerine';
-- Mangos, raw (fdc_id=9176)
UPDATE ingredients SET saturated_fat_g = 0.092 WHERE fdc_id = 9176;
-- Apples, raw, with skin (fdc_id=9003)
UPDATE ingredients SET saturated_fat_g = 0.028 WHERE fdc_id = 9003;
-- Passion-fruit, purple, raw (fdc_id=9231)
UPDATE ingredients SET saturated_fat_g = 0.059 WHERE name_en = 'Passion fruit';
-- Melons, cantaloupe, raw (fdc_id=9181 or 169092)
UPDATE ingredients SET saturated_fat_g = 0.051 WHERE name_en = 'Melon, cantaloupe';
-- Melons, honeydew, raw (fdc_id=9184)
UPDATE ingredients SET saturated_fat_g = 0.038 WHERE name_en = 'Melon, honeydew';
-- Oranges, raw, all commercial varieties (fdc_id=9200)
UPDATE ingredients SET saturated_fat_g = 0.015 WHERE fdc_id = 9200;
-- Avocados, raw (fdc_id=9037)
UPDATE ingredients SET saturated_fat_g = 2.13 WHERE fdc_id = 9037;
-- Papayas, raw (fdc_id=9226)
UPDATE ingredients SET saturated_fat_g = 0.081 WHERE fdc_id = 9226;
-- Raisins, dark, seedless (fdc_id=9299)
UPDATE ingredients SET saturated_fat_g = 0.094 WHERE name_en = 'Raisins (dark, seedless)';
-- Pineapple, raw (fdc_id=9266)
UPDATE ingredients SET saturated_fat_g = 0.009 WHERE fdc_id = 9266;
-- Pitahaya, red — not in USDA SR Legacy; total fat ~0.43 g, sat fat estimated ~0.05 g
UPDATE ingredients SET saturated_fat_g = 0.05 WHERE name_en = 'Pitahaya, red';
-- Watermelon, raw (fdc_id=9326)
UPDATE ingredients SET saturated_fat_g = 0.016 WHERE fdc_id = 9326;
-- Grapes, red or green (fdc_id=9132)
UPDATE ingredients SET saturated_fat_g = 0.054 WHERE fdc_id = 9132;

-- ── GRAINS ────────────────────────────────────────────────────
-- Rice, white, long-grain, enriched, cooked
UPDATE ingredients SET saturated_fat_g = 0.077 WHERE name_en = 'White rice (cooked)';
-- Rice, white, long-grain, raw
UPDATE ingredients SET saturated_fat_g = 0.180 WHERE name_en = 'White rice (raw)';
-- Rice, brown, long-grain, cooked
UPDATE ingredients SET saturated_fat_g = 0.260 WHERE name_en = 'Brown rice (cooked)';
-- Rice, brown, long-grain, raw
UPDATE ingredients SET saturated_fat_g = 0.591 WHERE name_en = 'Brown rice (raw)';
-- Oats (USDA Food Distribution Program)
UPDATE ingredients SET saturated_fat_g = 1.22 WHERE name_en = 'Oats (dry)';
-- Rice flour, white
UPDATE ingredients SET saturated_fat_g = 0.386 WHERE name_en = 'Rice flour (white)';
-- Oat flour, partially debranned
UPDATE ingredients SET saturated_fat_g = 1.61 WHERE name_en = 'Oat flour';
-- Corn flour, masa, enriched
UPDATE ingredients SET saturated_fat_g = 0.532 WHERE name_en = 'Corn masa harina';
-- Wheat flour, whole-grain
UPDATE ingredients SET saturated_fat_g = 0.430 WHERE name_en = 'Wheat flour, whole-grain';
-- Wheat flour, all-purpose, enriched
UPDATE ingredients SET saturated_fat_g = 0.155 WHERE name_en = 'Wheat flour, all-purpose';
-- Amaranth grain, cooked (sat fat not in USDA; estimated from raw/cooked ratio)
UPDATE ingredients SET saturated_fat_g = 0.370 WHERE name_en = 'Amaranth (cooked)';
-- Amaranth grain, uncooked
UPDATE ingredients SET saturated_fat_g = 1.46 WHERE name_en = 'Amaranth (raw)';
-- Millet, cooked
UPDATE ingredients SET saturated_fat_g = 0.172 WHERE name_en = 'Millet (cooked)';
-- Millet, raw
UPDATE ingredients SET saturated_fat_g = 0.723 WHERE name_en = 'Millet (raw)';
-- Pasta, whole-wheat, cooked
UPDATE ingredients SET saturated_fat_g = 0.243 WHERE name_en = 'Whole wheat pasta (cooked)';
-- Pasta, whole-wheat, dry
UPDATE ingredients SET saturated_fat_g = 0.428 WHERE name_en = 'Whole wheat pasta (dry)';
-- Quinoa, cooked
UPDATE ingredients SET saturated_fat_g = 0.231 WHERE name_en = 'Quinoa (cooked)';
-- Quinoa, uncooked
UPDATE ingredients SET saturated_fat_g = 0.706 WHERE name_en = 'Quinoa (raw)';
-- Buckwheat groats, roasted, cooked
UPDATE ingredients SET saturated_fat_g = 0.134 WHERE name_en = 'Buckwheat (cooked)';
-- Buckwheat (raw)
UPDATE ingredients SET saturated_fat_g = 0.741 WHERE name_en = 'Buckwheat (raw)';

-- ── LEGUMES ───────────────────────────────────────────────────
-- Peas, green, cooked, boiled, drained, without salt
UPDATE ingredients SET saturated_fat_g = 0.039 WHERE name_en = 'Green peas (cooked)';
-- Peas, green, raw
UPDATE ingredients SET saturated_fat_g = 0.071 WHERE name_en = 'Green peas (raw)';
-- Mung beans, sprouted, raw
UPDATE ingredients SET saturated_fat_g = 0.046 WHERE name_en = 'Mung bean sprouts (raw)';
-- Edamame, frozen, prepared
UPDATE ingredients SET saturated_fat_g = 0.620 WHERE name_en = 'Edamame (cooked)';
-- Edamame, frozen, unprepared (sat fat not in USDA; estimated ~0.94)
UPDATE ingredients SET saturated_fat_g = 0.939 WHERE name_en = 'Edamame (raw)';
-- Beans, black, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 0.139 WHERE name_en = 'Black beans (cooked)';
-- Beans, black, raw
UPDATE ingredients SET saturated_fat_g = 0.366 WHERE name_en = 'Black beans (raw)';
-- Beans, pinto, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 0.136 WHERE name_en = 'Pinto beans (cooked)';
-- Beans, pinto, raw
UPDATE ingredients SET saturated_fat_g = 0.235 WHERE name_en = 'Pinto beans (raw)';
-- Beans, kidney, all types, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 0.073 WHERE name_en = 'Kidney beans (cooked)';
-- Beans, kidney, all types, raw
UPDATE ingredients SET saturated_fat_g = 0.120 WHERE name_en = 'Kidney beans (raw)';
-- Chickpeas, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 0.269 WHERE name_en = 'Chickpeas (cooked)';
-- Chickpeas, raw
UPDATE ingredients SET saturated_fat_g = 0.603 WHERE name_en = 'Chickpeas (raw)';
-- Chickpea flour (besan)
UPDATE ingredients SET saturated_fat_g = 0.693 WHERE name_en = 'Chickpea flour (besan)';
-- Lentils, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 0.053 WHERE name_en = 'Lentils (cooked)';
-- Lentils, raw
UPDATE ingredients SET saturated_fat_g = 0.154 WHERE name_en = 'Lentils (raw)';
-- Mung beans, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 0.116 WHERE name_en = 'Mung beans (cooked)';
-- Mung beans, raw
UPDATE ingredients SET saturated_fat_g = 0.348 WHERE name_en = 'Mung beans (raw)';
-- Soybeans, mature, cooked, boiled, without salt
UPDATE ingredients SET saturated_fat_g = 1.300 WHERE name_en = 'Soybeans (cooked)';
-- Soybeans, mature seeds, raw
UPDATE ingredients SET saturated_fat_g = 2.880 WHERE name_en = 'Soybeans (raw)';

-- ── OTHER ─────────────────────────────────────────────────────
-- Oil, coconut
UPDATE ingredients SET saturated_fat_g = 82.5 WHERE name_en = 'Coconut oil';
-- Oil, olive, salad or cooking
UPDATE ingredients SET saturated_fat_g = 13.8 WHERE name_en = 'Olive oil';
-- Seaweed, laver, raw (Nori)
UPDATE ingredients SET saturated_fat_g = 0.061 WHERE name_en = 'Nori (dried seaweed)';
-- Seaweed, wakame, raw
UPDATE ingredients SET saturated_fat_g = 0.130 WHERE name_en = 'Wakame (dried seaweed)';
-- Sugars, granulated
UPDATE ingredients SET saturated_fat_g = 0.0 WHERE name_en = 'Sugar (white, granulated)';
-- Cocoa, dry powder, unsweetened
UPDATE ingredients SET saturated_fat_g = 8.07 WHERE name_en = 'Cocoa powder';
-- Chocolate, dark, 70-85% cacao solids
UPDATE ingredients SET saturated_fat_g = 24.5 WHERE name_en = 'Dark chocolate (≥70%)';
-- Spices, turmeric, ground
UPDATE ingredients SET saturated_fat_g = 1.84 WHERE name_en = 'Turmeric (powder)';
-- Hummus, commercial
UPDATE ingredients SET saturated_fat_g = 2.56 WHERE name_en = 'Hummus';
