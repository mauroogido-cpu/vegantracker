-- =============================================================
-- Vegan Tracker — 019_suppliers.sql
-- Proveedores / tiendas donde el usuario hace sus compras.
--
-- Diseño:
--   • Un proveedor pertenece a un usuario (RLS).
--   • visit_days es texto libre ("sábados por la mañana") para
--     mantener flexibilidad sin complicar el schema inicial.
--   • Los precios históricos por proveedor se derivarán de
--     purchase_items (migración 022) — no se almacenan aquí.
--
-- IDEMPOTENTE — safe to re-run.
-- Run after 016_profile_height_activity.sql
-- =============================================================

-- =============================================================
-- TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL
                            REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Identidad ─────────────────────────────────────────────
  name        TEXT        NOT NULL,                -- "Mercado de Surquillo"
  location    TEXT,                                -- dirección o descripción
  visit_days  TEXT,                                -- "sábados por la mañana"
  notes       TEXT,

  -- ── Timestamps ────────────────────────────────────────────
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- updated_at TRIGGER
-- =============================================================
DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id
  ON suppliers(user_id);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='suppliers' AND policyname='suppliers: select own'
  ) THEN
    CREATE POLICY "suppliers: select own"
      ON suppliers FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='suppliers' AND policyname='suppliers: insert own'
  ) THEN
    CREATE POLICY "suppliers: insert own"
      ON suppliers FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='suppliers' AND policyname='suppliers: update own'
  ) THEN
    CREATE POLICY "suppliers: update own"
      ON suppliers FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='suppliers' AND policyname='suppliers: delete own'
  ) THEN
    CREATE POLICY "suppliers: delete own"
      ON suppliers FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;

-- =============================================================
-- GRANTS
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE
  ON suppliers TO authenticated, service_role;

-- =============================================================
-- COMMENTS
-- =============================================================
COMMENT ON TABLE suppliers IS
'Proveedores del usuario (mercados, ferias, supermercados).
Los precios históricos se derivan de purchase_items; aquí sólo se
almacenan los datos de contacto y visita.';
