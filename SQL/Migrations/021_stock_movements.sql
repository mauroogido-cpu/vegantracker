-- =============================================================
-- Vegan Tracker — 021_stock_movements.sql
-- Libro mayor de movimientos de stock (ledger).
--
-- Principio: NUNCA se modifica ni elimina un movimiento una vez
-- registrado. Las correcciones se hacen con nuevas filas tipo
-- 'adjustment'. Esto garantiza trazabilidad completa.
--
-- Tipos de movimiento:
--   purchase    — compra (siempre positivo)
--   prep_in     — entrada de pre-producción o producto terminado
--   prep_out    — salida de bruto para pre-producción
--   recipe_use  — uso en meal_log (descuenta stock)
--   adjustment  — corrección manual, merma real, vencimiento
--   inventory   — recuento físico: ajusta al valor real contado
--
-- Lógica WAC (sólo en purchase):
--   nuevo_wac = (saldo_anterior × wac_anterior + cantidad_net × precio_unit)
--               / (saldo_anterior + cantidad_net)
-- El trigger fn_update_stock_balance actualiza stock_items.
--
-- IDEMPOTENTE — safe to re-run.
-- Run after 020_stock_items.sql
-- =============================================================

-- =============================================================
-- TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL
                                REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_item_id   UUID        NOT NULL
                                REFERENCES stock_items(id) ON DELETE CASCADE,

  -- ── Tipo de movimiento ────────────────────────────────────
  movement_type   TEXT        NOT NULL
                                CHECK (movement_type IN (
                                  'purchase',
                                  'prep_in',
                                  'prep_out',
                                  'recipe_use',
                                  'adjustment',
                                  'inventory'
                                )),

  -- ── Cantidad ──────────────────────────────────────────────
  -- quantity: positivo = entrada, negativo = salida (en la unidad del item)
  -- Para 'purchase': quantity es la cantidad NETA (después de yield)
  quantity        NUMERIC(10,2) NOT NULL,
  -- quantity_gross: sólo para 'purchase', los gramos brutos comprados
  quantity_gross  NUMERIC(10,2),

  -- ── Costos ───────────────────────────────────────────────
  unit_cost       NUMERIC(10,6) DEFAULT 0,  -- precio unitario de esta transacción
  total_cost      NUMERIC(10,4) DEFAULT 0,  -- quantity * unit_cost (calculado)
  -- WAC del item DESPUÉS de este movimiento (snapshot para historia)
  wac_after       NUMERIC(10,6) DEFAULT 0,

  -- ── Referencias ───────────────────────────────────────────
  -- ID del objeto que originó este movimiento
  purchase_item_id UUID,       -- FK tardía → purchase_items (agregada en 022_purchases.sql)
  prep_task_id     UUID,       -- FK a prep_tasks (tabla creada en 023)
  meal_log_id      UUID        REFERENCES meal_log(id)       ON DELETE SET NULL,

  -- ── Metadatos ─────────────────────────────────────────────
  notes           TEXT,
  moved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ── Constraints ───────────────────────────────────────────
  -- purchase siempre positivo
  CONSTRAINT stock_mov_purchase_positive CHECK (
    movement_type <> 'purchase' OR quantity > 0
  ),
  -- prep_out y recipe_use siempre negativos
  CONSTRAINT stock_mov_out_negative CHECK (
    movement_type NOT IN ('prep_out', 'recipe_use') OR quantity < 0
  ),
  -- quantity_gross sólo en purchase
  CONSTRAINT stock_mov_gross_only_purchase CHECK (
    quantity_gross IS NULL OR movement_type = 'purchase'
  )
);

-- =============================================================
-- TRIGGER: actualizar current_stock_g y WAC en stock_items
-- =============================================================
CREATE OR REPLACE FUNCTION fn_update_stock_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_old_stock  NUMERIC;
  v_old_wac    NUMERIC;
  v_new_stock  NUMERIC;
  v_new_wac    NUMERIC;
BEGIN
  -- Obtener saldo y WAC actuales del item
  SELECT current_stock_g, wac
    INTO v_old_stock, v_old_wac
    FROM stock_items
   WHERE id = NEW.stock_item_id;

  v_new_stock := v_old_stock + NEW.quantity;

  -- Recalcular WAC sólo en compras (movement_type='purchase')
  IF NEW.movement_type = 'purchase' AND NEW.quantity > 0 AND NEW.unit_cost > 0 THEN
    IF v_old_stock <= 0 THEN
      -- Sin stock previo → el WAC es el precio de esta compra
      v_new_wac := NEW.unit_cost;
    ELSE
      -- WAC ponderado: (saldo_anterior × wac_anterior + cantidad_nueva × precio_unit)
      --               / (saldo_anterior + cantidad_nueva)
      v_new_wac := (v_old_stock * v_old_wac + NEW.quantity * NEW.unit_cost)
                   / (v_old_stock + NEW.quantity);
    END IF;
  ELSE
    -- Para todos los demás movimientos el WAC no cambia
    v_new_wac := v_old_wac;
  END IF;

  -- Guardar snapshot del WAC post-movimiento en el propio movimiento
  NEW.wac_after := v_new_wac;

  -- Calcular total_cost si no viene seteado
  IF NEW.total_cost = 0 AND NEW.unit_cost > 0 THEN
    NEW.total_cost := ABS(NEW.quantity) * NEW.unit_cost;
  END IF;

  -- Actualizar el item
  UPDATE stock_items
     SET current_stock_g = v_new_stock,
         wac             = v_new_wac,
         updated_at      = NOW()
   WHERE id = NEW.stock_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_stock_movements_balance ON stock_movements;
CREATE TRIGGER trg_stock_movements_balance
  BEFORE INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_stock_balance();

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_stock_mov_user_id
  ON stock_movements(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_mov_stock_item_id
  ON stock_movements(stock_item_id, moved_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_mov_meal_log_id
  ON stock_movements(meal_log_id)
  WHERE meal_log_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_mov_moved_at
  ON stock_movements(user_id, moved_at DESC);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_movements' AND policyname='stock_movements: select own'
  ) THEN
    CREATE POLICY "stock_movements: select own"
      ON stock_movements FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_movements' AND policyname='stock_movements: insert own'
  ) THEN
    CREATE POLICY "stock_movements: insert own"
      ON stock_movements FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Sin UPDATE ni DELETE — el ledger es inmutable.
  -- Las correcciones se hacen con nuevas filas tipo 'adjustment'.
END;
$$;

GRANT SELECT, INSERT
  ON stock_movements TO authenticated, service_role;

-- =============================================================
-- COMMENTS
-- =============================================================
COMMENT ON TABLE stock_movements IS
'Libro mayor inmutable de movimientos de stock. 
Positivo = entrada, negativo = salida (en unidad del stock_item).
No se actualiza ni elimina ninguna fila — las correcciones se
insertan como filas nuevas con movement_type=adjustment.
El trigger fn_update_stock_balance mantiene stock_items.current_stock_g
y recalcula el WAC en cada compra.';

COMMENT ON COLUMN stock_movements.quantity IS
'Para purchase: gramos NETOS después de aplicar yield_pct.
Para todos los demás: positivo = entrada, negativo = salida.';

COMMENT ON COLUMN stock_movements.wac_after IS
'Snapshot del WAC del item después de procesar este movimiento.
Permite reconstruir la historia de costos.';
