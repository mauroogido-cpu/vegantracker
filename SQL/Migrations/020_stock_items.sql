-- =============================================================
-- Vegan Tracker — 020_stock_items.sql
-- Catálogo de items de stock del usuario.
--
-- Tres "kinds":
--   'ingredient' — ingrediente bruto comprado (referencia a ingredients)
--   'prep'       — preparación pre-producida (apio cortado, porciones, etc.)
--   'product'    — producto terminado derivado de una receta (laddu, tofu)
--
-- Diseño:
--   • yield_pct sólo aplica a kind='ingredient'. Se toma de aquí
--     cuando el usuario lo personaliza; si es NULL se usa el valor
--     global que se agregará a la tabla ingredients en una migración
--     futura. Para el MVP se asume 100% si no se indica.
--   • unit es siempre 'g' o 'ml' — las "porciones" son sólo una
--     presentación en la UI (D-S3 del plan).
--   • current_stock_g es un campo CALCULADO que se mantiene
--     actualizado por un trigger sobre stock_movements para
--     evitar sumar todos los movimientos en cada query.
--
-- IDEMPOTENTE — safe to re-run.
-- Run after 019_suppliers.sql
-- =============================================================

-- =============================================================
-- TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS stock_items (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL
                                REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Tipo de item ──────────────────────────────────────────
  kind            TEXT        NOT NULL DEFAULT 'ingredient'
                                CHECK (kind IN ('ingredient', 'prep', 'product')),

  -- ── Referencias opcionales ────────────────────────────────
  ingredient_id   UUID        REFERENCES ingredients(id) ON DELETE SET NULL,
  recipe_id       UUID        REFERENCES recipes(id)     ON DELETE SET NULL,

  -- ── Identidad ─────────────────────────────────────────────
  name            TEXT        NOT NULL, -- nombre visible para el usuario
  description     TEXT,                 -- detalle del prep/producto

  -- ── Unidad y rendimiento ──────────────────────────────────
  unit            TEXT        NOT NULL DEFAULT 'g'
                                CHECK (unit IN ('g', 'ml', 'unit')),
  yield_pct       NUMERIC(5,2) DEFAULT 100
                                CHECK (yield_pct > 0 AND yield_pct <= 100),

  -- ── Almacenamiento ────────────────────────────────────────
  storage_type    TEXT        NOT NULL DEFAULT 'pantry'
                                CHECK (storage_type IN ('pantry', 'fridge', 'freezer')),
  shelf_life_days SMALLINT    CHECK (shelf_life_days > 0),

  -- ── Stock y alertas ───────────────────────────────────────
  current_stock_g NUMERIC(10,2) NOT NULL DEFAULT 0,  -- mantenido por trigger
  reorder_point_g NUMERIC(10,2) DEFAULT 0,           -- nivel mínimo para alerta
  wac             NUMERIC(10,6) DEFAULT 0,           -- costo promedio ponderado $/g

  -- ── Timestamps ────────────────────────────────────────────
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ── Constraints ───────────────────────────────────────────
  -- kind='ingredient' debe tener ingredient_id
  CONSTRAINT stock_item_ingredient_ref CHECK (
    kind <> 'ingredient' OR ingredient_id IS NOT NULL
  ),
  -- kind='product' debe tener recipe_id
  CONSTRAINT stock_item_product_ref CHECK (
    kind <> 'product' OR recipe_id IS NOT NULL
  ),
  -- yield_pct sólo tiene sentido para kind='ingredient'
  CONSTRAINT stock_item_yield_only_ingredient CHECK (
    kind = 'ingredient' OR yield_pct = 100
  )
);

-- =============================================================
-- updated_at TRIGGER
-- =============================================================
DROP TRIGGER IF EXISTS trg_stock_items_updated_at ON stock_items;
CREATE TRIGGER trg_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_stock_items_user_id
  ON stock_items(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_items_ingredient_id
  ON stock_items(user_id, ingredient_id)
  WHERE ingredient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_low_stock
  ON stock_items(user_id)
  WHERE current_stock_g <= reorder_point_g AND reorder_point_g > 0;

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_items' AND policyname='stock_items: select own'
  ) THEN
    CREATE POLICY "stock_items: select own"
      ON stock_items FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_items' AND policyname='stock_items: insert own'
  ) THEN
    CREATE POLICY "stock_items: insert own"
      ON stock_items FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_items' AND policyname='stock_items: update own'
  ) THEN
    CREATE POLICY "stock_items: update own"
      ON stock_items FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_items' AND policyname='stock_items: delete own'
  ) THEN
    CREATE POLICY "stock_items: delete own"
      ON stock_items FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;

-- =============================================================
-- GRANTS
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE
  ON stock_items TO authenticated, service_role;

-- =============================================================
-- COMMENTS
-- =============================================================
COMMENT ON TABLE stock_items IS
'Catálogo de items de stock del usuario. Tres tipos:
  ingredient — ingrediente crudo comprado (ej: piña entera)
  prep       — preparación pre-producida (ej: piña pelada en cubos)
  product    — producto terminado de una receta (ej: 20 laddu)
current_stock_g se actualiza por trigger en stock_movements.
wac = Weighted Average Cost en $/g, recalculado en cada compra.';

COMMENT ON COLUMN stock_items.yield_pct IS
'Rendimiento del ingrediente tras limpieza/pelado/corte.
Sólo aplica a kind=ingredient. 60 = 60% de la compra bruta es aprovechable.
NULL o 100 = sin merma estructural.';

COMMENT ON COLUMN stock_items.current_stock_g IS
'Saldo actual en gramos/ml. Mantenido automáticamente por
fn_update_stock_balance() trigger en stock_movements.
No editar directamente — usar stock_movements para correcciones.';

COMMENT ON COLUMN stock_items.wac IS
'Weighted Average Cost por gramo en la moneda del perfil del usuario.
Recalculado en fn_recalc_wac() tras cada compra (movement_type=purchase).';
