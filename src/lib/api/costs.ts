import { createClient } from '@/lib/supabase/client'
import type { IngredientCost } from '@/types/domain'

export async function getUserCosts(userId: string): Promise<IngredientCost[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ingredient_costs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getUserCosts failed:', error.message)
    return []
  }

  return (data ?? []) as IngredientCost[]
}

export async function upsertCost(
  cost: Omit<IngredientCost, 'id' | 'created_at' | 'price_per_100g'>
): Promise<IngredientCost | null> {
  const supabase = createClient()

  const row = {
    ...cost,
    price_per_100g: (cost.price / cost.quantity_g) * 100,
  }

  const { data, error } = await supabase
    .from('ingredient_costs')
    .upsert(row, { onConflict: 'user_id,ingredient_id' })
    .select()
    .single()

  if (error) {
    console.error('upsertCost failed:', error.message)
    return null
  }

  return data as IngredientCost
}

export async function deleteCost(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('ingredient_costs').delete().eq('id', id)

  if (error) {
    console.error('deleteCost failed:', error.message)
    return false
  }

  return true
}
