-- =============================================================
-- Vegan Tracker — 006_rpc_log_meal.sql
-- RPC: log_meal_with_overrides
--
-- Inserts a meal_log entry and its ingredient overrides in a
-- single Postgres transaction. If the override insert fails,
-- the log entry is rolled back automatically.
--
-- Called from the client as:
--   supabase.rpc('log_meal_with_overrides', { entry: {...}, overrides: [...] })
--
-- Run after 005_meal_log_overrides.sql
-- =============================================================

-- =============================================================
-- TYPE: override item passed in the JSON array
-- =============================================================
-- We use jsonb for the overrides array so the client can pass
-- a plain JSON array without needing a custom PG type.
-- Each element must be:
--   { ingredient_id: uuid, quantity_g: numeric|null, excluded: boolean }

CREATE OR REPLACE FUNCTION log_meal_with_overrides(
  entry     jsonb,   -- the meal_log row (without id / created_at)
  overrides jsonb    -- array of override objects; pass '[]' if none
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER   -- runs as the function owner, bypasses RLS for the insert;
                   -- we enforce ownership manually below
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_log_id    uuid;
  v_log_row   meal_log;
  v_override  jsonb;
BEGIN
  -- ── 1. Verify the caller owns this entry ───────────────────
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF (entry->>'user_id')::uuid <> v_user_id THEN
    RAISE EXCEPTION 'forbidden: user_id mismatch';
  END IF;

  -- ── 2. Insert the meal_log row ─────────────────────────────
  INSERT INTO meal_log (
    user_id,
    logged_at,
    meal_type,
    recipe_id,
    ingredient_id,
    servings,
    quantity_g,
    notes
  )
  VALUES (
    v_user_id,
    (entry->>'logged_at')::date,
    entry->>'meal_type',
    (entry->>'recipe_id')::uuid,
    (entry->>'ingredient_id')::uuid,
    (entry->>'servings')::numeric,
    (entry->>'quantity_g')::numeric,
    entry->>'notes'
  )
  RETURNING * INTO v_log_row;

  v_log_id := v_log_row.id;

  -- ── 3. Insert overrides (if any) ──────────────────────────
  IF jsonb_array_length(overrides) > 0 THEN
    FOR v_override IN SELECT * FROM jsonb_array_elements(overrides)
    LOOP
      INSERT INTO meal_log_ingredient_overrides (
        meal_log_id,
        ingredient_id,
        quantity_g,
        excluded
      )
      VALUES (
        v_log_id,
        (v_override->>'ingredient_id')::uuid,
        CASE
          WHEN (v_override->>'excluded')::boolean = TRUE THEN NULL
          ELSE (v_override->>'quantity_g')::numeric
        END,
        COALESCE((v_override->>'excluded')::boolean, FALSE)
      );
    END LOOP;
  END IF;

  -- ── 4. Return the created log row as JSON ──────────────────
  RETURN to_jsonb(v_log_row);

EXCEPTION
  WHEN OTHERS THEN
    -- The transaction rolls back automatically; re-raise the error
    RAISE;
END;
$$;

-- Grant execution to authenticated users only
GRANT EXECUTE ON FUNCTION log_meal_with_overrides(jsonb, jsonb)
  TO authenticated;

-- Revoke from public (SECURITY DEFINER functions are public by default)
REVOKE EXECUTE ON FUNCTION log_meal_with_overrides(jsonb, jsonb)
  FROM public;

-- =============================================================
-- COMMENT
-- =============================================================
COMMENT ON FUNCTION log_meal_with_overrides(jsonb, jsonb) IS
'Inserts a meal_log entry and its ingredient overrides atomically.
Args:
  entry     – meal_log fields as JSON (user_id, logged_at, meal_type,
              recipe_id, ingredient_id, servings, quantity_g, notes)
  overrides – JSON array of { ingredient_id, quantity_g, excluded }.
              Pass ''[]''::jsonb when there are no overrides.
Returns the inserted meal_log row as JSON.';
