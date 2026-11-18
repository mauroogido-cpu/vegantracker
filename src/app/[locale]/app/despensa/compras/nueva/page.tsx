import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import NuevaCompraForm from '@/components/stock/NuevaCompraForm'
import type {
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

export default async function NuevaCompraPage() {
  const supabase = await createClient()
  const locale   = await getLocale()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [{ data: stockItems }, { data: suppliers }, { data: catalog }] = await Promise.all([
    supabase
      .from('stock_items')
      .select('*, ingredient:ingredients(id,name_en,category)')
      .eq('user_id', user.id)
      .eq('kind', 'ingredient')     // compras sólo para ingredientes
      .order('name'),
    supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    // Catálogo público de ingredientes: permite comprar algo que todavía
    // no tiene stock_item (se crea automáticamente al registrar la compra).
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
      <NuevaCompraForm
        stockItems={items}
        ingredients={ingredients}
        suppliers={(suppliers ?? []) as Supplier[]}
        locale={locale}
      />
    </div>
  )
}
