-- ============================================================
-- Migration: add 10 nutrient columns + new herbs
-- Source: USDA FoodData Central SR Legacy 2018
-- ============================================================

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS potassium_mg  NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sodium_mg     NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selenium_mcg  NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vit_a_rae_mcg NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS folate_mcg    NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS magnesium_mg  NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vit_k_mcg     NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vit_e_mg      NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vit_b6_mg     NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS choline_mg    NUMERIC DEFAULT 0;

-- ============================================================
-- Update existing ingredients
-- ============================================================

-- Bananas, raw
UPDATE ingredients SET potassium_mg = 358, sodium_mg = 1.0, selenium_mcg = 1.0, vit_a_rae_mcg = 3.0, folate_mcg = 20.0, magnesium_mg = 27.0, vit_k_mcg = 0.5, vit_e_mg = 0.1, vit_b6_mg = 0.367, choline_mg = 9.8 WHERE fdc_id = 9040;
-- Mangos, raw
UPDATE ingredients SET potassium_mg = 168, sodium_mg = 1.0, selenium_mcg = 0.6, vit_a_rae_mcg = 54.0, folate_mcg = 43.0, magnesium_mg = 10.0, vit_k_mcg = 4.2, vit_e_mg = 0.9, vit_b6_mg = 0.119, choline_mg = 7.6 WHERE fdc_id = 9176;
-- Avocados, raw, all commercial varieties
UPDATE ingredients SET potassium_mg = 485, sodium_mg = 7.0, selenium_mcg = 0.4, vit_a_rae_mcg = 7.0, folate_mcg = 81.0, magnesium_mg = 29.0, vit_k_mcg = 21.0, vit_e_mg = 2.07, vit_b6_mg = 0.257, choline_mg = 14.2 WHERE fdc_id = 9037;
-- Papayas, raw
UPDATE ingredients SET potassium_mg = 182, sodium_mg = 8.0, selenium_mcg = 0.6, vit_a_rae_mcg = 47.0, folate_mcg = 37.0, magnesium_mg = 21.0, vit_k_mcg = 2.6, vit_e_mg = 0.3, vit_b6_mg = 0.038, choline_mg = 6.1 WHERE fdc_id = 9226;
-- Oranges, raw, all commercial varieties
UPDATE ingredients SET potassium_mg = 181, sodium_mg = 0, selenium_mcg = 0.5, vit_a_rae_mcg = 11.0, folate_mcg = 30.0, magnesium_mg = 10.0, vit_k_mcg = 0, vit_e_mg = 0.18, vit_b6_mg = 0.06, choline_mg = 8.4 WHERE fdc_id = 9200;
-- Strawberries, raw
UPDATE ingredients SET potassium_mg = 153, sodium_mg = 1.0, selenium_mcg = 0.4, vit_a_rae_mcg = 1.0, folate_mcg = 24.0, magnesium_mg = 13.0, vit_k_mcg = 2.2, vit_e_mg = 0.29, vit_b6_mg = 0.047, choline_mg = 5.7 WHERE fdc_id = 9316;
-- Pineapple, raw, all varieties
UPDATE ingredients SET potassium_mg = 109, sodium_mg = 1.0, selenium_mcg = 0.1, vit_a_rae_mcg = 3.0, folate_mcg = 18.0, magnesium_mg = 12.0, vit_k_mcg = 0.7, vit_e_mg = 0.02, vit_b6_mg = 0.112, choline_mg = 5.5 WHERE fdc_id = 9266;
-- Watermelon, raw
UPDATE ingredients SET potassium_mg = 112, sodium_mg = 1.0, selenium_mcg = 0.4, vit_a_rae_mcg = 28.0, folate_mcg = 3.0, magnesium_mg = 10.0, vit_k_mcg = 0.1, vit_e_mg = 0.05, vit_b6_mg = 0.045, choline_mg = 4.1 WHERE fdc_id = 9326;
-- Tangerines, (mandarin oranges), raw
UPDATE ingredients SET potassium_mg = 166, sodium_mg = 2.0, selenium_mcg = 0.1, vit_a_rae_mcg = 34.0, folate_mcg = 16.0, magnesium_mg = 12.0, vit_k_mcg = 0, vit_e_mg = 0.2, vit_b6_mg = 0.078, choline_mg = 10.2 WHERE fdc_id = 9218;
-- Lemons, raw, without peel
UPDATE ingredients SET potassium_mg = 138, sodium_mg = 2.0, selenium_mcg = 0.4, vit_a_rae_mcg = 1.0, folate_mcg = 11.0, magnesium_mg = 8.0, vit_k_mcg = 0, vit_e_mg = 0.15, vit_b6_mg = 0.08, choline_mg = 5.1 WHERE fdc_id = 9150;
-- Blueberries, raw
UPDATE ingredients SET potassium_mg = 77.0, sodium_mg = 1.0, selenium_mcg = 0.1, vit_a_rae_mcg = 3.0, folate_mcg = 6.0, magnesium_mg = 6.0, vit_k_mcg = 19.3, vit_e_mg = 0.57, vit_b6_mg = 0.052, choline_mg = 6.0 WHERE fdc_id = 9050;
-- Kiwifruit, green, raw
UPDATE ingredients SET potassium_mg = 312, sodium_mg = 3.0, selenium_mcg = 0.2, vit_a_rae_mcg = 4.0, folate_mcg = 25.0, magnesium_mg = 17.0, vit_k_mcg = 40.3, vit_e_mg = 1.46, vit_b6_mg = 0.063, choline_mg = 7.8 WHERE fdc_id = 9148;
-- Peaches, yellow, raw
UPDATE ingredients SET potassium_mg = 190, sodium_mg = 0, selenium_mcg = 0.1, vit_a_rae_mcg = 16.0, folate_mcg = 4.0, magnesium_mg = 9.0, vit_k_mcg = 2.6, vit_e_mg = 0.73, vit_b6_mg = 0.025, choline_mg = 6.1 WHERE fdc_id = 9236;
-- Grapes, red or green (European type, such as Thompson seedle
UPDATE ingredients SET potassium_mg = 191, sodium_mg = 2.0, selenium_mcg = 0.1, vit_a_rae_mcg = 3.0, folate_mcg = 2.0, magnesium_mg = 7.0, vit_k_mcg = 14.6, vit_e_mg = 0.19, vit_b6_mg = 0.086, choline_mg = 5.6 WHERE fdc_id = 9132;
-- Apples, raw, with skin (Includes foods for USDA's Food Distr
UPDATE ingredients SET potassium_mg = 107, sodium_mg = 1.0, selenium_mcg = 0, vit_a_rae_mcg = 3.0, folate_mcg = 3.0, magnesium_mg = 5.0, vit_k_mcg = 2.2, vit_e_mg = 0.18, vit_b6_mg = 0.041, choline_mg = 3.4 WHERE fdc_id = 9003;
-- Broccoli, raw
UPDATE ingredients SET potassium_mg = 316, sodium_mg = 33.0, selenium_mcg = 2.5, vit_a_rae_mcg = 31.0, folate_mcg = 63.0, magnesium_mg = 21.0, vit_k_mcg = 102, vit_e_mg = 0.78, vit_b6_mg = 0.175, choline_mg = 18.7 WHERE fdc_id = 11090;
-- Kale, raw
UPDATE ingredients SET potassium_mg = 348, sodium_mg = 53.0, selenium_mcg = 0.9, vit_a_rae_mcg = 241, folate_mcg = 62.0, magnesium_mg = 33.0, vit_k_mcg = 390, vit_e_mg = 0.66, vit_b6_mg = 0.147, choline_mg = 0.5 WHERE fdc_id = 11233;
-- Sweet potato, raw, unprepared (Includes foods for USDA's Foo
UPDATE ingredients SET potassium_mg = 337, sodium_mg = 55.0, selenium_mcg = 0.6, vit_a_rae_mcg = 709, folate_mcg = 11.0, magnesium_mg = 25.0, vit_k_mcg = 1.8, vit_e_mg = 0.26, vit_b6_mg = 0.209, choline_mg = 12.3 WHERE fdc_id = 11507;
-- Carrots, raw
UPDATE ingredients SET potassium_mg = 320, sodium_mg = 69.0, selenium_mcg = 0.1, vit_a_rae_mcg = 835, folate_mcg = 19.0, magnesium_mg = 12.0, vit_k_mcg = 13.2, vit_e_mg = 0.66, vit_b6_mg = 0.138, choline_mg = 8.8 WHERE fdc_id = 11124;
-- Tomatoes, red, ripe, raw, year round average
UPDATE ingredients SET potassium_mg = 237, sodium_mg = 5.0, selenium_mcg = 0, vit_a_rae_mcg = 42.0, folate_mcg = 15.0, magnesium_mg = 11.0, vit_k_mcg = 7.9, vit_e_mg = 0.54, vit_b6_mg = 0.08, choline_mg = 6.7 WHERE fdc_id = 11529;
-- Cucumber, with peel, raw
UPDATE ingredients SET potassium_mg = 147, sodium_mg = 2.0, selenium_mcg = 0.3, vit_a_rae_mcg = 5.0, folate_mcg = 7.0, magnesium_mg = 13.0, vit_k_mcg = 16.4, vit_e_mg = 0.03, vit_b6_mg = 0.04, choline_mg = 6.0 WHERE fdc_id = 11205;
-- Peppers, sweet, red, raw
UPDATE ingredients SET potassium_mg = 211, sodium_mg = 4.0, selenium_mcg = 0.1, vit_a_rae_mcg = 157, folate_mcg = 46.0, magnesium_mg = 12.0, vit_k_mcg = 4.9, vit_e_mg = 1.58, vit_b6_mg = 0.291, choline_mg = 5.6 WHERE fdc_id = 11821;
-- Squash, summer, zucchini, includes skin, raw
UPDATE ingredients SET potassium_mg = 261, sodium_mg = 8.0, selenium_mcg = 0.2, vit_a_rae_mcg = 10.0, folate_mcg = 24.0, magnesium_mg = 18.0, vit_k_mcg = 4.3, vit_e_mg = 0.12, vit_b6_mg = 0.163, choline_mg = 9.5 WHERE fdc_id = 11477;
-- Onions, raw
UPDATE ingredients SET potassium_mg = 146, sodium_mg = 4.0, selenium_mcg = 0.5, vit_a_rae_mcg = 0, folate_mcg = 19.0, magnesium_mg = 10.0, vit_k_mcg = 0.4, vit_e_mg = 0.02, vit_b6_mg = 0.12, choline_mg = 6.1 WHERE fdc_id = 11282;
-- Cauliflower, raw
UPDATE ingredients SET potassium_mg = 299, sodium_mg = 30.0, selenium_mcg = 0.6, vit_a_rae_mcg = 0, folate_mcg = 57.0, magnesium_mg = 15.0, vit_k_mcg = 15.5, vit_e_mg = 0.08, vit_b6_mg = 0.184, choline_mg = 44.3 WHERE fdc_id = 11135;
-- Beets, raw
UPDATE ingredients SET potassium_mg = 325, sodium_mg = 78.0, selenium_mcg = 0.7, vit_a_rae_mcg = 2.0, folate_mcg = 109, magnesium_mg = 23.0, vit_k_mcg = 0.2, vit_e_mg = 0.04, vit_b6_mg = 0.067, choline_mg = 6.0 WHERE fdc_id = 11080;
-- Celery, raw
UPDATE ingredients SET potassium_mg = 260, sodium_mg = 80.0, selenium_mcg = 0.4, vit_a_rae_mcg = 22.0, folate_mcg = 36.0, magnesium_mg = 11.0, vit_k_mcg = 29.3, vit_e_mg = 0.27, vit_b6_mg = 0.074, choline_mg = 6.1 WHERE fdc_id = 11143;
-- Cabbage, chinese (pak-choi), raw
UPDATE ingredients SET potassium_mg = 252, sodium_mg = 65.0, selenium_mcg = 0.5, vit_a_rae_mcg = 223, folate_mcg = 66.0, magnesium_mg = 19.0, vit_k_mcg = 45.5, vit_e_mg = 0.09, vit_b6_mg = 0.194, choline_mg = 6.4 WHERE fdc_id = 11116;
-- Pumpkin, raw
UPDATE ingredients SET potassium_mg = 340, sodium_mg = 1.0, selenium_mcg = 0.3, vit_a_rae_mcg = 426, folate_mcg = 16.0, magnesium_mg = 12.0, vit_k_mcg = 1.1, vit_e_mg = 1.06, vit_b6_mg = 0.061, choline_mg = 8.2 WHERE fdc_id = 11422;
-- Corn, sweet, yellow, cooked, boiled, drained, without salt
UPDATE ingredients SET potassium_mg = 218, sodium_mg = 1.0, selenium_mcg = 0.2, vit_a_rae_mcg = 13.0, folate_mcg = 23.0, magnesium_mg = 26.0, vit_k_mcg = 0.4, vit_e_mg = 0.09, vit_b6_mg = 0.139, choline_mg = 29.1 WHERE fdc_id = 11168;
-- Garlic, raw
UPDATE ingredients SET potassium_mg = 401, sodium_mg = 17.0, selenium_mcg = 14.2, vit_a_rae_mcg = 0, folate_mcg = 3.0, magnesium_mg = 25.0, vit_k_mcg = 1.7, vit_e_mg = 0.08, vit_b6_mg = 1.24, choline_mg = 23.2 WHERE fdc_id = 11215;
-- Rice, brown, long-grain, cooked (Includes foods for USDA's F
UPDATE ingredients SET potassium_mg = 86.0, sodium_mg = 4.0, selenium_mcg = 5.8, vit_a_rae_mcg = 0, folate_mcg = 9.0, magnesium_mg = 39.0, vit_k_mcg = 0.2, vit_e_mg = 0.17, vit_b6_mg = 0.123, choline_mg = 9.2 WHERE fdc_id = 20037;
-- Rice, white, long-grain, regular, enriched, cooked
UPDATE ingredients SET potassium_mg = 35.0, sodium_mg = 1.0, selenium_mcg = 7.5, vit_a_rae_mcg = 0, folate_mcg = 97.0, magnesium_mg = 12.0, vit_k_mcg = 0, vit_e_mg = 0.04, vit_b6_mg = 0.093, choline_mg = 2.1 WHERE fdc_id = 20045;
-- Quinoa, cooked
UPDATE ingredients SET potassium_mg = 172, sodium_mg = 7.0, selenium_mcg = 2.8, vit_a_rae_mcg = 0, folate_mcg = 42.0, magnesium_mg = 64.0, vit_k_mcg = 0, vit_e_mg = 0.63, vit_b6_mg = 0.123, choline_mg = 23.0 WHERE fdc_id = 20137;
-- Rice, brown, medium-grain, raw (Includes foods for USDA's Fo
UPDATE ingredients SET potassium_mg = 268, sodium_mg = 4.0, selenium_mcg = 0.0, vit_a_rae_mcg = 0, folate_mcg = 20.0, magnesium_mg = 143, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.509, choline_mg = 0.0 WHERE fdc_id = 20040;
-- Pasta, dry, unenriched
UPDATE ingredients SET potassium_mg = 223, sodium_mg = 6.0, selenium_mcg = 63.2, vit_a_rae_mcg = 0, folate_mcg = 18.0, magnesium_mg = 53.0, vit_k_mcg = 0.1, vit_e_mg = 0.11, vit_b6_mg = 0.142, choline_mg = 0.0 WHERE fdc_id = 20420;
-- Buckwheat groats, roasted, dry
UPDATE ingredients SET potassium_mg = 320, sodium_mg = 11.0, selenium_mcg = 8.4, vit_a_rae_mcg = 0, folate_mcg = 42.0, magnesium_mg = 221, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.353, choline_mg = 54.2 WHERE fdc_id = 20009;
-- Millet, raw
UPDATE ingredients SET potassium_mg = 195, sodium_mg = 5.0, selenium_mcg = 2.7, vit_a_rae_mcg = 0, folate_mcg = 85.0, magnesium_mg = 114, vit_k_mcg = 0.9, vit_e_mg = 0.05, vit_b6_mg = 0.384, choline_mg = 0.0 WHERE fdc_id = 20031;
-- Amaranth grain, uncooked
UPDATE ingredients SET potassium_mg = 508, sodium_mg = 4.0, selenium_mcg = 18.7, vit_a_rae_mcg = 0, folate_mcg = 82.0, magnesium_mg = 248, vit_k_mcg = 0, vit_e_mg = 1.19, vit_b6_mg = 0.591, choline_mg = 69.8 WHERE fdc_id = 20001;
-- Lentils, raw
UPDATE ingredients SET potassium_mg = 677, sodium_mg = 6.0, selenium_mcg = 0.1, vit_a_rae_mcg = 2.0, folate_mcg = 479, magnesium_mg = 47.0, vit_k_mcg = 5.0, vit_e_mg = 0.49, vit_b6_mg = 0.54, choline_mg = 96.4 WHERE fdc_id = 16069;
-- Chickpeas (garbanzo beans, bengal gram), mature seeds, cooke
UPDATE ingredients SET potassium_mg = 291, sodium_mg = 7.0, selenium_mcg = 3.7, vit_a_rae_mcg = 1.0, folate_mcg = 172, magnesium_mg = 48.0, vit_k_mcg = 4.0, vit_e_mg = 0.35, vit_b6_mg = 0.139, choline_mg = 42.8 WHERE fdc_id = 16057;
-- Beans, black, mature seeds, cooked, boiled, without salt
UPDATE ingredients SET potassium_mg = 355, sodium_mg = 1.0, selenium_mcg = 1.2, vit_a_rae_mcg = 0, folate_mcg = 149, magnesium_mg = 70.0, vit_k_mcg = 3.3, vit_e_mg = 0.87, vit_b6_mg = 0.069, choline_mg = 32.6 WHERE fdc_id = 16015;
-- Mung beans, mature seeds, raw
UPDATE ingredients SET potassium_mg = 1250.0, sodium_mg = 15.0, selenium_mcg = 8.2, vit_a_rae_mcg = 6.0, folate_mcg = 625, magnesium_mg = 189, vit_k_mcg = 9.0, vit_e_mg = 0.51, vit_b6_mg = 0.382, choline_mg = 97.9 WHERE fdc_id = 16080;
-- Peas, green, canned, seasoned, solids and liquids
UPDATE ingredients SET potassium_mg = 122, sodium_mg = 254, selenium_mcg = 1.3, vit_a_rae_mcg = 22.0, folate_mcg = 29.0, magnesium_mg = 15.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.098, choline_mg = 0.0 WHERE fdc_id = 11310;
-- Eggplant, cooked, boiled, drained, without salt
UPDATE ingredients SET potassium_mg = 123, sodium_mg = 1.0, selenium_mcg = 0.1, vit_a_rae_mcg = 2.0, folate_mcg = 14.0, magnesium_mg = 11.0, vit_k_mcg = 2.9, vit_e_mg = 0.41, vit_b6_mg = 0.086, choline_mg = 9.4 WHERE fdc_id = 11210;
-- Beans, kidney, red, mature seeds, cooked, boiled, without sa
UPDATE ingredients SET potassium_mg = 403, sodium_mg = 2.0, selenium_mcg = 1.2, vit_a_rae_mcg = 0, folate_mcg = 130, magnesium_mg = 45.0, vit_k_mcg = 8.4, vit_e_mg = 0.03, vit_b6_mg = 0.12, choline_mg = 30.5 WHERE fdc_id = 16033;
-- Beans, pinto, mature seeds, cooked, boiled, without salt
UPDATE ingredients SET potassium_mg = 436, sodium_mg = 1.0, selenium_mcg = 6.2, vit_a_rae_mcg = 0, folate_mcg = 172, magnesium_mg = 50.0, vit_k_mcg = 3.5, vit_e_mg = 0.94, vit_b6_mg = 0.229, choline_mg = 35.3 WHERE fdc_id = 16043;
-- Soybeans, mature cooked, boiled, without salt
UPDATE ingredients SET potassium_mg = 515, sodium_mg = 1.0, selenium_mcg = 7.3, vit_a_rae_mcg = 0, folate_mcg = 54.0, magnesium_mg = 86.0, vit_k_mcg = 19.2, vit_e_mg = 0.35, vit_b6_mg = 0.234, choline_mg = 47.5 WHERE fdc_id = 16109;
-- Tofu, firm, prepared with calcium sulfate and magnesium chlo
UPDATE ingredients SET potassium_mg = 148, sodium_mg = 12.0, selenium_mcg = 9.9, vit_a_rae_mcg = 0, folate_mcg = 19.0, magnesium_mg = 37.0, vit_k_mcg = 2.4, vit_e_mg = 0.01, vit_b6_mg = 0.071, choline_mg = 28.1 WHERE fdc_id = 16126;
-- Okara
UPDATE ingredients SET potassium_mg = 213, sodium_mg = 9.0, selenium_mcg = 10.6, vit_a_rae_mcg = 0, folate_mcg = 26.0, magnesium_mg = 26.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.115, choline_mg = 0.0 WHERE fdc_id = 16130;
-- Tempeh
UPDATE ingredients SET potassium_mg = 412, sodium_mg = 9.0, selenium_mcg = 0, vit_a_rae_mcg = 0, folate_mcg = 24.0, magnesium_mg = 81.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.215, choline_mg = 0.0 WHERE fdc_id = 16114;
-- Soy sauce, reduced sodium, made from hydrolyzed vegetable pr
UPDATE ingredients SET potassium_mg = 3100.0, sodium_mg = 2890.0, selenium_mcg = 0.9, vit_a_rae_mcg = 0, folate_mcg = 0.0, magnesium_mg = 34.0, vit_k_mcg = 0, vit_e_mg = 0, vit_b6_mg = 0.037, choline_mg = 31.6 WHERE fdc_id = 16425;
-- Mushrooms, portabella, exposed to ultraviolet light, grilled
UPDATE ingredients SET potassium_mg = 437, sodium_mg = 11.0, selenium_mcg = 21.9, vit_a_rae_mcg = 0.0, folate_mcg = 0.0, magnesium_mg = 13.0, vit_k_mcg = 0, vit_e_mg = 0, vit_b6_mg = 0.122, choline_mg = 32.8 WHERE fdc_id = 11939;
-- Tofu, dried-frozen (koyadofu)
UPDATE ingredients SET potassium_mg = 20.0, sodium_mg = 6.0, selenium_mcg = 54.3, vit_a_rae_mcg = 26.0, folate_mcg = 92.0, magnesium_mg = 59.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.286, choline_mg = 0.0 WHERE fdc_id = 16128;
-- Seeds, chia seeds, dried
UPDATE ingredients SET potassium_mg = 407, sodium_mg = 16.0, selenium_mcg = 55.2, vit_a_rae_mcg = 0.0, folate_mcg = 0.0, magnesium_mg = 335, vit_k_mcg = 0.0, vit_e_mg = 0.5, vit_b6_mg = 0.0, choline_mg = 0.0 WHERE fdc_id = 12006;
-- Seeds, flaxseed
UPDATE ingredients SET potassium_mg = 813, sodium_mg = 30.0, selenium_mcg = 25.4, vit_a_rae_mcg = 0, folate_mcg = 87.0, magnesium_mg = 392, vit_k_mcg = 4.3, vit_e_mg = 0.31, vit_b6_mg = 0.473, choline_mg = 78.7 WHERE fdc_id = 12220;
-- Seeds, hemp seed, hulled
UPDATE ingredients SET potassium_mg = 1200.0, sodium_mg = 5.0, selenium_mcg = 0.0, vit_a_rae_mcg = 1.0, folate_mcg = 110, magnesium_mg = 700, vit_k_mcg = 0.0, vit_e_mg = 0.8, vit_b6_mg = 0.6, choline_mg = 0.0 WHERE fdc_id = 12012;
-- Seeds, sesame seeds, whole, dried
UPDATE ingredients SET potassium_mg = 468, sodium_mg = 11.0, selenium_mcg = 34.4, vit_a_rae_mcg = 0, folate_mcg = 97.0, magnesium_mg = 351, vit_k_mcg = 0, vit_e_mg = 0.25, vit_b6_mg = 0.79, choline_mg = 25.6 WHERE fdc_id = 12023;
-- Seeds, sunflower seed kernels, dried
UPDATE ingredients SET potassium_mg = 645, sodium_mg = 9.0, selenium_mcg = 53.0, vit_a_rae_mcg = 3.0, folate_mcg = 227, magnesium_mg = 325, vit_k_mcg = 0, vit_e_mg = 35.2, vit_b6_mg = 1.34, choline_mg = 55.1 WHERE fdc_id = 12036;
-- Seeds, pumpkin and squash seed kernels, roasted, without sal
UPDATE ingredients SET potassium_mg = 788, sodium_mg = 18.0, selenium_mcg = 9.4, vit_a_rae_mcg = 0, folate_mcg = 57.0, magnesium_mg = 550, vit_k_mcg = 4.5, vit_e_mg = 0.56, vit_b6_mg = 0.1, choline_mg = 63.0 WHERE fdc_id = 12016;
-- Nuts, almonds
UPDATE ingredients SET potassium_mg = 733, sodium_mg = 1.0, selenium_mcg = 4.1, vit_a_rae_mcg = 0, folate_mcg = 44.0, magnesium_mg = 270, vit_k_mcg = 0, vit_e_mg = 25.6, vit_b6_mg = 0.137, choline_mg = 52.1 WHERE fdc_id = 12061;
-- Nuts, cashew nuts, raw
UPDATE ingredients SET potassium_mg = 660, sodium_mg = 12.0, selenium_mcg = 19.9, vit_a_rae_mcg = 0, folate_mcg = 25.0, magnesium_mg = 292, vit_k_mcg = 34.1, vit_e_mg = 0.9, vit_b6_mg = 0.417, choline_mg = 0.0 WHERE fdc_id = 12087;
-- Nuts, walnuts, english
UPDATE ingredients SET potassium_mg = 441, sodium_mg = 2.0, selenium_mcg = 4.9, vit_a_rae_mcg = 1.0, folate_mcg = 98.0, magnesium_mg = 158, vit_k_mcg = 2.7, vit_e_mg = 0.7, vit_b6_mg = 0.537, choline_mg = 39.2 WHERE fdc_id = 12155;
-- Nuts, brazilnuts, dried, unblanched
UPDATE ingredients SET potassium_mg = 659, sodium_mg = 3.0, selenium_mcg = 1920.0, vit_a_rae_mcg = 0, folate_mcg = 22.0, magnesium_mg = 376, vit_k_mcg = 0, vit_e_mg = 5.65, vit_b6_mg = 0.101, choline_mg = 28.8 WHERE fdc_id = 12078;
-- Peanuts, all types, raw
UPDATE ingredients SET potassium_mg = 705, sodium_mg = 18.0, selenium_mcg = 7.2, vit_a_rae_mcg = 0, folate_mcg = 240, magnesium_mg = 168, vit_k_mcg = 0, vit_e_mg = 8.33, vit_b6_mg = 0.348, choline_mg = 52.5 WHERE fdc_id = 16087;
-- Nuts, chestnuts, european, roasted
UPDATE ingredients SET potassium_mg = 592, sodium_mg = 2.0, selenium_mcg = 1.2, vit_a_rae_mcg = 1.0, folate_mcg = 70.0, magnesium_mg = 33.0, vit_k_mcg = 7.8, vit_e_mg = 0.5, vit_b6_mg = 0.497, choline_mg = 1.5 WHERE fdc_id = 12167;
-- Oil, olive, salad or cooking
UPDATE ingredients SET potassium_mg = 1.0, sodium_mg = 2.0, selenium_mcg = 0, vit_a_rae_mcg = 0, folate_mcg = 0, magnesium_mg = 0, vit_k_mcg = 60.2, vit_e_mg = 14.4, vit_b6_mg = 0, choline_mg = 0.3 WHERE fdc_id = 4053;
-- Nuts, coconut milk, raw (liquid expressed from grated meat a
UPDATE ingredients SET potassium_mg = 263, sodium_mg = 15.0, selenium_mcg = 6.2, vit_a_rae_mcg = 0, folate_mcg = 16.0, magnesium_mg = 37.0, vit_k_mcg = 0.1, vit_e_mg = 0.15, vit_b6_mg = 0.033, choline_mg = 8.5 WHERE fdc_id = 12117;
-- Oil, coconut
UPDATE ingredients SET potassium_mg = 0, sodium_mg = 0, selenium_mcg = 0, vit_a_rae_mcg = 0, folate_mcg = 0, magnesium_mg = 0, vit_k_mcg = 0.6, vit_e_mg = 0.11, vit_b6_mg = 0, choline_mg = 0.3 WHERE fdc_id = 4047;
-- Miso
UPDATE ingredients SET potassium_mg = 210, sodium_mg = 3730.0, selenium_mcg = 7.0, vit_a_rae_mcg = 4.0, folate_mcg = 19.0, magnesium_mg = 48.0, vit_k_mcg = 29.3, vit_e_mg = 0.01, vit_b6_mg = 0.199, choline_mg = 72.2 WHERE fdc_id = 16112;
-- Soy sauce made from soy (tamari)
UPDATE ingredients SET potassium_mg = 212, sodium_mg = 5590.0, selenium_mcg = 0.8, vit_a_rae_mcg = 0, folate_mcg = 18.0, magnesium_mg = 40.0, vit_k_mcg = 0, vit_e_mg = 0, vit_b6_mg = 0.2, choline_mg = 38.4 WHERE fdc_id = 16124;
-- Cocoa, dry powder, unsweetened
UPDATE ingredients SET potassium_mg = 1520.0, sodium_mg = 21.0, selenium_mcg = 14.3, vit_a_rae_mcg = 0, folate_mcg = 32.0, magnesium_mg = 499, vit_k_mcg = 2.5, vit_e_mg = 0.1, vit_b6_mg = 0.118, choline_mg = 12.0 WHERE fdc_id = 19165;
-- Candies, sweet chocolate
UPDATE ingredients SET potassium_mg = 290, sodium_mg = 16.0, selenium_mcg = 2.8, vit_a_rae_mcg = 0, folate_mcg = 3.0, magnesium_mg = 113, vit_k_mcg = 6.3, vit_e_mg = 0.26, vit_b6_mg = 0.043, choline_mg = 29.9 WHERE fdc_id = 19081;
-- Mushrooms, Chanterelle, raw
UPDATE ingredients SET potassium_mg = 506, sodium_mg = 9.0, selenium_mcg = 2.2, vit_a_rae_mcg = 0.0, folate_mcg = 2.0, magnesium_mg = 13.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.044, choline_mg = 0.0 WHERE fdc_id = 11239;
-- Seaweed, wakame, raw
UPDATE ingredients SET potassium_mg = 50.0, sodium_mg = 872, selenium_mcg = 0.7, vit_a_rae_mcg = 18.0, folate_mcg = 196, magnesium_mg = 107, vit_k_mcg = 5.3, vit_e_mg = 1.0, vit_b6_mg = 0.002, choline_mg = 13.9 WHERE fdc_id = 11669;
-- SKIPPED fdc_id=93607 (not in SR Legacy 2018, leaving at 0)
-- SKIPPED fdc_id=2097194 (not in SR Legacy 2018, leaving at 0)
-- Ginger root, raw
UPDATE ingredients SET potassium_mg = 415, sodium_mg = 13.0, selenium_mcg = 0.7, vit_a_rae_mcg = 0, folate_mcg = 11.0, magnesium_mg = 43.0, vit_k_mcg = 0.1, vit_e_mg = 0.26, vit_b6_mg = 0.16, choline_mg = 28.8 WHERE fdc_id = 11216;
-- SKIPPED fdc_id=2060 (not in SR Legacy 2018, leaving at 0)
-- Hummus, commercial
UPDATE ingredients SET potassium_mg = 312, sodium_mg = 426, selenium_mcg = 4.7, vit_a_rae_mcg = 1.0, folate_mcg = 48.0, magnesium_mg = 75.0, vit_k_mcg = 22.8, vit_e_mg = 1.54, vit_b6_mg = 0.146, choline_mg = 0.0 WHERE fdc_id = 16158;
-- SKIPPED fdc_id=1097876 (not in SR Legacy 2018, leaving at 0)
-- SKIPPED fdc_id=1100874 (not in SR Legacy 2018, leaving at 0)
-- SKIPPED fdc_id=2347669 (not in SR Legacy 2018, leaving at 0)
-- Cassava, raw
UPDATE ingredients SET potassium_mg = 271, sodium_mg = 14.0, selenium_mcg = 0.7, vit_a_rae_mcg = 1.0, folate_mcg = 27.0, magnesium_mg = 21.0, vit_k_mcg = 1.9, vit_e_mg = 0.19, vit_b6_mg = 0.088, choline_mg = 23.7 WHERE fdc_id = 11134;
-- Wheat flour, white, all-purpose, unenriched
UPDATE ingredients SET potassium_mg = 107, sodium_mg = 2.0, selenium_mcg = 33.9, vit_a_rae_mcg = 0, folate_mcg = 26.0, magnesium_mg = 22.0, vit_k_mcg = 0.3, vit_e_mg = 0.06, vit_b6_mg = 0.044, choline_mg = 10.4 WHERE fdc_id = 169761;
-- Pasta, cooked, enriched, without added salt
UPDATE ingredients SET potassium_mg = 44.0, sodium_mg = 1.0, selenium_mcg = 26.4, vit_a_rae_mcg = 0, folate_mcg = 119, magnesium_mg = 18.0, vit_k_mcg = 0, vit_e_mg = 0.06, vit_b6_mg = 0.049, choline_mg = 6.4 WHERE fdc_id = 169737;
-- Cereals, MALT-O-MEAL, original, plain, dry
UPDATE ingredients SET potassium_mg = 100, sodium_mg = 0, selenium_mcg = 24.9, vit_a_rae_mcg = 0, folate_mcg = 1920.0, magnesium_mg = 16.0, vit_k_mcg = 0.1, vit_e_mg = 0.11, vit_b6_mg = 1.13, choline_mg = 3.6 WHERE fdc_id = 173903;
-- Rye grain
UPDATE ingredients SET potassium_mg = 510, sodium_mg = 2.0, selenium_mcg = 13.9, vit_a_rae_mcg = 1.0, folate_mcg = 38.0, magnesium_mg = 110, vit_k_mcg = 5.9, vit_e_mg = 0.85, vit_b6_mg = 0.294, choline_mg = 30.4 WHERE fdc_id = 20062;
-- Spices, cardamom
UPDATE ingredients SET potassium_mg = 1120.0, sodium_mg = 18.0, selenium_mcg = 0.0, vit_a_rae_mcg = 0, folate_mcg = 0.0, magnesium_mg = 229, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.23, choline_mg = 0.0 WHERE fdc_id = 170919;
-- Beans, pinto, canned, drained solids
UPDATE ingredients SET potassium_mg = 274, sodium_mg = 239, selenium_mcg = 0.0, vit_a_rae_mcg = 0.0, folate_mcg = 24.0, magnesium_mg = 32.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.0, choline_mg = 0.0 WHERE fdc_id = 174286;
-- Rice, brown, long-grain, raw (Includes foods for USDA's Food
UPDATE ingredients SET potassium_mg = 250, sodium_mg = 5.0, selenium_mcg = 17.1, vit_a_rae_mcg = 0, folate_mcg = 23.0, magnesium_mg = 116, vit_k_mcg = 0.6, vit_e_mg = 0.6, vit_b6_mg = 0.477, choline_mg = 21.5 WHERE fdc_id = 169703;
-- Rice, white, long-grain, regular, raw, enriched
UPDATE ingredients SET potassium_mg = 115, sodium_mg = 5.0, selenium_mcg = 15.1, vit_a_rae_mcg = 0, folate_mcg = 387, magnesium_mg = 25.0, vit_k_mcg = 0.1, vit_e_mg = 0.11, vit_b6_mg = 0.164, choline_mg = 5.8 WHERE fdc_id = 168877;
-- Quinoa, uncooked
UPDATE ingredients SET potassium_mg = 563, sodium_mg = 5.0, selenium_mcg = 8.5, vit_a_rae_mcg = 1.0, folate_mcg = 184, magnesium_mg = 197, vit_k_mcg = 0, vit_e_mg = 2.44, vit_b6_mg = 0.487, choline_mg = 70.2 WHERE fdc_id = 168874;
-- Pasta, whole-wheat, dry (Includes foods for USDA's Food Dist
UPDATE ingredients SET potassium_mg = 434, sodium_mg = 6.0, selenium_mcg = 77.6, vit_a_rae_mcg = 0.0, folate_mcg = 69.0, magnesium_mg = 128, vit_k_mcg = 1.4, vit_e_mg = 0.46, vit_b6_mg = 0.283, choline_mg = 0.0 WHERE fdc_id = 169738;
-- Buckwheat
UPDATE ingredients SET potassium_mg = 460, sodium_mg = 1.0, selenium_mcg = 8.3, vit_a_rae_mcg = 0, folate_mcg = 30.0, magnesium_mg = 231, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.21, choline_mg = 0.0 WHERE fdc_id = 170286;
-- Millet, raw
UPDATE ingredients SET potassium_mg = 195, sodium_mg = 5.0, selenium_mcg = 2.7, vit_a_rae_mcg = 0, folate_mcg = 85.0, magnesium_mg = 114, vit_k_mcg = 0.9, vit_e_mg = 0.05, vit_b6_mg = 0.384, choline_mg = 0.0 WHERE fdc_id = 169702;
-- Amaranth grain, uncooked
UPDATE ingredients SET potassium_mg = 508, sodium_mg = 4.0, selenium_mcg = 18.7, vit_a_rae_mcg = 0, folate_mcg = 82.0, magnesium_mg = 248, vit_k_mcg = 0, vit_e_mg = 1.19, vit_b6_mg = 0.591, choline_mg = 69.8 WHERE fdc_id = 170682;
-- Corn, sweet, yellow, raw
UPDATE ingredients SET potassium_mg = 270, sodium_mg = 15.0, selenium_mcg = 0.6, vit_a_rae_mcg = 9.0, folate_mcg = 42.0, magnesium_mg = 37.0, vit_k_mcg = 0.3, vit_e_mg = 0.07, vit_b6_mg = 0.093, choline_mg = 23.0 WHERE fdc_id = 169998;
-- Lentils, raw
UPDATE ingredients SET potassium_mg = 677, sodium_mg = 6.0, selenium_mcg = 0.1, vit_a_rae_mcg = 2.0, folate_mcg = 479, magnesium_mg = 47.0, vit_k_mcg = 5.0, vit_e_mg = 0.49, vit_b6_mg = 0.54, choline_mg = 96.4 WHERE fdc_id = 172420;
-- Chickpeas (garbanzo beans, bengal gram), mature seeds, raw
UPDATE ingredients SET potassium_mg = 718, sodium_mg = 24.0, selenium_mcg = 0, vit_a_rae_mcg = 3.0, folate_mcg = 557, magnesium_mg = 79.0, vit_k_mcg = 9.0, vit_e_mg = 0.82, vit_b6_mg = 0.535, choline_mg = 99.3 WHERE fdc_id = 173756;
-- Beans, black, mature seeds, raw
UPDATE ingredients SET potassium_mg = 1480.0, sodium_mg = 5.0, selenium_mcg = 3.2, vit_a_rae_mcg = 0, folate_mcg = 444, magnesium_mg = 171, vit_k_mcg = 5.6, vit_e_mg = 0.21, vit_b6_mg = 0.286, choline_mg = 66.4 WHERE fdc_id = 173734;
-- Mung beans, mature seeds, raw
UPDATE ingredients SET potassium_mg = 1250.0, sodium_mg = 15.0, selenium_mcg = 8.2, vit_a_rae_mcg = 6.0, folate_mcg = 625, magnesium_mg = 189, vit_k_mcg = 9.0, vit_e_mg = 0.51, vit_b6_mg = 0.382, choline_mg = 97.9 WHERE fdc_id = 174256;
-- Peas, green, raw
UPDATE ingredients SET potassium_mg = 244, sodium_mg = 5.0, selenium_mcg = 1.8, vit_a_rae_mcg = 38.0, folate_mcg = 65.0, magnesium_mg = 33.0, vit_k_mcg = 24.8, vit_e_mg = 0.13, vit_b6_mg = 0.169, choline_mg = 28.4 WHERE fdc_id = 170419;
-- Beans, kidney, red, mature seeds, raw
UPDATE ingredients SET potassium_mg = 1360.0, sodium_mg = 12.0, selenium_mcg = 3.2, vit_a_rae_mcg = 0, folate_mcg = 394, magnesium_mg = 138, vit_k_mcg = 5.6, vit_e_mg = 0.21, vit_b6_mg = 0.397, choline_mg = 65.9 WHERE fdc_id = 173744;
-- Beans, pinto, mature seeds, raw (Includes foods for USDA's F
UPDATE ingredients SET potassium_mg = 1390.0, sodium_mg = 12.0, selenium_mcg = 27.9, vit_a_rae_mcg = 0, folate_mcg = 525, magnesium_mg = 176, vit_k_mcg = 5.6, vit_e_mg = 0.21, vit_b6_mg = 0.474, choline_mg = 66.2 WHERE fdc_id = 175199;
-- Soybeans, mature seeds, raw
UPDATE ingredients SET potassium_mg = 1800.0, sodium_mg = 2.0, selenium_mcg = 17.8, vit_a_rae_mcg = 1.0, folate_mcg = 375, magnesium_mg = 280, vit_k_mcg = 47.0, vit_e_mg = 0.85, vit_b6_mg = 0.377, choline_mg = 116 WHERE fdc_id = 174270;
-- Soybeans, green, raw
UPDATE ingredients SET potassium_mg = 620, sodium_mg = 15.0, selenium_mcg = 1.5, vit_a_rae_mcg = 9.0, folate_mcg = 165, magnesium_mg = 65.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.065, choline_mg = 0.0 WHERE fdc_id = 169282;
-- Sugars, granulated
UPDATE ingredients SET potassium_mg = 2.0, sodium_mg = 1.0, selenium_mcg = 0.6, vit_a_rae_mcg = 0, folate_mcg = 0, magnesium_mg = 0, vit_k_mcg = 0, vit_e_mg = 0, vit_b6_mg = 0, choline_mg = 0 WHERE fdc_id = 169655;
-- Sugar, turbinado
UPDATE ingredients SET potassium_mg = 29.0, sodium_mg = 3.0, selenium_mcg = 0.0, vit_a_rae_mcg = 0.0, folate_mcg = 0.0, magnesium_mg = 2.0, vit_k_mcg = 0.0, vit_e_mg = 0.0, vit_b6_mg = 0.0, choline_mg = 0.0 WHERE fdc_id = 170674;
-- Dates, medjool
UPDATE ingredients SET potassium_mg = 696, sodium_mg = 1.0, selenium_mcg = 0.0, vit_a_rae_mcg = 7.0, folate_mcg = 15.0, magnesium_mg = 54.0, vit_k_mcg = 2.7, vit_e_mg = 0.0, vit_b6_mg = 0.249, choline_mg = 9.9 WHERE fdc_id = 168191;
-- Dates, deglet noor
UPDATE ingredients SET potassium_mg = 656, sodium_mg = 2.0, selenium_mcg = 3.0, vit_a_rae_mcg = 0, folate_mcg = 19.0, magnesium_mg = 43.0, vit_k_mcg = 2.7, vit_e_mg = 0.05, vit_b6_mg = 0.165, choline_mg = 6.3 WHERE fdc_id = 171726;
-- Raisins, dark, seedless (Includes foods for USDA's Food Dist
UPDATE ingredients SET potassium_mg = 744, sodium_mg = 26.0, selenium_mcg = 0.6, vit_a_rae_mcg = 0, folate_mcg = 5.0, magnesium_mg = 36.0, vit_k_mcg = 3.5, vit_e_mg = 0.12, vit_b6_mg = 0.174, choline_mg = 11.1 WHERE fdc_id = 168165;

-- ============================================================
-- Insert new herbs / greens
-- ============================================================

-- Coriander (cilantro) leaves, raw
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Cilantro (fresh)', 'vegetables', 169997,
   23.0, 2.13, 3.67, 0.52, 2.8,
   1.77, 67.0, 0.5, 0, 0, 27.0, 0.0,
   521, 46.0, 0.9, 337, 62.0, 26.0, 310, 2.5, 0.149, 12.8);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 169997), 'es', 'Cilantro fresco');

-- Parsley, fresh
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Parsley (fresh)', 'vegetables', 170416,
   36.0, 2.97, 6.33, 0.79, 3.3,
   6.2, 138, 1.07, 0, 0, 133, 0.0,
   554, 56.0, 0.1, 421, 152, 50.0, 1640.0, 0.75, 0.09, 12.8);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 170416), 'es', 'Perejil fresco');

-- Basil, fresh
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Basil (fresh)', 'vegetables', 172232,
   23.0, 3.15, 2.65, 0.64, 1.6,
   3.17, 177, 0.81, 0, 0, 18.0, 0.0,
   295, 4.0, 0.3, 264, 68.0, 64.0, 415, 0.8, 0.155, 11.4);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 172232), 'es', 'Albahaca fresca');

-- Peppermint, fresh
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Peppermint (fresh)', 'vegetables', 173474,
   70.0, 3.75, 14.9, 0.94, 8.0,
   5.08, 243, 1.11, 0, 0, 31.8, 0.0,
   569, 31.0, 0.0, 212, 114, 80.0, 0.0, 0.0, 0.129, 0.0);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 173474), 'es', 'Hierbabuena fresca');

-- Spearmint, fresh
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Spearmint (fresh)', 'vegetables', 173475,
   44.0, 3.29, 8.41, 0.73, 6.8,
   11.9, 199, 1.09, 0, 0, 13.3, 0.0,
   458, 30.0, 0.0, 203, 105, 63.0, 0.0, 0.0, 0.158, 0.0);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 173475), 'es', 'Menta fresca');

-- Lettuce, cos or romaine, raw
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Lettuce, romaine (raw)', 'vegetables', 169247,
   17.0, 1.23, 3.29, 0.3, 2.1,
   0.97, 33.0, 0.23, 0, 0, 4.0, 0.0,
   247, 8.0, 0.4, 436, 136, 14.0, 102, 0.13, 0.074, 9.9);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 169247), 'es', 'Lechuga romana');

-- Lettuce, green leaf, raw
INSERT INTO ingredients
  (name_en, category, fdc_id,
   cal, protein_g, carbs_g, fat_g, fiber_g,
   iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
   potassium_mg, sodium_mg, selenium_mcg, vit_a_rae_mcg, folate_mcg,
   magnesium_mg, vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg)
VALUES
  ('Lettuce, green leaf (raw)', 'vegetables', 169249,
   15.0, 1.36, 2.87, 0.15, 1.3,
   0.86, 36.0, 0.18, 0, 0, 9.2, 0.0,
   194, 28.0, 0.6, 370, 38.0, 13.0, 126, 0.22, 0.09, 13.6);
INSERT INTO ingredient_translations (ingredient_id, locale, name)
  VALUES ((SELECT id FROM ingredients WHERE fdc_id = 169249), 'es', 'Lechuga hoja verde');

-- ============================================================
-- Remove Camu camu (distorts vitamin C rankings)
-- ============================================================
DELETE FROM ingredients WHERE name_en ILIKE '%camu%';
