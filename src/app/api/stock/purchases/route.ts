import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { CreatePurchaseInput } from '@/types/stock'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload: CreatePurchaseInput = await req.json()

    // Crear cabecera de compra
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .insert({
        user_id:      user.id,
        supplier_id:  payload.supplier_id ?? null,
        purchased_at: payload.purchased_at,
        currency:     payload.currency ?? 'PEN',
        total_paid:   payload.total_paid,
        notes:        payload.notes ?? null,
      })
      .select()
      .single()

    if (purchaseErr || !purchase) {
      return NextResponse.json({ error: purchaseErr?.message ?? 'Error creando compra' }, { status: 500 })
    }

    // Resolver líneas: si vienen con ingredient_id, buscar o crear el stock_item
    const itemRows: {
      purchase_id:    string
      stock_item_id:  string
      quantity_gross: number
      yield_pct_snap: number
      price_paid:     number
    }[] = []

    for (const item of payload.items) {
      if (!(item.quantity_gross > 0)) {
        await supabase.from('purchases').delete().eq('id', purchase.id)
        return NextResponse.json(
          { error: 'Cada ítem necesita una cantidad mayor a 0' },
          { status: 400 }
        )
      }

      const stockItemId = item.stock_item_id
        ?? await resolveStockItemId(supabase, user.id, item.ingredient_id, item.yield_pct_snap)

      if (!stockItemId) {
        await supabase.from('purchases').delete().eq('id', purchase.id)
        return NextResponse.json(
          { error: 'Ítem sin ingrediente válido' },
          { status: 400 }
        )
      }

      itemRows.push({
        purchase_id:    purchase.id,
        stock_item_id:  stockItemId,
        quantity_gross: item.quantity_gross,
        yield_pct_snap: item.yield_pct_snap ?? 100,
        price_paid:     item.price_paid,
      })
    }

    // Insertar líneas (el trigger fn_purchase_item_to_movement se encarga del stock)
    const { error: itemsErr } = await supabase
      .from('purchase_items')
      .insert(itemRows)

    if (itemsErr) {
      // Intentar rollback del header (best-effort)
      await supabase.from('purchases').delete().eq('id', purchase.id)
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    return NextResponse.json({ id: purchase.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(name),
      items:purchase_items(
        id, quantity_gross, yield_pct_snap, quantity_net, price_paid,
        stock_item:stock_items(name, unit)
      )
    `)
    .eq('user_id', user.id)
    .order('purchased_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** Devuelve el stock_item del usuario para un ingrediente, creándolo si no existe. */
async function resolveStockItemId(
  supabase: SupabaseClient,
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

  if (existing?.id) return existing.id as string

  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('id, name_en')
    .eq('id', ingredientId)
    .maybeSingle()

  if (!ingredient) return null

  const validYield = yieldPct && yieldPct > 0 && yieldPct <= 100 ? yieldPct : 100

  const { data: created, error } = await supabase
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

  if (error || !created) {
    console.error('resolveStockItemId:', error?.message)
    return null
  }

  return created.id as string
}
