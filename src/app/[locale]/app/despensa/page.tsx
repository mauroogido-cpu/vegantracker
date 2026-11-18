import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import StockSummaryBar from '@/components/stock/StockSummaryBar'
import StockList from '@/components/stock/StockList'
import type { StockItemWithIngredient, StockSummary } from '@/types/stock'

export default async function DespensaPage() {
  const supabase = await createServerSupabaseClient()
  const locale   = await getLocale()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // items con join a ingredient y recipe
  const { data: rawItems } = await supabase
    .from('stock_items')
    .select(`
      *,
      ingredient:ingredients ( id, name_en, category ),
      recipe:recipes ( id, name )
    `)
    .eq('user_id', user.id)
    .order('name')

  const items = (rawItems ?? []) as StockItemWithIngredient[]

  // movimientos últimos 7 días
  const since7 = new Date(Date.now() - 7 * 86400_000).toISOString()
  const { data: movements7 } = await supabase
    .from('stock_movements')
    .select('movement_type, quantity, unit_cost')
    .eq('user_id', user.id)
    .gte('created_at', since7)

  // tareas pendientes
  const { count: pendingTasks } = await supabase
    .from('prep_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['pending', 'in_progress'])

  // summary
  const totalValue    = items.reduce((s, i) => s + i.current_stock_g * i.wac, 0)
  const itemsInStock  = items.filter(i => i.current_stock_g > 0).length
  const lowStock      = items.filter(i => i.reorder_point_g > 0 && i.current_stock_g > 0 && i.current_stock_g <= i.reorder_point_g).length

  const purchases7Cost  = (movements7 ?? [])
    .filter(m => m.movement_type === 'purchase')
    .reduce((s, m) => s + (m.unit_cost ?? 0) * Math.abs(m.quantity), 0)

  const consumed7Cost   = (movements7 ?? [])
    .filter(m => ['recipe_use','prep_out','adjustment'].includes(m.movement_type) && m.quantity < 0)
    .reduce((s, m) => s + (m.unit_cost ?? 0) * Math.abs(m.quantity), 0)

  const summary: StockSummary = {
    total_value:       totalValue,
    items_in_stock:    itemsInStock,
    low_stock_count:   lowStock,
    pending_tasks:     pendingTasks ?? 0,
    purchases_7d_cost: purchases7Cost,
    consumed_7d_cost:  consumed7Cost,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Despensa</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestión de stock, compras y pre-producción
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/app/despensa/compras/nueva`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Nueva compra
          </Link>
          <Link
            href={`/${locale}/app/despensa/tareas/nueva`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Nueva tarea
          </Link>
        </div>
      </div>

      {/* KPI bar */}
      <StockSummaryBar summary={summary} locale={locale} />

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { href: `/${locale}/app/despensa`,         label: 'Stock' },
          { href: `/${locale}/app/despensa/compras`,  label: 'Compras' },
          { href: `/${locale}/app/despensa/tareas`,   label: 'Pre-producción' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-green-500 -mb-px"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      <StockList items={items} locale={locale} />
    </div>
  )
}
