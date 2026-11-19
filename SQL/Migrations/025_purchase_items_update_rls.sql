-- =============================================================
-- Migration 025: Política RLS UPDATE para purchase_items
-- Permite al dueño de la compra actualizar el precio de sus líneas.
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'purchase_items'
       AND policyname = 'purchase_items: update own'
  ) THEN
    CREATE POLICY "purchase_items: update own"
      ON purchase_items FOR UPDATE TO authenticated
      USING (
        purchase_id IN (
          SELECT id FROM purchases WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        purchase_id IN (
          SELECT id FROM purchases WHERE user_id = auth.uid()
        )
      );
  END IF;
END;
$$;

-- También: UPDATE en stock_movements para corregir unit_cost/total_cost
-- (usado por el endpoint PATCH al cambiar precio_paid)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'stock_movements'
       AND policyname = 'stock_movements: update own purchase cost'
  ) THEN
    CREATE POLICY "stock_movements: update own purchase cost"
      ON stock_movements FOR UPDATE TO authenticated
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;
