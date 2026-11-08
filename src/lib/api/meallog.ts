import { createClient } from '@/lib/supabase/client'
import type { MealLog } from '@/types/domain'

export async function getDayLog(userId: string, date: string): Promise<MealLog[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('meal_log')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_at', date)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getDayLog failed:', error.message)
    return []
  }

  return (data ?? []) as MealLog[]
}

export async function logMeal(entry: Omit<MealLog, 'id' | 'created_at'>): Promise<MealLog | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from('meal_log').insert(entry).select().single()

  if (error) {
    console.error('logMeal failed:', error.message)
    return null
  }

  return data as MealLog
}

export async function deleteMealLog(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('meal_log').delete().eq('id', id)

  if (error) {
    console.error('deleteMealLog failed:', error.message)
    return false
  }

  return true
}
