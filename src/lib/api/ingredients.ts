import { createClient } from '@/lib/supabase/client'
import type { Ingredient } from '@/types/domain'

type IngredientRow = Omit<Ingredient, 'name'> & {
  ingredient_translations: { name: string }[]
}

const SELECT_COLUMNS = `
  id, name_en, category, fdc_id, created_at,
  cal, protein_g, carbs_g, fat_g, fiber_g,
  iron_mg, calcium_mg, zinc_mg,
  vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
  potassium_mg, sodium_mg, selenium_mcg,
  vit_a_rae_mcg, folate_mcg, magnesium_mg,
  vit_k_mcg, vit_e_mg, vit_b6_mg, choline_mg,
  ingredient_translations!inner ( name )
`

function mapIngredient(row: IngredientRow): Ingredient {
  const name = (row.ingredient_translations as { name: string }[])[0]?.name ?? row.name_en
  return { ...row, name }
}

export async function searchIngredients(query: string, locale: string): Promise<Ingredient[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ingredients')
    .select(SELECT_COLUMNS)
    .filter('ingredient_translations.locale', 'eq', locale)
    .ilike('ingredient_translations.name', `%${query}%`)
    .order('name', { referencedTable: 'ingredient_translations', ascending: true })
    .limit(20)

  if (error) {
    console.error('searchIngredients failed:', error.message)
    return []
  }

  const rows = (data ?? []) as IngredientRow[]
  return rows.map(mapIngredient)
}

export async function getAllIngredients(locale: string): Promise<Ingredient[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ingredients')
    .select(SELECT_COLUMNS)
    .filter('ingredient_translations.locale', 'eq', locale)
    .order('name', { referencedTable: 'ingredient_translations', ascending: true })
    .limit(200)

  if (error) {
    console.error('getAllIngredients failed:', error.message)
    return []
  }

  const rows = (data ?? []) as IngredientRow[]
  return rows.map(mapIngredient)
}

export async function getIngredientById(id: string, locale: string): Promise<Ingredient | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ingredients')
    .select(SELECT_COLUMNS)
    .filter('ingredient_translations.locale', 'eq', locale)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getIngredientById failed:', error.message)
    return null
  }
  if (!data) return null

  return mapIngredient(data as IngredientRow)
}
