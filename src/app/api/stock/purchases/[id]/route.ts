import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PurchaseLineInput } from '@/types/stock'

interface UpdateItemPatch {
  id:              string
  price_paid?:     number
  quantity_gross?: number
  yield_pct_snap?: number
}

interface UpdatePurchaseBody {
  // Cabecera (todos opcionales)
  supplier_id?:  string | null
  purchased_at?: string
  currency?:     string
  total_paid?:   number | null
  notes?:        string | null
  // Ítems existentes: precio y/o cantidades
  update_items?: UpdateItemPatch[]
  // Nuevas líneas a agregar
  add_items?: PurchaseLineInput[]
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Verificar que la compra pertenece al usuario
    const { data: existing, error: fetchErr } = await supabase
      .from('purchases')
      .select('id, currency')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    const body: UpdatePurchaseBody = await req.json()

    // ── 1. Actualizar cabecera ──────────────────────────────────
    const headerPatch: Record<string, unknown> = {}
    if (body.supplier_id  !== undefined) headerPatch.supplier_id  = body.supplier_id
    if (body.purchased_at !== undefined) headerPatch.purchased_at = body.purchased_at
    if (body.currency     !== undefined) headerPatch.currency     = body.currency
    if (body.total_paid   !== undefined) headerPatch.total_paid   = body.total_paid
    if (body.notes        !== undefined) headerPatch.notes        = body.notes

    if (Object.keys(headerPatch).length > 0) {
      const { error: updateErr } = await supabase
        .from('purchases')
        .update(headerPatch)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    }

    // ── 2. Actualizar ítems existentes ──────────────────────────
    // El trigger fn_update_stock_balance solo corre en INSERT de stock_movements
    // (no en UPDATE ni DELETE), así que manejamos manualmente:
    //   a) UPDATE purchase_items  → quantity_net y price_per_100g_net se recalculan
    //      solos (columnas GENERATED STORED)
    //   b) UPDATE stock_movements → nuevos quantity, unit_cost, total_cost
    //   c) UPDATE stock_items     → current_stock_g += delta (nuevo_net - viejo_net)
    //      WAC: lo dejamos como snapshot histórico; recalcularlo requeriría replay
    //      completo de todos los movimientos del item.
    if (body.update_items && body.update_items.length > 0) {
      for (const patch of body.update_items) {
        // Leer valores actuales del ítem
        const { data: itemRow, error: itemFetchErr } = await supabase
          .from('purchase_items')
          .select('id, stock_item_id, quantity_gross, yield_pct_snap, quantity_net, price_paid')
          .eq('id', patch.id)
          .eq('purchase_id', id)
          .single()

        if (itemFetchErr || !itemRow) continue

        const oldNet      = Number((itemRow as any).quantity_net ?? 0)
        const oldQtyGross = Number((itemRow as any).quantity_gross)
        const oldYield    = Number((itemRow as any).yield_pct_snap)
        const oldPrice    = Number((itemRow as any).price_paid)

        const newQtyGross = patch.quantity_gross ?? oldQtyGross
        const newYield    = patch.yield_pct_snap ?? oldYield
        const newPrice    = patch.price_paid    ?? oldPrice
        const newNet      = Math.round(newQtyGross * (newYield / 100) * 100) / 100
        const deltaQty    = newNet - oldNet

        const changed =
          newQtyGross !== oldQtyGross ||
          newYield    !== oldYield    ||
          newPrice    !== oldPrice

        if (!changed) continue

        // a) UPDATE purchase_items (quantity_net se recalcula en DB)
        const { error: piErr } = await supabase
          .from('purchase_items')
          .update({
            quantity_gross: newQtyGross,
            yield_pct_snap: newYield,
            price_paid:     newPrice,
          })
          .eq('id', patch.id)
          .eq('purchase_id', id)

        if (piErr) {
          return NextResponse.json({ error: piErr.message }, { status: 500 })
        }

        // b) UPDATE stock_movement vinculado
        const newUnitCost = newNet > 0
          ? parseFloat((newPrice / newNet).toFixed(6))
          : 0

        await supabase
          .from('stock_movements')
          .update({
            quantity:       newNet,
            quantity_gross: newQtyGross,
            unit_cost:      newUnitCost,
            total_cost:     newPrice,
          })
          .eq('purchase_item_id', patch.id)

        // c) Ajustar current_stock_g del stock_item por el delta
        if (deltaQty !== 0) {
          const stockItemId = (itemRow as any).stock_item_id

          // Leer current_stock_g actual para sumarlo (Supabase no tiene SQL expressions en update)
          const { data: siRow } = await supabase
            .from('stock_items')
            .select('current_stock_g')
            .eq('id', stockItemId)
            .eq('user_id', user.id)
            .single()

          if (siRow) {
            const newStock = Number((siRow as any).current_stock_g) + deltaQty
            await supabase
              .from('stock_items')
              .update({ current_stock_g: Math.max(0, newStock), updated_at: new Date().toISOString() })
              .eq('id', stockItemId)
              .eq('user_id', user.id)
          }
        }
      }
    }

    // ── 3. Agregar nuevas líneas ────────────────────────────────
    // El trigger fn_purchase_item_to_movement se encarga de crear el
    // stock_movement y actualizar WAC automáticamente al hacer INSERT.
    if (body.add_items && body.add_items.length > 0) {
      const itemRows: {
        purchase_id:    string
        stock_item_id:  string
        quantity_gross: number
        yield_pct_snap: number
        price_paid:     number
      }[] = []

      for (const item of body.add_items) {
        if (!(item.quantity_gross > 0)) continue

        let stockItemId: string | null | undefined = item.stock_item_id

        if (!stockItemId && item.ingredient_id) {
          stockItemId = await resolveStockItemId(supabase, user.id, item.ingredient_id, item.yield_pct_snap)
        }

        if (!stockItemId) continue

        itemRows.push({
          purchase_id:    id,
          stock_item_id:  stockItemId,
          quantity_gross: item.quantity_gross,
          yield_pct_snap: item.yield_pct_snap ?? 100,
          price_paid:     item.price_paid,
        })
      }

      if (itemRows.length > 0) {
        const { error: insertErr } = await supabase
          .from('purchase_items')
          .insert(itemRows)

        if (insertErr) {
          return NextResponse.json({ error: insertErr.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ id }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

/** Busca o crea el stock_item de un ingrediente para el usuario */
async function resolveStockItemId(
  supabase: any,
  userId: string,
  ingredientId?: string,
  yieldPct?: number
): Promise<string | null> {
  if (!ingredientId) return null

  const { data: existing } = await supabase
    .from('stock_items')
    .select('id')
    .eq('user_id', userId)
    .eq('ingredient_id', ingredientId)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('id, name_en')
    .eq('id', ingredientId)
    .maybeSingle()

  if (!ingredient) return null

  const validYield = yieldPct && yieldPct > 0 && yieldPct <= 100 ? yieldPct : 100

  const { data: created } = await supabase
    .from('stock_items')
    .insert({
      user_id:       userId,
      kind:          'ingredient',
      ingredient_id: ingredientId,
      name:          ingredient.name_en,
      unit:          'g',
      yield_pct:     validYield,
      storage_type:  'pantry',
    })
    .select('id')
    .single()

  return created?.id ?? null
}
