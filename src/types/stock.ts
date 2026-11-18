// =============================================================
// Vegan Tracker — src/types/stock.ts
// Tipos del módulo Despensa (stock, compras, pre-producción)
// =============================================================

// ── Suppliers ────────────────────────────────────────────────

export interface Supplier {
  id: string
  user_id: string
  name: string
  location: string | null
  visit_days: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SupplierInsert = Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type SupplierUpdate = Partial<SupplierInsert>

// ── Stock Items ───────────────────────────────────────────────

export type StockItemKind = 'ingredient' | 'prep' | 'product'
export type StorageType   = 'pantry' | 'fridge' | 'freezer'
export type StockUnit     = 'g' | 'ml' | 'unit'

export interface StockItem {
  id:               string
  user_id:          string
  kind:             StockItemKind
  ingredient_id:    string | null   // kind='ingredient'
  recipe_id:        string | null   // kind='product'
  name:             string
  description:      string | null
  unit:             StockUnit
  yield_pct:        number          // 0–100, default 100
  storage_type:     StorageType
  shelf_life_days:  number | null
  current_stock_g:  number          // mantenido por trigger
  reorder_point_g:  number          // alerta cuando baja de aquí
  wac:              number          // $/g, Weighted Average Cost
  created_at:       string
  updated_at:       string
}

export type StockItemInsert = Omit<StockItem,
  'id' | 'user_id' | 'current_stock_g' | 'wac' | 'created_at' | 'updated_at'
>
export type StockItemUpdate = Partial<Omit<StockItemInsert, 'kind'>>

// Vista enriquecida con nombre del ingrediente para la UI
export interface StockItemWithIngredient extends StockItem {
  ingredient?: {
    id:        string
    name_en:   string
    category:  string
  } | null
  recipe?: {
    id:        string
    name:      string
  } | null
}

// ── Stock Movements ───────────────────────────────────────────

export type MovementType =
  | 'purchase'
  | 'prep_in'
  | 'prep_out'
  | 'recipe_use'
  | 'adjustment'
  | 'inventory'

export interface StockMovement {
  id:               string
  user_id:          string
  stock_item_id:    string
  movement_type:    MovementType
  quantity:         number          // positivo = entrada, negativo = salida
  quantity_gross:   number | null   // sólo para 'purchase'
  unit_cost:        number
  total_cost:       number
  wac_after:        number          // snapshot del WAC post-movimiento
  purchase_item_id: string | null
  prep_task_id:     string | null
  meal_log_id:      string | null
  notes:            string | null
  moved_at:         string
  created_at:       string
}

export type MovementInsert = Omit<StockMovement,
  'id' | 'user_id' | 'wac_after' | 'created_at'
>

// Vista para listado de historial
export interface StockMovementDetail extends StockMovement {
  stock_item?: {
    name: string
    unit: StockUnit
    kind: StockItemKind
  }
}

// ── Purchases ─────────────────────────────────────────────────

export interface Purchase {
  id:           string
  user_id:      string
  supplier_id:  string | null
  purchased_at: string            // DATE string 'YYYY-MM-DD'
  currency:     string
  total_paid:   number | null     // total del ticket (opcional)
  notes:        string | null
  created_at:   string
  updated_at:   string
}

export type PurchaseInsert = Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type PurchaseUpdate = Partial<PurchaseInsert>

export interface PurchaseItem {
  id:                 string
  purchase_id:        string
  stock_item_id:      string
  quantity_gross:     number
  yield_pct_snap:     number
  quantity_net:       number       // columna generada (read-only)
  price_paid:         number
  price_per_100g_net: number       // columna generada (read-only)
  store_notes:        string | null
  created_at:         string
}

export type PurchaseItemInsert = Omit<PurchaseItem,
  'id' | 'quantity_net' | 'price_per_100g_net' | 'created_at'
>

// Vista para formulario de compra con item enriquecido
export interface PurchaseItemDetail extends PurchaseItem {
  stock_item?: {
    name:          string
    unit:          StockUnit
    kind:          StockItemKind
    ingredient_id: string | null
    yield_pct:     number
  }
}

// Payload para crear una compra completa en un solo paso
export interface CreatePurchasePayload {
  purchase: PurchaseInsert
  items: Array<Omit<PurchaseItemInsert, 'purchase_id'>>
}

// Vista completa de una compra con líneas e items
export interface PurchaseWithItems extends Purchase {
  supplier?: Supplier | null
  items: PurchaseItemDetail[]
}

// ── Prep Tasks ────────────────────────────────────────────────

export type PrepTaskType   = 'prep' | 'transform' | 'cook'
export type PrepTaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'

export interface PrepTask {
  id:            string
  user_id:       string
  task_type:     PrepTaskType
  status:        PrepTaskStatus
  recipe_id:     string | null    // sólo para task_type='cook'
  name:          string
  notes:         string | null
  scheduled_for: string | null    // DATE string
  done_at:       string | null
  created_at:    string
  updated_at:    string
}

export type PrepTaskInsert = Omit<PrepTask, 'id' | 'user_id' | 'done_at' | 'created_at' | 'updated_at'>
export type PrepTaskUpdate = Partial<Omit<PrepTaskInsert, 'task_type'>>

export interface PrepTaskInput {
  id:            string
  prep_task_id:  string
  stock_item_id: string
  quantity:      number
  unit:          StockUnit
}

export type PrepTaskInputInsert = Omit<PrepTaskInput, 'id'>

export interface PrepTaskOutput {
  id:                 string
  prep_task_id:       string
  stock_item_id:      string
  quantity_expected:  number
  quantity_actual:    number | null    // se completa al ejecutar
  unit:               StockUnit
  processed_at:       string | null
}

export type PrepTaskOutputInsert    = Omit<PrepTaskOutput, 'id' | 'quantity_actual' | 'processed_at'>
export type PrepTaskOutputComplete  = Pick<PrepTaskOutput, 'id' | 'quantity_actual'>

// Vista completa para la lista de tareas pendientes
export interface PrepTaskDetail extends PrepTask {
  recipe?: { id: string; name: string } | null
  inputs: Array<PrepTaskInput & {
    stock_item?: { name: string; unit: StockUnit; current_stock_g: number }
  }>
  outputs: Array<PrepTaskOutput & {
    stock_item?: { name: string; unit: StockUnit }
  }>
}

// Payload para crear una tarea completa con inputs y outputs
export interface CreatePrepTaskPayload {
  task:    PrepTaskInsert
  inputs:  Array<Omit<PrepTaskInputInsert, 'prep_task_id'>>
  outputs: Array<Omit<PrepTaskOutputInsert, 'prep_task_id'>>
}

// Payload para completar una tarea (cantidades reales)
export interface CompletePrepTaskPayload {
  done_at:  string
  outputs:  PrepTaskOutputComplete[]
}

// ── Stock Dashboard summary ───────────────────────────────────

export interface StockSummary {
  total_value:          number    // sum(current_stock_g * wac) por item
  items_in_stock:       number    // items con stock > 0
  low_stock_count:      number    // items bajo reorder_point
  pending_tasks:        number
  purchases_7d_cost:    number    // costo de compras últimos 7 días
  consumed_7d_cost:     number    // costo de consumo últimos 7 días
}
