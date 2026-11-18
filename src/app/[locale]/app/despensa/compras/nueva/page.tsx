import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import NuevaCompraForm from '@/components/stock/NuevaCompraForm'
import type { StockItemWithIngredient } from '@/types/stock'
import type { Supplier } from '@/types/stock'

export default async function NuevaCompraPage() {
  const supabase = await createServerSupabaseClient()
  const locale   = await getLocale()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [{ data: stockItems }, { data: suppliers }] = await Promise.all([
    supabase
      .from('stock_items')
      .select('*, ingredient:ingredients(id,name_en,category)')
      .eq('user_id', user.id)
      .in('kind', ['ingredient'])   // compras sólo para ingredientes
      .order('name'),
    supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <NuevaCompraForm
        stockItems={(stockItems ?? []) as StockItemWithIngredient[]}
        suppliers={(suppliers ?? []) as Supplier[]}
        locale={locale}
      />
    </div>
  )
}
