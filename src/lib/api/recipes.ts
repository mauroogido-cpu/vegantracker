import { createClient } from '@/lib/supabase/client'
import type { Ingredient, Recipe, RecipeIngredient } from '@/types/domain'

export async function getUserRecipes(userId: string): Promise<Recipe[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('getUserRecipes failed:', error.message)
    return []
  }

  return (data ?? []) as Recipe[]
}

type RecipeIngredientRow = {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity_g: number
  notes: string | null
  sort_order: number
  ingredients:
    | (Omit<Ingredient, 'name'> & { ingredient_translations: { name: string }[] })
    | null
}

export async function getRecipeWithIngredients(
  recipeId: string,
  locale: string
): Promise<{ recipe: Recipe; items: RecipeIngredient[] } | null> {
  const supabase = createClient()

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single()

  if (recipeError || !recipe) {
    console.error('getRecipeWithIngredients (recipe) failed:', recipeError?.message)
    return null
  }

  const { data: rows, error: itemsError } = await supabase
    .from('recipe_ingredients')
    .select(`
      id, recipe_id, ingredient_id, quantity_g, notes, sort_order,
      ingredients (
        id, name_en, category, cal, protein_g, carbs_g, fat_g, fiber_g,
        iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
        ingredient_translations!inner ( name )
      )
    `)
    .eq('recipe_id', recipeId)
    .filter('ingredients.ingredient_translations.locale', 'eq', locale)
    .order('sort_order')

  if (itemsError) {
    console.error('getRecipeWithIngredients (items) failed:', itemsError.message)
    return null
  }

  const items: RecipeIngredient[] = ((rows ?? []) as unknown as RecipeIngredientRow[]).map((row) => {
    const joinedRaw = row.ingredients
    const joined = (Array.isArray(joinedRaw) ? joinedRaw[0] : joinedRaw) as
      | (Omit<Ingredient, 'name'> & { ingredient_translations: { name: string }[] })
      | null
    let ingredient: Ingredient | undefined
    if (joined) {
      const { ingredient_translations, ...ingredientFields } = joined
      ingredient = {
        ...ingredientFields,
        name: ingredient_translations[0]?.name ?? joined.name_en,
      }
    }
    return {
      id: row.id,
      recipe_id: row.recipe_id,
      ingredient_id: row.ingredient_id,
      quantity_g: row.quantity_g,
      notes: row.notes,
      sort_order: row.sort_order,
      ingredient,
    }
  })

  return { recipe: recipe as Recipe, items }
}

export async function createRecipe(
  data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>
): Promise<Recipe | null> {
  const supabase = createClient()

  const { data: created, error } = await supabase.from('recipes').insert(data).select().single()

  if (error) {
    console.error('createRecipe failed:', error.message)
    return null
  }

  return created as Recipe
}

export async function updateRecipe(
  id: string,
  data: Partial<Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Recipe | null> {
  const supabase = createClient()

  const { data: updated, error } = await supabase
    .from('recipes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateRecipe failed:', error.message)
    return null
  }

  return updated as Recipe
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) {
    console.error('deleteRecipe failed:', error.message)
    return false
  }

  return true
}

export async function addRecipeIngredient(
  item: Omit<RecipeIngredient, 'id' | 'ingredient'>
): Promise<RecipeIngredient | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from('recipe_ingredients').insert(item).select().single()

  if (error) {
    console.error('addRecipeIngredient failed:', error.message)
    return null
  }

  return data as RecipeIngredient
}

export async function updateRecipeIngredient(
  id: string,
  data: { quantity_g: number; notes: string | null }
): Promise<RecipeIngredient | null> {
  const supabase = createClient()

  const { data: updated, error } = await supabase
    .from('recipe_ingredients')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateRecipeIngredient failed:', error.message)
    return null
  }

  return updated as RecipeIngredient
}

export async function removeRecipeIngredient(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('recipe_ingredients').delete().eq('id', id)

  if (error) {
    console.error('removeRecipeIngredient failed:', error.message)
    return false
  }

  return true
}
