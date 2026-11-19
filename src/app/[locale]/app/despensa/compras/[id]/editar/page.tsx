import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import EditarCompraForm from '@/components/stock/EditarCompraForm'
import type {
  PurchaseWithItems,
  PurchaseIngredientOption,
  StockItemWithIngredient,
  Supplier,
} from '@/types/stock'

type CatalogRow = {
  name: string
  ingredients:
    | { id: string; name_en: string; category: string | null }
    | { id: string; name_en: string; category: string | null }[]
}

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export default async function EditarCompraPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const locale   = await getLocale()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // Cargar la compra con sus ítems
  const { data: purchase, error: purchaseErr } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers ( id, name, location, visit_days, notes, created_at, updated_at, user_id ),
      items:purchase_items (
        id, quantity_gross, yield_pct_snap, quantity_net, price_paid, store_notes,
        stock_item:stock_items ( id, name, unit, kind, ingredient_id, yield_pct )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (purchaseErr || !purchase) notFound()

  // Cargar catálogos igual que en nueva compra
  const [{ data: stockItems }, { data: suppliers }, { data: catalog }] = await Promise.all([
    supabase
      .from('stock_items')
      .select('*, ingredient:ingredients(id,name_en,category)')
      .eq('user_id', user.id)
      .eq('kind', 'ingredient')
      .order('name'),
    supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('ingredient_translations')
      .select('name, ingredients!inner(id,name_en,category)')
      .eq('locale', locale)
      .order('name')
      .limit(500),
  ])

  const items = (stockItems ?? []) as StockItemWithIngredient[]
  const alreadyInStock = new Set(
    items.map((item) => item.ingredient_id).filter((id): id is string => !!id)
  )

  const ingredients: PurchaseIngredientOption[] = ((catalog ?? []) as unknown as CatalogRow[])
    .flatMap((row) => {
      const ingredient = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients
      if (!ingredient || alreadyInStock.has(ingredient.id)) return []
      return [{
        id:       ingredient.id,
        name:     row.name || ingredient.name_en,
        category: ingredient.category,
      }]
    })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <EditarCompraForm
        purchase={purchase as unknown as PurchaseWithItems}
        stockItems={items}
        ingredients={ingredients}
        suppliers={(suppliers ?? []) as Supplier[]}
        locale={locale}
      />
    </div>
  )
}
