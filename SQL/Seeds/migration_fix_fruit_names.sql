-- migration_fix_fruit_names.sql
-- Removes "(raw)", "(cruda)", "(crudo)" suffix from fruit names only.
-- Idempotent: safe to run multiple times.

-- ingredients.name_en
UPDATE ingredients SET name_en = 'Tangerine'       WHERE fdc_id = 169105 AND name_en = 'Tangerine (raw)';
UPDATE ingredients SET name_en = 'Melon, cantaloupe' WHERE fdc_id = 169092 AND name_en = 'Melon, cantaloupe (raw)';
UPDATE ingredients SET name_en = 'Melon, honeydew'  WHERE fdc_id = 169911 AND name_en = 'Melon, honeydew (raw)';
UPDATE ingredients SET name_en = 'Coconut meat'     WHERE fdc_id = 170169 AND name_en = 'Coconut meat (raw)';
UPDATE ingredients SET name_en = 'Cherimoya'        WHERE fdc_id = 173953 AND name_en = 'Cherimoya (raw)';
-- Lucuma and Pitahaya have no fdc_id; match by current name_en
UPDATE ingredients SET name_en = 'Lucuma'           WHERE name_en = 'Lucuma (raw)';
UPDATE ingredients SET name_en = 'Pitahaya, red'    WHERE name_en = 'Pitahaya, red (raw)';

-- ingredient_translations — Spanish names
UPDATE ingredient_translations
   SET name = 'Mandarina'
 WHERE locale = 'es'
   AND name = 'Mandarina (cruda)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE fdc_id = 169105);

UPDATE ingredient_translations
   SET name = 'Melón cantaloupe'
 WHERE locale = 'es'
   AND name = 'Melón cantaloupe (crudo)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE fdc_id = 169092);

UPDATE ingredient_translations
   SET name = 'Melón verde'
 WHERE locale = 'es'
   AND name = 'Melón verde (crudo)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE fdc_id = 169911);

UPDATE ingredient_translations
   SET name = 'Coco'
 WHERE locale = 'es'
   AND name = 'Coco (crudo)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE fdc_id = 170169);

UPDATE ingredient_translations
   SET name = 'Chirimoya'
 WHERE locale = 'es'
   AND name = 'Chirimoya (cruda)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE fdc_id = 173953);

-- Lucuma / Pitahaya via subquery on name_en (no fdc_id)
UPDATE ingredient_translations
   SET name = 'Lúcuma'
 WHERE locale = 'es'
   AND name = 'Lúcuma (cruda)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE name_en = 'Lucuma');

UPDATE ingredient_translations
   SET name = 'Pitahaya roja'
 WHERE locale = 'es'
   AND name = 'Pitahaya roja (cruda)'
   AND ingredient_id = (SELECT id FROM ingredients WHERE name_en = 'Pitahaya, red');
