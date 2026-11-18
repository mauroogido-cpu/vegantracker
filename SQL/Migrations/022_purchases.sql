-- =============================================================
-- Vegan Tracker — 022_purchases.sql
-- Cabecera + líneas de compra.
--
-- purchases      — una visita al mercado / compra
-- purchase_items — cada línea (1 item por fila) con cantidades
--                  y precios. Genera automáticamente un
--                  stock_movement tipo 'purchase' al insertar.
--
-- Flujo:
--  1. INSERT purchases → obtener purchase.id
--  2. INSERT purchase_items (una o varias líneas)
--  3. trigger fn_purchase_item_to_movement genera stock_movement
--     con quantity = quantity_gross × (yield_pct/100)
--     y recalcula el WAC del stock_item
--
-- IDEMPOTENTE — safe to re-run.
-- Run after 021_stock_movements.sql
-- =============================================================

-- =============================================================
-- TABLE: purchases
-- =============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL
                                REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id     UUID        REFERENCES suppliers(id)  ON DELETE SET NULL,

  purchased_at    DATE        NOT NULL DEFAULT CURRENT_DATE,
  currency        TEXT        NOT NULL DEFAULT 'PEN'
                                CHECK (currency IN ('PEN','ARS','USD','EUR','INR','BRL','JPY')),
  total_paid      NUMERIC(10,2),  -- total de la boleta/ticket (opcional)
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_purchases_updated_at ON purchases;
CREATE TRIGGER trg_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_purchases_user_id
  ON purchases(user_id, purchased_at DESC);

-- =============================================================
-- TABLE: purchase_items
-- =============================================================
-- Nota: purchase_item_id referenciada en stock_movements pero la
-- FK formal se agrega aquí para evitar referencias circulares.
CREATE TABLE IF NOT EXISTS purchase_items (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id     UUID        NOT NULL
                                REFERENCES purchases(id) ON DELETE CASCADE,
  stock_item_id   UUID        NOT NULL
                                REFERENCES stock_items(id) ON DELETE RESTRICT,

  -- ── Cantidades ────────────────────────────────────────────
  quantity_gross  NUMERIC(10,2) NOT NULL CHECK (quantity_gross > 0),
  -- yield_pct snapshot — si el usuario cambia el item, el histórico queda correcto
  yield_pct_snap  NUMERIC(5,2)  NOT NULL DEFAULT 100
                                  CHECK (yield_pct_snap > 0 AND yield_pct_snap <= 100),
  -- cantidad neta = quantity_gross × (yield_pct_snap / 100)  (calculada)
  quantity_net    NUMERIC(10,2) GENERATED ALWAYS AS
                    (ROUND(quantity_gross * yield_pct_snap / 100, 2)) STORED,

  -- ── Precios ───────────────────────────────────────────────
  price_paid      NUMERIC(10,2) NOT NULL CHECK (price_paid >= 0),
  -- precio por 100g NETOS = price_paid / (quantity_net / 100)
  -- Calculado como columna generada con workaround para división
  -- (quantity_net > 0 garantizado porque yield_pct_snap > 0 y quantity_gross > 0)
  price_per_100g_net NUMERIC(10,4) GENERATED ALWAYS AS (
    CASE WHEN quantity_gross * yield_pct_snap > 0
         THEN ROUND(price_paid / (quantity_gross * yield_pct_snap / 100 / 100), 4)
         ELSE 0
    END
  ) STORED,

  store_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id
  ON purchase_items(purchase_id);

CREATE INDEX IF NOT EXISTS idx_purchase_items_stock_item_id
  ON purchase_items(stock_item_id);

-- =============================================================
-- TRIGGER: purchase_items → stock_movement automático
-- =============================================================
CREATE OR REPLACE FUNCTION fn_purchase_item_to_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_moved_at DATE;
BEGIN
  -- Obtener user_id y fecha de la compra cabecera
  SELECT p.user_id, p.purchased_at
    INTO v_user_id, v_moved_at
    FROM purchases p
   WHERE p.id = NEW.purchase_id;

  -- Insertar stock_movement (el trigger fn_update_stock_balance
  -- en stock_movements recalculará el WAC automáticamente)
  INSERT INTO stock_movements (
    user_id,
    stock_item_id,
    movement_type,
    quantity,
    quantity_gross,
    unit_cost,
    total_cost,
    purchase_item_id,
    moved_at
  ) VALUES (
    v_user_id,
    NEW.stock_item_id,
    'purchase',
    NEW.quantity_net,                                  -- cantidad neta
    NEW.quantity_gross,                                -- cantidad bruta
    CASE WHEN NEW.quantity_net > 0
         THEN ROUND(NEW.price_paid / NEW.quantity_net, 6)
         ELSE 0 END,                                   -- costo unitario $/g neto
    NEW.price_paid,                                    -- costo total
    NEW.id,                                            -- referencia a esta línea
    v_moved_at::TIMESTAMPTZ
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_purchase_item_movement ON purchase_items;
CREATE TRIGGER trg_purchase_item_movement
  AFTER INSERT ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_purchase_item_to_movement();

-- =============================================================
-- FK TARDÍA: stock_movements.purchase_item_id → purchase_items
-- (no se pudo definir en 021 porque purchase_items no existía)
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'stock_movements_purchase_item_id_fkey'
  ) THEN
    ALTER TABLE stock_movements
      ADD CONSTRAINT stock_movements_purchase_item_id_fkey
      FOREIGN KEY (purchase_item_id) REFERENCES purchase_items(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- =============================================================
-- RLS para purchases
-- =============================================================
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchases' AND policyname='purchases: select own'
  ) THEN
    CREATE POLICY "purchases: select own"
      ON purchases FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchases' AND policyname='purchases: insert own'
  ) THEN
    CREATE POLICY "purchases: insert own"
      ON purchases FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchases' AND policyname='purchases: update own'
  ) THEN
    CREATE POLICY "purchases: update own"
      ON purchases FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchases' AND policyname='purchases: delete own'
  ) THEN
    CREATE POLICY "purchases: delete own"
      ON purchases FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON purchases TO authenticated, service_role;

-- =============================================================
-- RLS para purchase_items (acceso vía JOIN a purchases)
-- =============================================================
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchase_items' AND policyname='purchase_items: select own'
  ) THEN
    CREATE POLICY "purchase_items: select own"
      ON purchase_items FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM purchases p WHERE p.id = purchase_id AND p.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchase_items' AND policyname='purchase_items: insert own'
  ) THEN
    CREATE POLICY "purchase_items: insert own"
      ON purchase_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM purchases p WHERE p.id = purchase_id AND p.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='purchase_items' AND policyname='purchase_items: delete own'
  ) THEN
    CREATE POLICY "purchase_items: delete own"
      ON purchase_items FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM purchases p WHERE p.id = purchase_id AND p.user_id = auth.uid()
      ));
  END IF;
END;
$$;

GRANT SELECT, INSERT, DELETE ON purchase_items TO authenticated, service_role;

-- =============================================================
-- COMMENTS
-- =============================================================
COMMENT ON TABLE purchases IS
'Cabecera de compra. Una fila = una visita al proveedor.
Los items se detallan en purchase_items, que al insertarse
generan automáticamente stock_movements de tipo purchase.';

COMMENT ON TABLE purchase_items IS
'Líneas de compra. Cada fila representa un ingrediente comprado.
Al insertar, el trigger fn_purchase_item_to_movement crea el
stock_movement correspondiente y recalcula el WAC del item.
quantity_net y price_per_100g_net son columnas generadas.';

COMMENT ON COLUMN purchase_items.yield_pct_snap IS
'Snapshot del rendimiento en el momento de la compra.
Independiente de cambios futuros al stock_item.yield_pct.';

COMMENT ON COLUMN purchase_items.quantity_net IS
'Gramos NETOS = quantity_gross × (yield_pct_snap / 100).
Generado automáticamente. Es lo que realmente entra al stock.';
