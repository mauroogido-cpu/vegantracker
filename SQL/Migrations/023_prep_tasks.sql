-- =============================================================
-- Vegan Tracker — 023_prep_tasks.sql
-- Tareas de pre-producción: prep, transform, cook.
--
-- Tres tipos:
--   prep      — mismo ingrediente, mejor estado
--               (apio entero → apio lavado/cortado en porciones)
--   transform — un item → otro diferente
--               (soya → tofu, almendras → leche de almendras)
--   cook      — receta ejecutada → producto terminado en stock
--               (Laddu batch → 20 unidades en stock)
--
-- Flujo al ejecutar (status 'done'):
--  1. INSERT prep_task_outputs con quantity_actual
--  2. trigger fn_prep_task_complete genera:
--     → stock_movement 'prep_out' por cada input (negativo)
--     → stock_movement 'prep_in' por cada output (positivo)
--     La diferencia expected vs actual = merma de proceso
--
-- IDEMPOTENTE — safe to re-run.
-- Run after 022_purchases.sql
-- =============================================================

-- =============================================================
-- TABLE: prep_tasks
-- =============================================================
CREATE TABLE IF NOT EXISTS prep_tasks (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL
                                REFERENCES auth.users(id) ON DELETE CASCADE,

  task_type       TEXT        NOT NULL
                                CHECK (task_type IN ('prep', 'transform', 'cook')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),

  -- Referencia opcional a receta (para task_type='cook')
  recipe_id       UUID        REFERENCES recipes(id) ON DELETE SET NULL,

  name            TEXT        NOT NULL,  -- descripción corta de la tarea
  notes           TEXT,

  scheduled_for   DATE,
  done_at         TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_prep_tasks_updated_at ON prep_tasks;
CREATE TRIGGER trg_prep_tasks_updated_at
  BEFORE UPDATE ON prep_tasks
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_prep_tasks_user_id
  ON prep_tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_prep_tasks_pending
  ON prep_tasks(user_id, scheduled_for)
  WHERE status IN ('pending', 'in_progress');

-- =============================================================
-- TABLE: prep_task_inputs
-- =============================================================
CREATE TABLE IF NOT EXISTS prep_task_inputs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  prep_task_id    UUID        NOT NULL
                                REFERENCES prep_tasks(id) ON DELETE CASCADE,
  stock_item_id   UUID        NOT NULL
                                REFERENCES stock_items(id) ON DELETE RESTRICT,
  quantity        NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit            TEXT        NOT NULL DEFAULT 'g'
                                CHECK (unit IN ('g', 'ml', 'unit'))
);

CREATE INDEX IF NOT EXISTS idx_prep_inputs_task_id
  ON prep_task_inputs(prep_task_id);

-- =============================================================
-- TABLE: prep_task_outputs
-- =============================================================
CREATE TABLE IF NOT EXISTS prep_task_outputs (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  prep_task_id        UUID        NOT NULL
                                    REFERENCES prep_tasks(id) ON DELETE CASCADE,
  stock_item_id       UUID        NOT NULL
                                    REFERENCES stock_items(id) ON DELETE RESTRICT,
  quantity_expected   NUMERIC(10,2) NOT NULL CHECK (quantity_expected > 0),
  quantity_actual     NUMERIC(10,2) CHECK (quantity_actual >= 0),
  unit                TEXT        NOT NULL DEFAULT 'g'
                                    CHECK (unit IN ('g', 'ml', 'unit')),
  -- merma de proceso = quantity_expected - quantity_actual  (calculada al reportar)
  processed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prep_outputs_task_id
  ON prep_task_outputs(prep_task_id);

-- =============================================================
-- TRIGGER: al marcar una tarea como done → crear movimientos
-- =============================================================
CREATE OR REPLACE FUNCTION fn_prep_task_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_input  RECORD;
  v_output RECORD;
  v_wac    NUMERIC;
  v_total_input_cost NUMERIC := 0;
  v_total_output_qty NUMERIC := 0;
  v_output_wac NUMERIC;
BEGIN
  -- Sólo actuar al pasar de cualquier estado a 'done'
  IF NEW.status <> 'done' OR OLD.status = 'done' THEN
    RETURN NEW;
  END IF;

  -- Calcular costo total de inputs para derivar WAC del output
  FOR v_input IN
    SELECT pti.stock_item_id, pti.quantity, si.wac
      FROM prep_task_inputs pti
      JOIN stock_items si ON si.id = pti.stock_item_id
     WHERE pti.prep_task_id = NEW.id
  LOOP
    -- prep_out: salida negativa del stock bruto/origen
    INSERT INTO stock_movements (
      user_id, stock_item_id, movement_type,
      quantity, unit_cost, total_cost, prep_task_id, moved_at
    ) VALUES (
      NEW.user_id, v_input.stock_item_id, 'prep_out',
      -v_input.quantity,
      v_input.wac,
      v_input.quantity * v_input.wac,
      NEW.id,
      COALESCE(NEW.done_at, NOW())
    );

    v_total_input_cost := v_total_input_cost + (v_input.quantity * v_input.wac);
  END LOOP;

  -- Calcular cantidad total de outputs reales
  SELECT COALESCE(SUM(COALESCE(quantity_actual, quantity_expected)), 0)
    INTO v_total_output_qty
    FROM prep_task_outputs
   WHERE prep_task_id = NEW.id;

  -- WAC del output = costo total inputs / cantidad total outputs
  IF v_total_output_qty > 0 THEN
    v_output_wac := v_total_input_cost / v_total_output_qty;
  ELSE
    v_output_wac := 0;
  END IF;

  -- prep_in: entrada positiva al stock destino
  FOR v_output IN
    SELECT pto.stock_item_id,
           COALESCE(pto.quantity_actual, pto.quantity_expected) AS qty
      FROM prep_task_outputs pto
     WHERE pto.prep_task_id = NEW.id
  LOOP
    INSERT INTO stock_movements (
      user_id, stock_item_id, movement_type,
      quantity, unit_cost, total_cost, prep_task_id, moved_at
    ) VALUES (
      NEW.user_id, v_output.stock_item_id, 'prep_in',
      v_output.qty,
      v_output_wac,
      v_output.qty * v_output_wac,
      NEW.id,
      COALESCE(NEW.done_at, NOW())
    );
  END LOOP;

  -- Actualizar done_at si no fue seteado
  IF NEW.done_at IS NULL THEN
    NEW.done_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prep_task_complete ON prep_tasks;
CREATE TRIGGER trg_prep_task_complete
  BEFORE UPDATE ON prep_tasks
  FOR EACH ROW
  EXECUTE FUNCTION fn_prep_task_complete();

-- FK tardía en stock_movements para prep_task_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'stock_movements_prep_task_id_fkey'
  ) THEN
    ALTER TABLE stock_movements
      ADD CONSTRAINT stock_movements_prep_task_id_fkey
      FOREIGN KEY (prep_task_id) REFERENCES prep_tasks(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE prep_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_task_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_task_outputs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- prep_tasks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_tasks' AND policyname='prep_tasks: select own') THEN
    CREATE POLICY "prep_tasks: select own" ON prep_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_tasks' AND policyname='prep_tasks: insert own') THEN
    CREATE POLICY "prep_tasks: insert own" ON prep_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_tasks' AND policyname='prep_tasks: update own') THEN
    CREATE POLICY "prep_tasks: update own" ON prep_tasks FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_tasks' AND policyname='prep_tasks: delete own') THEN
    CREATE POLICY "prep_tasks: delete own" ON prep_tasks FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;

  -- prep_task_inputs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_inputs' AND policyname='prep_task_inputs: select own') THEN
    CREATE POLICY "prep_task_inputs: select own" ON prep_task_inputs FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_inputs' AND policyname='prep_task_inputs: insert own') THEN
    CREATE POLICY "prep_task_inputs: insert own" ON prep_task_inputs FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_inputs' AND policyname='prep_task_inputs: delete own') THEN
    CREATE POLICY "prep_task_inputs: delete own" ON prep_task_inputs FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;

  -- prep_task_outputs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_outputs' AND policyname='prep_task_outputs: select own') THEN
    CREATE POLICY "prep_task_outputs: select own" ON prep_task_outputs FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_outputs' AND policyname='prep_task_outputs: insert own') THEN
    CREATE POLICY "prep_task_outputs: insert own" ON prep_task_outputs FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_outputs' AND policyname='prep_task_outputs: update own') THEN
    CREATE POLICY "prep_task_outputs: update own" ON prep_task_outputs FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_task_outputs' AND policyname='prep_task_outputs: delete own') THEN
    CREATE POLICY "prep_task_outputs: delete own" ON prep_task_outputs FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM prep_tasks pt WHERE pt.id = prep_task_id AND pt.user_id = auth.uid()));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON prep_tasks TO authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON prep_task_inputs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON prep_task_outputs TO authenticated, service_role;

-- =============================================================
-- COMMENTS
-- =============================================================
COMMENT ON TABLE prep_tasks IS
'Tareas de pre-producción.
prep:      mismo item, mejor estado (lavar/cortar/porcionar)
transform: un item a otro diferente (soya → tofu)
cook:      receta ejecutada → producto terminado en stock (laddu batch)
Al marcar status=done el trigger crea automáticamente los
stock_movements de prep_out (inputs) y prep_in (outputs).';

COMMENT ON TABLE prep_task_outputs IS
'quantity_expected: cantidad planificada al crear la tarea.
quantity_actual:    cantidad real obtenida (se completa al ejecutar).
La diferencia (expected - actual) es la merma de proceso.';
