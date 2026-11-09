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
      recipe_id:     entry.recipe_id     ?? null,
      ingredient_id: entry.ingredient_id ?? null,
      servings:      entry.servings      ?? null,
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
