import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import NuevaTareaForm from '@/components/stock/NuevaTareaForm'
import type { StockItem } from '@/types/stock'

export default async function NuevaTareaPage() {
  const supabase = await createClient()
  const locale   = await getLocale()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: stockItems } = await supabase
    .from('stock_items')
    .select('id, name, unit, kind')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <NuevaTareaForm
        stockItems={(stockItems ?? []) as StockItem[]}
      />
    </div>
  )
}
