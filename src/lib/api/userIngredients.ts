import { createClient } from '@/lib/supabase/client'
import type { UserIngredient, UserIngredientInput } from '@/types/domain'
import { normalizeSearch } from '@/lib/normalize'

// All columns from user_ingredients (no joins needed — no translations table)
const SELECT_COLUMNS = `
  id, user_id,
  name_en, name_es, brand, barcode, category,
  cal, protein_g, carbs_g, fat_g, fiber_g, saturated_fat_g, sugar_g, sodium_mg,
  iron_mg, calcium_mg, zinc_mg,
  vit_b12_mcg, vit_d_mcg, vit_c_mg, omega3_g,
  status, submitted_at, source_ingredient_id,
  created_at, updated_at
`

/** Fetch all user ingredients for the authenticated user */
export async function getUserIngredients(): Promise<UserIngredient[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_ingredients')
    .select(SELECT_COLUMNS)
    .order('name_en', { ascending: true })

  if (error) {
    console.error('getUserIngredients failed:', error.message)
    return []
  }

  return (data ?? []) as UserIngredient[]
}

/**
 * Search user ingredients by name — accent-insensitive.
 * Normalizes the query client-side and matches against pre-computed
 * name_en_normalized / name_es_normalized columns (012_unaccent_search.sql).
 */
export async function searchUserIngredients(query: string): Promise<UserIngredient[]> {
  const supabase = createClient()
  const normalized = normalizeSearch(query)

  const { data, error } = await supabase
    .from('user_ingredients')
    .select(SELECT_COLUMNS)
    .or(
      `name_en_normalized.ilike.%${normalized}%,` +
      `name_es_normalized.ilike.%${normalized}%`
    )
    .order('name_en', { ascending: true })
    .limit(20)

  if (error) {
    console.error('searchUserIngredients failed:', error.message)
    return []
  }

  return (data ?? []) as UserIngredient[]
}

/** Fetch a single user ingredient by id */
export async function getUserIngredientById(id: string): Promise<UserIngredient | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_ingredients')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getUserIngredientById failed:', error.message)
    return null
  }

  return (data as UserIngredient) ?? null
}

/** Create a new user ingredient */
export async function createUserIngredient(
  input: UserIngredientInput
): Promise<UserIngredient | null> {
  const supabase = createClient()

  // user_id is omitted from UserIngredientInput (it belongs to auth, not form data),
  // so we resolve it from the session and inject it before the INSERT.
  // The RLS policy WITH CHECK (user_id = auth.uid()) requires this field to match.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('createUserIngredient: no authenticated user')
    return null
  }

  const { data, error } = await supabase
    .from('user_ingredients')
    .insert({ ...input, user_id: user.id })
    .select(SELECT_COLUMNS)
    .single()

  if (error) {
    console.error('createUserIngredient failed:', error.message)
    return null
  }

  return data as UserIngredient
}

/** Update an existing user ingredient (must own it — RLS enforced) */
export async function updateUserIngredient(
  id: string,
  input: Partial<UserIngredientInput>
): Promise<UserIngredient | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_ingredients')
    .update(input)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single()

  if (error) {
    console.error('updateUserIngredient failed:', error.message)
    return null
  }

  return data as UserIngredient
}

/** Delete a user ingredient */
export async function deleteUserIngredient(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_ingredients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteUserIngredient failed:', error.message)
    return false
  }

  return true
}

/**
 * Submit a user ingredient for promotion to the public catalog.
 * Sets status = 'pending_review' and records submitted_at.
 */
export async function submitForReview(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_ingredients')
    .update({ status: 'pending_review', submitted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'private')   // only allow from private state

  if (error) {
    console.error('submitForReview failed:', error.message)
    return false
  }

  return true
}
