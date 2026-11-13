import { createClient } from '@/lib/supabase/client'
import type { DayHistorySummary, MealLog, MealLogOverride, OverrideInput } from '@/types/domain'
export type { OverrideInput }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------


export type LogMealPayload = Omit<MealLog, 'id' | 'created_at' | 'overrides'> & {
  overrides?: OverrideInput[]
}

// ---------------------------------------------------------------------------
// getDayLog
// Fetches all log entries for a user on a given date, including overrides.
// ---------------------------------------------------------------------------
export async function getDayLog(userId: string, date: string): Promise<MealLog[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('meal_log')
    .select('*, meal_log_ingredient_overrides(*)')
    .eq('user_id', userId)
    .eq('logged_at', date)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getDayLog failed:', error.message)
    return []
  }

  return ((data ?? []) as unknown as (MealLog & { meal_log_ingredient_overrides: MealLogOverride[] })[]).map(
    ({ meal_log_ingredient_overrides, ...log }) => ({
      ...log,
      overrides: meal_log_ingredient_overrides ?? [],
    })
  )
}

// ---------------------------------------------------------------------------
// logMeal
// Inserts a meal_log entry and its overrides in a single DB transaction
// via the log_meal_with_overrides RPC.
// ---------------------------------------------------------------------------
export async function logMeal(payload: LogMealPayload): Promise<MealLog | null> {
  const supabase = createClient()

  const { overrides = [], ...entry } = payload

  const { data, error } = await supabase.rpc('log_meal_with_overrides', {
    entry: {
      user_id:       entry.user_id,
      logged_at:     entry.logged_at,
      meal_type:     entry.meal_type,
      recipe_id:          entry.recipe_id          ?? null,
      ingredient_id:      entry.ingredient_id      ?? null,
      user_ingredient_id: entry.user_ingredient_id ?? null,
      servings:           entry.servings           ?? null,
      quantity_g:    entry.quantity_g    ?? null,
      notes:         entry.notes         ?? null,
    },
    overrides: overrides.map((o) => ({
      ingredient_id: o.ingredient_id,
      quantity_g:    o.excluded ? null : o.quantity_g,
      excluded:      o.excluded,
    })),
  })

  if (error) {
    console.error('logMeal failed:', error.message)
    return null
  }

  return data as MealLog
}

// ---------------------------------------------------------------------------
// deleteMealLog
// Overrides are deleted automatically via ON DELETE CASCADE.
// ---------------------------------------------------------------------------
export async function deleteMealLog(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('meal_log').delete().eq('id', id)

  if (error) {
    console.error('deleteMealLog failed:', error.message)
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// getMealLogHistory
// Returns one row per logged date with aggregated nutrition totals.
// Uses the get_meal_log_history RPC (007_rpc_history.sql).
// ---------------------------------------------------------------------------

export async function getMealLogHistory(
  userId: string,
  fromDate?: string,   // YYYY-MM-DD, default: 30 days ago
  toDate?: string      // YYYY-MM-DD, default: today
): Promise<DayHistorySummary[]> {
  const supabase = createClient()

  const params: Record<string, string> = { p_user_id: userId }
  if (fromDate) params.p_from = fromDate
  if (toDate)   params.p_to   = toDate

  const { data, error } = await supabase.rpc('get_meal_log_history', params)

  if (error) {
    console.error('getMealLogHistory failed:', error.message)
    return []
  }

  return (data ?? []) as DayHistorySummary[]
}

// ---------------------------------------------------------------------------
// getDayLogDetail
// Fetches meal_log entries for a date with full ingredient/recipe nutrition
// data, used by the expandable history rows.
// ---------------------------------------------------------------------------
import type { MealLogDetail, RecipeIngredientDetail } from '@/types/domain'

// Resolve ingredient display name from translations, falling back to name_en
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveIngredientName(row: any, locale: string): string {
  const translations: { locale: string; name: string }[] = row.ingredient_translations ?? []
  return translations.find((t) => t.locale === locale)?.name ?? row.name_en ?? '—'
}

export async function getDayLogDetail(userId: string, date: string, locale: string): Promise<MealLogDetail[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('meal_log')
    .select(`
      id, user_id, logged_at, meal_type, recipe_id, ingredient_id, user_ingredient_id, servings, quantity_g, notes, created_at,
      ingredient:ingredient_id (
        id, name_en, cal, protein_g, carbs_g, fat_g, fiber_g,
        iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
        ingredient_translations ( locale, name )
      ),
      recipe:recipe_id (
        id, name, servings,
        recipe_ingredients (
          id, quantity_g, sort_order,
          ingredient:ingredient_id (
            id, name_en, cal, protein_g, carbs_g, fat_g, fiber_g,
            iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
            ingredient_translations ( locale, name )
          )
        )
      ),
      user_ingredient:user_ingredient_id ( id, name_en, name_es, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, zinc_mg, vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g, saturated_fat_g, sugar_g, sodium_mg ),
      meal_log_ingredient_overrides ( id, meal_log_id, ingredient_id, quantity_g, excluded )
    `)
    .eq('user_id', userId)
    .eq('logged_at', date)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getDayLogDetail failed:', error.message)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as unknown as any[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    logged_at: row.logged_at,
    meal_type: row.meal_type,
    recipe_id: row.recipe_id,
    ingredient_id: row.ingredient_id,
    user_ingredient_id: row.user_ingredient_id,
    servings: row.servings,
    quantity_g: row.quantity_g,
    notes: row.notes,
    created_at: row.created_at,
    ingredient: row.ingredient
      ? { ...row.ingredient, name_en: resolveIngredientName(row.ingredient, locale) }
      : null,
    recipe: row.recipe
      ? {
          ...row.recipe,
          recipe_ingredients: ((row.recipe.recipe_ingredients ?? []) as RecipeIngredientDetail[])
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((ri: any) => ({
              ...ri,
              ingredient: { ...ri.ingredient, name_en: resolveIngredientName(ri.ingredient, locale) },
            })),
        }
      : null,
    user_ingredient: row.user_ingredient ?? null,
    overrides: row.meal_log_ingredient_overrides ?? [],
  }))
}

// ---------------------------------------------------------------------------
// updateMealLog
// Delete the existing entry (overrides cascade) and re-insert with new data.
// ---------------------------------------------------------------------------
export async function updateMealLog(
  id: string,
  payload: LogMealPayload
): Promise<MealLog | null> {
  const deleted = await deleteMealLog(id)
  if (!deleted) return null
  return logMeal(payload)
}
