import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { CreatePurchasePayload } from '@/types/stock'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload: CreatePurchasePayload = await req.json()

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

    // Crear ítems (el trigger fn_purchase_item_to_movement se encarga del stock)
    const itemRows = payload.items.map(item => ({
      purchase_id:    purchase.id,
      stock_item_id:  item.stock_item_id,
      quantity_gross: item.quantity_gross,
      yield_pct_snap: item.yield_pct_snap ?? 100,
      price_paid:     item.price_paid,
    }))

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
  const supabase = await createServerSupabaseClient()
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
