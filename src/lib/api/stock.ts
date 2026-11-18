// =============================================================
// Vegan Tracker — src/lib/api/stock.ts
// API functions para el módulo Despensa
// (stock_items, purchases, suppliers, prep_tasks)
// =============================================================

import { createClient } from '@/lib/supabase/client'
import type {
  Supplier,
  SupplierInsert,
  SupplierUpdate,
  StockItem,
  StockItemInsert,
  StockItemUpdate,
  StockItemWithIngredient,
  StockMovement,
  StockMovementDetail,
  MovementInsert,
  Purchase,
  PurchaseInsert,
  PurchaseItem,
  PurchaseItemInsert,
  PurchaseWithItems,
  CreatePurchasePayload,
  PrepTask,
  PrepTaskInsert,
  PrepTaskDetail,
  PrepTaskInput,
  PrepTaskInputInsert,
  PrepTaskOutput,
  PrepTaskOutputInsert,
  CreatePrepTaskPayload,
  CompletePrepTaskPayload,
  StockSummary,
} from '@/types/stock'

// ─────────────────────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true })

  if (error) { console.error('getSuppliers:', error.message); return [] }
  return (data ?? []) as Supplier[]
}

export async function upsertSupplier(
  payload: SupplierInsert & { id?: string }
): Promise<Supplier | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) { console.error('upsertSupplier:', error.message); return null }
  return data as Supplier
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) { console.error('deleteSupplier:', error.message); return false }
  return true
}

// ─────────────────────────────────────────────────────────────
// STOCK ITEMS
// ─────────────────────────────────────────────────────────────

export async function getStockItems(): Promise<StockItemWithIngredient[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_items')
    .select(`
      *,
      ingredient:ingredient_id ( id, name_en, category ),
      recipe:recipe_id ( id, name )
    `)
    .order('name', { ascending: true })

  if (error) { console.error('getStockItems:', error.message); return [] }
  return (data ?? []) as unknown as StockItemWithIngredient[]
}

export async function getStockItemById(id: string): Promise<StockItemWithIngredient | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_items')
    .select(`
      *,
      ingredient:ingredient_id ( id, name_en, category ),
      recipe:recipe_id ( id, name )
    `)
    .eq('id', id)
    .single()

  if (error) { console.error('getStockItemById:', error.message); return null }
  return data as unknown as StockItemWithIngredient
}

/** Busca o crea un stock_item para un ingredient_id dado. */
export async function getOrCreateStockItemForIngredient(
  ingredientId: string,
  ingredientNameEn: string,
  yieldPct: number = 100
): Promise<StockItem | null> {
  const supabase = createClient()

  // Buscar existente
  const { data: existing } = await supabase
    .from('stock_items')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .single()

  if (existing) return existing as StockItem

  // Crear nuevo
  const { data: created, error } = await supabase
    .from('stock_items')
    .insert({
      kind:          'ingredient',
      ingredient_id: ingredientId,
      name:          ingredientNameEn,
      unit:          'g',
      yield_pct:     yieldPct,
      storage_type:  'pantry',
    })
    .select()
    .single()

  if (error) { console.error('getOrCreateStockItemForIngredient:', error.message); return null }
  return created as StockItem
}

export async function createStockItem(payload: StockItemInsert): Promise<StockItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_items')
    .insert(payload)
    .select()
    .single()

  if (error) { console.error('createStockItem:', error.message); return null }
  return data as StockItem
}

export async function updateStockItem(
  id: string,
  payload: StockItemUpdate
): Promise<StockItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) { console.error('updateStockItem:', error.message); return null }
  return data as StockItem
}

export async function deleteStockItem(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('stock_items').delete().eq('id', id)
  if (error) { console.error('deleteStockItem:', error.message); return false }
  return true
}

// ─────────────────────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────────────────────

export async function getStockMovements(
  stockItemId?: string,
  limit = 50
): Promise<StockMovementDetail[]> {
  const supabase = createClient()
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      stock_item:stock_item_id ( name, unit, kind )
    `)
    .order('moved_at', { ascending: false })
    .limit(limit)

  if (stockItemId) query = query.eq('stock_item_id', stockItemId)

  const { data, error } = await query
  if (error) { console.error('getStockMovements:', error.message); return [] }
  return (data ?? []) as unknown as StockMovementDetail[]
}

/** Registrar un ajuste manual (merma, corrección, recuento) */
export async function insertAdjustment(
  stockItemId: string,
  quantity: number,     // positivo = entrada, negativo = salida
  notes: string
): Promise<StockMovement | null> {
  const supabase = createClient()

  // Obtener user_id y WAC actual
  const { data: item } = await supabase
    .from('stock_items')
    .select('user_id, wac')
    .eq('id', stockItemId)
    .single()

  if (!item) return null

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      user_id:       item.user_id,
      stock_item_id: stockItemId,
      movement_type: 'adjustment',
      quantity,
      unit_cost:     item.wac,
      total_cost:    Math.abs(quantity) * item.wac,
      notes,
      moved_at:      new Date().toISOString(),
    })
    .select()
    .single()

  if (error) { console.error('insertAdjustment:', error.message); return null }
  return data as StockMovement
}

// ─────────────────────────────────────────────────────────────
// PURCHASES
// ─────────────────────────────────────────────────────────────

export async function getPurchases(limit = 20): Promise<PurchaseWithItems[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:supplier_id ( * ),
      items:purchase_items (
        *,
        stock_item:stock_item_id ( name, unit, kind, ingredient_id, yield_pct )
      )
    `)
    .order('purchased_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('getPurchases:', error.message); return [] }
  return (data ?? []) as unknown as PurchaseWithItems[]
}

export async function getPurchaseById(id: string): Promise<PurchaseWithItems | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:supplier_id ( * ),
      items:purchase_items (
        *,
        stock_item:stock_item_id ( name, unit, kind, ingredient_id, yield_pct )
      )
    `)
    .eq('id', id)
    .single()

  if (error) { console.error('getPurchaseById:', error.message); return null }
  return data as unknown as PurchaseWithItems
}

/**
 * Crear una compra completa con todas sus líneas en una sola operación.
 * Las líneas generan stock_movements automáticamente vía trigger.
 */
export async function createPurchase(
  payload: CreatePurchasePayload
): Promise<PurchaseWithItems | null> {
  const supabase = createClient()

  // 1. Crear cabecera
  const { data: purchase, error: errP } = await supabase
    .from('purchases')
    .insert(payload.purchase)
    .select()
    .single()

  if (errP || !purchase) {
    console.error('createPurchase (header):', errP?.message)
    return null
  }

  // 2. Insertar líneas con el purchase_id recién obtenido
  const items = payload.items.map((item) => ({
    ...item,
    purchase_id: purchase.id,
  }))

  const { error: errI } = await supabase
    .from('purchase_items')
    .insert(items)

  if (errI) {
    console.error('createPurchase (items):', errI.message)
    // Intentar eliminar la cabecera para no dejar registros huérfanos
    await supabase.from('purchases').delete().eq('id', purchase.id)
    return null
  }

  // 3. Devolver la compra completa con items
  return getPurchaseById(purchase.id)
}

export async function deletePurchase(id: string): Promise<boolean> {
  const supabase = createClient()
  // Nota: eliminar una compra NO revierte los stock_movements.
  // Si se quiere revertir, se debe crear un adjustment negativo antes.
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) { console.error('deletePurchase:', error.message); return false }
  return true
}

// ─────────────────────────────────────────────────────────────
// PREP TASKS
// ─────────────────────────────────────────────────────────────

export async function getPrepTasks(
  status?: PrepTask['status']
): Promise<PrepTaskDetail[]> {
  const supabase = createClient()
  let query = supabase
    .from('prep_tasks')
    .select(`
      *,
      recipe:recipe_id ( id, name ),
      inputs:prep_task_inputs (
        *,
        stock_item:stock_item_id ( name, unit, current_stock_g )
      ),
      outputs:prep_task_outputs (
        *,
        stock_item:stock_item_id ( name, unit )
      )
    `)
    .order('scheduled_for', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) { console.error('getPrepTasks:', error.message); return [] }
  return (data ?? []) as unknown as PrepTaskDetail[]
}

export async function getPendingPrepTasks(): Promise<PrepTaskDetail[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prep_tasks')
    .select(`
      *,
      recipe:recipe_id ( id, name ),
      inputs:prep_task_inputs (
        *,
        stock_item:stock_item_id ( name, unit, current_stock_g )
      ),
      outputs:prep_task_outputs (
        *,
        stock_item:stock_item_id ( name, unit )
      )
    `)
    .in('status', ['pending', 'in_progress'])
    .order('scheduled_for', { ascending: true, nullsFirst: false })

  if (error) { console.error('getPendingPrepTasks:', error.message); return [] }
  return (data ?? []) as unknown as PrepTaskDetail[]
}

/**
 * Crear una tarea de pre-producción con sus inputs y outputs planificados.
 */
export async function createPrepTask(
  payload: CreatePrepTaskPayload
): Promise<PrepTaskDetail | null> {
  const supabase = createClient()

  // 1. Crear tarea
  const { data: task, error: errT } = await supabase
    .from('prep_tasks')
    .insert(payload.task)
    .select()
    .single()

  if (errT || !task) {
    console.error('createPrepTask:', errT?.message)
    return null
  }

  // 2. Insertar inputs
  if (payload.inputs.length > 0) {
    const { error: errI } = await supabase
      .from('prep_task_inputs')
      .insert(payload.inputs.map((i) => ({ ...i, prep_task_id: task.id })))

    if (errI) { console.error('createPrepTask (inputs):', errI.message) }
  }

  // 3. Insertar outputs planificados
  if (payload.outputs.length > 0) {
    const { error: errO } = await supabase
      .from('prep_task_outputs')
      .insert(payload.outputs.map((o) => ({ ...o, prep_task_id: task.id })))

    if (errO) { console.error('createPrepTask (outputs):', errO.message) }
  }

  return getPrepTaskById(task.id)
}

export async function getPrepTaskById(id: string): Promise<PrepTaskDetail | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prep_tasks')
    .select(`
      *,
      recipe:recipe_id ( id, name ),
      inputs:prep_task_inputs (
        *,
        stock_item:stock_item_id ( name, unit, current_stock_g )
      ),
      outputs:prep_task_outputs (
        *,
        stock_item:stock_item_id ( name, unit )
      )
    `)
    .eq('id', id)
    .single()

  if (error) { console.error('getPrepTaskById:', error.message); return null }
  return data as unknown as PrepTaskDetail
}

/**
 * Completar una tarea: actualizar cantidades reales de outputs
 * y marcar como done. El trigger fn_prep_task_complete genera
 * los stock_movements automáticamente.
 */
export async function completePrepTask(
  id: string,
  payload: CompletePrepTaskPayload
): Promise<PrepTaskDetail | null> {
  const supabase = createClient()

  // 1. Actualizar cantidades reales en los outputs
  for (const output of payload.outputs) {
    const { error } = await supabase
      .from('prep_task_outputs')
      .update({
        quantity_actual: output.quantity_actual,
        processed_at:   payload.done_at,
      })
      .eq('id', output.id)

    if (error) {
      console.error('completePrepTask (output update):', error.message)
      return null
    }
  }

  // 2. Marcar tarea como done → trigger genera movimientos
  const { error: errT } = await supabase
    .from('prep_tasks')
    .update({
      status:  'done',
      done_at: payload.done_at,
    })
    .eq('id', id)

  if (errT) { console.error('completePrepTask (status):', errT.message); return null }

  return getPrepTaskById(id)
}

export async function updatePrepTaskStatus(
  id: string,
  status: PrepTask['status']
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prep_tasks')
    .update({ status })
    .eq('id', id)

  if (error) { console.error('updatePrepTaskStatus:', error.message); return false }
  return true
}

// ─────────────────────────────────────────────────────────────
// STOCK SUMMARY (dashboard)
// ─────────────────────────────────────────────────────────────

export async function getStockSummary(): Promise<StockSummary> {
  const supabase = createClient()

  const [itemsRes, tasksRes, movementsRes] = await Promise.all([
    supabase.from('stock_items').select('current_stock_g, reorder_point_g, wac'),
    supabase
      .from('prep_tasks')
      .select('id', { count: 'exact' })
      .in('status', ['pending', 'in_progress']),
    supabase
      .from('stock_movements')
      .select('movement_type, total_cost, moved_at')
      .gte('moved_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const items    = (itemsRes.data ?? []) as Array<{ current_stock_g: number; reorder_point_g: number; wac: number }>
  const movements = (movementsRes.data ?? []) as Array<{ movement_type: string; total_cost: number }>

  const total_value    = items.reduce((s, i) => s + i.current_stock_g * i.wac, 0)
  const low_stock      = items.filter((i) => i.reorder_point_g > 0 && i.current_stock_g <= i.reorder_point_g).length
  const weekly_spend   = movements.filter((m) => m.movement_type === 'purchase').reduce((s, m) => s + m.total_cost, 0)
  const weekly_consume = movements.filter((m) => m.movement_type === 'recipe_use').reduce((s, m) => s + Math.abs(m.total_cost), 0)

  return {
    total_items:        items.length,
    total_value:        Math.round(total_value * 100) / 100,
    low_stock_count:    low_stock,
    pending_tasks:      tasksRes.count ?? 0,
    weekly_spend:       Math.round(weekly_spend * 100) / 100,
    weekly_consumption: Math.round(weekly_consume * 100) / 100,
  }
}
