-- =============================================================
-- Vegan Tracker — 012_unaccent_search.sql
-- Accent-insensitive search — no extensions required.
--
-- Strategy:
--   1. normalize_search(text): pure SQL with translate() covering
--      all Latin characters used in ES/PT/FR/DE. No extensions.
--   2. Add name_normalized to ingredient_translations (computed
--      at insert/update time via trigger).
--   3. Add name_en_normalized / name_es_normalized to
--      user_ingredients (same approach).
--   4. The JS layer also normalizes the query before sending it,
--      so a plain ilike('%maiz%') finds rows with "Maíz".
--
-- Run after 011_user_ingredients.sql
-- =============================================================

-- ── 1. Normalization function ─────────────────────────────────
-- Covers: Spanish, Portuguese, French, German, plus Japanese
-- romanization edge-cases. Add characters as needed.
CREATE OR REPLACE FUNCTION normalize_search(p_text TEXT)
  RETURNS TEXT
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$
  SELECT lower(
    translate(
      p_text,
      'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖÓóòôõöóÚÙÛÜúùûüÝŷýÑñÇçŞşŽžŠšŒœÆæØøÐðÞþ',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiioOOOOOOoooooouUUUUuuuuYyyNnCcSsZzSsOoAaOoDdPp'
    )
  )
$$;

-- ── 2. ingredient_translations ────────────────────────────────

ALTER TABLE ingredient_translations
  ADD COLUMN IF NOT EXISTS name_normalized TEXT;

-- Backfill existing rows
UPDATE ingredient_translations
  SET name_normalized = normalize_search(name)
  WHERE name_normalized IS NULL;

-- Keep in sync on insert/update
CREATE OR REPLACE FUNCTION trg_itrans_normalize()
  RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  NEW.name_normalized := normalize_search(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_itrans_normalize ON ingredient_translations;
CREATE TRIGGER trg_itrans_normalize
  BEFORE INSERT OR UPDATE OF name ON ingredient_translations
  FOR EACH ROW EXECUTE FUNCTION trg_itrans_normalize();

-- Index for accent-insensitive search
CREATE INDEX IF NOT EXISTS idx_itrans_norm_locale
  ON ingredient_translations (locale, name_normalized);

-- ── 3. user_ingredients ───────────────────────────────────────

ALTER TABLE user_ingredients
  ADD COLUMN IF NOT EXISTS name_en_normalized TEXT,
  ADD COLUMN IF NOT EXISTS name_es_normalized TEXT;

-- Backfill
UPDATE user_ingredients
  SET name_en_normalized = normalize_search(name_en),
      name_es_normalized = CASE WHEN name_es IS NOT NULL
                                THEN normalize_search(name_es)
                                ELSE NULL END
  WHERE name_en_normalized IS NULL;

-- Trigger
CREATE OR REPLACE FUNCTION trg_user_ing_normalize()
  RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  NEW.name_en_normalized := normalize_search(NEW.name_en);
  NEW.name_es_normalized := CASE WHEN NEW.name_es IS NOT NULL
                                 THEN normalize_search(NEW.name_es)
                                 ELSE NULL END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_ing_normalize ON user_ingredients;
CREATE TRIGGER trg_user_ing_normalize
  BEFORE INSERT OR UPDATE OF name_en, name_es ON user_ingredients
  FOR EACH ROW EXECUTE FUNCTION trg_user_ing_normalize();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_ing_norm_en
  ON user_ingredients (user_id, name_en_normalized);

CREATE INDEX IF NOT EXISTS idx_user_ing_norm_es
  ON user_ingredients (user_id, name_es_normalized)
  WHERE name_es_normalized IS NOT NULL;
