'use client'

import { useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { MEAL_TYPES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { useLogMeal, useUpdateMealLog } from '@/hooks/useMealLog'
import { useRecipe, useUserRecipes } from '@/hooks/useRecipes'
import { getAllIngredients } from '@/lib/api/ingredients'
import { useUserIngredients } from '@/hooks/useUserIngredients'
import type { MealLog, MealType, OverrideInput, UserIngredient } from '@/types/domain'

const RECIPE_CATEGORIES = ['salads_dips', 'main_dishes', 'breads_tortillas', 'desserts', 'smoothies'] as const
const INGREDIENT_CATEGORIES = ['fruits', 'vegetables', 'grains', 'legumes', 'proteins', 'seeds', 'other'] as const


const MEAL_TYPE_VALUES = MEAL_TYPES.map((meal) => meal.value) as [MealType, ...MealType[]]

const recipeSchema = z.object({
  recipe_id: z.string().uuid(),
  servings: z.coerce.number().positive().default(1),
  meal_type: z.enum(MEAL_TYPE_VALUES),
  notes: z.string().optional(),
})

const ingredientSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity_g: z.coerce.number().positive(),
  meal_type: z.enum(MEAL_TYPE_VALUES),
  notes: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MealLogForm({
  date,
  onSuccess,
  initialEntry,
}: {
  date: string
  onSuccess?: () => void
  initialEntry?: MealLog
}) {
  const t = useTranslations('meallog')
  const ti = useTranslations('ingredient')
  const tr = useTranslations('recipe')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()
  const logMeal = useLogMeal()
  const updateMeal = useUpdateMealLog()
  const isEditing = !!initialEntry

  // ── Base data ─────────────────────────────────────────────────────────────
  const { data: recipes } = useUserRecipes(user?.id ?? '')
  const { data: userIngredients } = useUserIngredients()

  const { data: ingredients } = useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })

  // ── Form state (pre-populated from initialEntry when editing) ─────────────
  const initMode = initialEntry?.recipe_id ? 'recipe' : 'ingredient'
  const initOverrides: Record<string, { quantity: string; excluded: boolean }> =
    Object.fromEntries(
      (initialEntry?.overrides ?? []).map((o) => [
        o.ingredient_id,
        { quantity: o.quantity_g != null ? String(o.quantity_g) : '', excluded: !!o.excluded },
      ])
    )

  const [mode, setMode] = useState<'recipe' | 'ingredient'>(initMode)
  const [recipeId, setRecipeId] = useState(initialEntry?.recipe_id ?? '')
  const [servings, setServings] = useState(String(initialEntry?.servings ?? 1))
  // Batch mode: total units made in this batch and units eaten
  const [servingMode, setServingMode] = useState<'direct' | 'batch'>('direct')
  const [batchTotal, setBatchTotal] = useState('12')
  const [batchEaten, setBatchEaten] = useState('1')
  const [ingredientId, setIngredientId] = useState(initialEntry?.user_ingredient_id ?? initialEntry?.ingredient_id ?? '')
  const [quantityG, setQuantityG] = useState(String(initialEntry?.quantity_g ?? 100))
  const [mealType, setMealType] = useState<string>(initialEntry?.meal_type ?? 'breakfast')
  const [notes, setNotes] = useState(initialEntry?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  // ── Override state (recipe mode only) ────────────────────────────────────
  // Maps ingredient_id → { quantity: string (input value), excluded: boolean }
  const [overrides, setOverrides] = useState<
    Record<string, { quantity: string; excluded: boolean }>
  >(initOverrides)
  // Extra ingredients added on top of the recipe
  const [extras, setExtras] = useState<{ ingredient_id: string; quantity: string }[]>([])
  const [extraIngredientId, setExtraIngredientId] = useState('')
  const [extraQuantityG, setExtraQuantityG] = useState('100')

  // ── Recipe ingredients (loaded when a recipe is selected) ─────────────────
  const { data: recipeData } = useRecipe(recipeId, locale)
  const recipeItems = recipeData?.items ?? []
  const recipeServings = recipeData?.recipe.servings ?? 1

  // Reset overrides when the recipe changes
  function handleRecipeChange(id: string) {
    setRecipeId(id)
    setOverrides({})
    setExtras([])
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Effective servings depending on mode
  const effectiveServings = servingMode === 'batch'
    ? (parseFloat(batchEaten) || 1) / (parseFloat(batchTotal) || 1) * recipeServings
    : parseFloat(servings) || 1

  // Scaled default quantity for a recipe ingredient given the current servings
  function defaultQty(baseQty: number): number {
    return Math.round((baseQty * effectiveServings / recipeServings) * 100) / 100
  }

  function getOverrideQty(ingredientId: string, baseQty: number): string {
    return overrides[ingredientId]?.quantity ?? String(defaultQty(baseQty))
  }

  function isExcluded(ingredientId: string): boolean {
    return overrides[ingredientId]?.excluded ?? false
  }

  function setQty(ingredientId: string, value: string) {
    setOverrides((prev) => ({
      ...prev,
      [ingredientId]: { quantity: value, excluded: false },
    }))
  }

  function toggleExclude(ingredientId: string, baseQty: number) {
    setOverrides((prev) => {
      const current = prev[ingredientId]
      if (current?.excluded) {
        // Re-enable: restore default quantity
        return { ...prev, [ingredientId]: { quantity: String(defaultQty(baseQty)), excluded: false } }
      }
      return { ...prev, [ingredientId]: { quantity: '', excluded: true } }
    })
  }

  function addExtra() {
    if (!extraIngredientId || parseFloat(extraQuantityG) <= 0) return
    setExtras((prev) => [...prev, { ingredient_id: extraIngredientId, quantity: extraQuantityG }])
    setExtraIngredientId('')
    setExtraQuantityG('100')
  }

  function removeExtra(idx: number) {
    setExtras((prev) => prev.filter((_, i) => i !== idx)
    )
  }

  // ── Build the final overrides array for submission ────────────────────────
  function buildOverrides(): OverrideInput[] {
    const result: OverrideInput[] = []

    for (const ri of recipeItems) {
      const state = overrides[ri.ingredient_id]
      if (!state) continue // unchanged → not sent

      if (state.excluded) {
        result.push({ ingredient_id: ri.ingredient_id, quantity_g: null, excluded: true })
        continue
      }

      const qty = parseFloat(state.quantity)
      const def = defaultQty(ri.quantity_g)
      if (Math.abs(qty - def) < 0.01) continue // unchanged → not sent

      result.push({ ingredient_id: ri.ingredient_id, quantity_g: qty, excluded: false })
    }

    for (const extra of extras) {
      const qty = parseFloat(extra.quantity)
      if (qty > 0) {
        result.push({ ingredient_id: extra.ingredient_id, quantity_g: qty, excluded: false })
      }
    }

    return result
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    if (mode === 'recipe') {
      const parsed = recipeSchema.safeParse({ recipe_id: recipeId, servings: String(effectiveServings), meal_type: mealType, notes: notes || undefined })
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Invalid form'); return }
      setError(null)
      const payload = {
        user_id: user.id,
        logged_at: date,
        meal_type: parsed.data.meal_type,
        recipe_id: parsed.data.recipe_id,
        ingredient_id: null,
        user_ingredient_id: null,
        servings: parsed.data.servings,
        quantity_g: null,
        notes: parsed.data.notes ?? null,
        overrides: buildOverrides(),
      }
      if (isEditing && initialEntry) {
        updateMeal.mutate({ id: initialEntry.id, payload }, { onSuccess: () => onSuccess?.() })
      } else {
        logMeal.mutate(payload, { onSuccess: () => onSuccess?.() })
      }
    } else {
      const parsed = ingredientSchema.safeParse({ ingredient_id: ingredientId, quantity_g: quantityG, meal_type: mealType, notes: notes || undefined })
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Invalid form'); return }
      setError(null)
      const isUserIngredient = (userIngredients ?? []).some((ui: UserIngredient) => ui.id === parsed.data.ingredient_id)
      const payload = {
        user_id: user.id,
        logged_at: date,
        meal_type: parsed.data.meal_type,
        recipe_id: null,
        ingredient_id:      isUserIngredient ? null : parsed.data.ingredient_id,
        user_ingredient_id: isUserIngredient ? parsed.data.ingredient_id : null,
        servings: null,
        quantity_g: parsed.data.quantity_g,
        notes: parsed.data.notes ?? null,
      }
      if (isEditing && initialEntry) {
        updateMeal.mutate({ id: initialEntry.id, payload }, { onSuccess: () => onSuccess?.() })
      } else {
        logMeal.mutate(payload, { onSuccess: () => onSuccess?.() })
      }
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'
  const smallInputClass =
    'w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-400'

  // Ingredients available to add as extras (excluding already-in-recipe + already added)
  const usedIds = new Set([
    ...recipeItems.map((ri) => ri.ingredient_id),
    ...extras.map((e) => e.ingredient_id),
  ])
  const availableForExtra = (ingredients ?? []).filter((ing) => !usedIds.has(ing.id))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Mode tabs */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('recipe')}
          className={`rounded-md px-3 py-1 text-sm font-medium ${mode === 'recipe' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
          {t('logRecipe')}
        </button>
        <button type="button" onClick={() => setMode('ingredient')}
          className={`rounded-md px-3 py-1 text-sm font-medium ${mode === 'ingredient' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
          {t('logIngredient')}
        </button>
      </div>

      {mode === 'recipe' ? (
        <>
          {/* Recipe selector */}
          <div>
            <label htmlFor="recipe_id" className={labelClass}>{t('logRecipe')}</label>
            <select id="recipe_id" value={recipeId}
              onChange={(e) => handleRecipeChange(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {RECIPE_CATEGORIES.map((cat) => {
                const group = (recipes ?? []).filter((r) => r.category === cat)
                if (group.length === 0) return null
                return (
                  <optgroup key={cat} label={tr(`category.${cat}`)}>
                    {group.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>

          {/* Serving mode toggle */}
          <div className="flex gap-2 items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modo:</span>
            <button type="button" onClick={() => setServingMode('direct')}
              className={`rounded px-2 py-1 text-xs font-medium ${servingMode === 'direct' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {t('servings')}
            </button>
            <button type="button" onClick={() => setServingMode('batch')}
              className={`rounded px-2 py-1 text-xs font-medium ${servingMode === 'batch' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Batch
            </button>
          </div>

          {servingMode === 'direct' ? (
            <div>
              <label htmlFor="servings" className={labelClass}>{t('servings')}</label>
              <input id="servings" type="number" step="0.01" min="0.01" value={servings}
                onChange={(e) => setServings(e.target.value)} className={inputClass} />
            </div>
          ) : (
            <div className="rounded-md border border-primary-200 bg-primary-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-primary-700">
                Esta vez hice <span className="font-bold">{batchTotal}</span> unidades
                {parseFloat(batchTotal) > 0 && parseFloat(batchEaten) > 0 && (
                  <span className="ml-2 text-primary-500">
                    → comí {((parseFloat(batchEaten) / parseFloat(batchTotal)) * 100).toFixed(1)}% del batch
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Total porciones del batch</label>
                  <input type="number" step="1" min="1" value={batchTotal}
                    onChange={(e) => setBatchTotal(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Porciones que comí</label>
                  <input type="number" step="0.5" min="0.5" value={batchEaten}
                    onChange={(e) => setBatchEaten(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Ingredient overrides panel */}
          {recipeItems.length > 0 && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('recipeIngredients')}
              </p>

              {recipeItems.map((ri) => {
                const excluded = isExcluded(ri.ingredient_id)
                return (
                  <div key={ri.ingredient_id} className="flex items-center gap-2">
                    {/* Exclude toggle */}
                    <input
                      type="checkbox"
                      checked={excluded}
                      onChange={() => toggleExclude(ri.ingredient_id, ri.quantity_g)}
                      title={t('excludeIngredient')}
                      className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                    />
                    {/* Name */}
                    <span className={`flex-1 text-sm ${excluded ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {ri.ingredient?.name ?? ri.ingredient_id}
                    </span>
                    {/* Quantity input */}
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      disabled={excluded}
                      value={excluded ? '' : getOverrideQty(ri.ingredient_id, ri.quantity_g)}
                      onChange={(e) => setQty(ri.ingredient_id, e.target.value)}
                      className={smallInputClass}
                    />
                    <span className="text-xs text-gray-400">g</span>
                  </div>
                )
              })}

              {/* Extra ingredients */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('extraIngredients')}
                </p>

                {extras.map((extra, idx) => {
                  const ing = (ingredients ?? []).find((i) => i.id === extra.ingredient_id)
                  return (
                    <div key={extra.ingredient_id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-gray-700">{ing?.name ?? extra.ingredient_id}</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={extra.quantity}
                        onChange={(e) => setExtras((prev) =>
                          prev.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x)
                        )}
                        className={smallInputClass}
                      />
                      <span className="text-xs text-gray-400">g</span>
                      <button type="button" onClick={() => removeExtra(idx)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold">×</button>
                    </div>
                  )
                })}

                {/* Add extra row */}
                <div className="flex items-center gap-2">
                  <select value={extraIngredientId}
                    onChange={(e) => setExtraIngredientId(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="">— {t('selectIngredient')} —</option>
                    {INGREDIENT_CATEGORIES.map((cat) => {
                      const group = availableForExtra.filter((i) => i.category === cat)
                      if (group.length === 0) return null
                      return (
                        <optgroup key={cat} label={ti(`category.${cat}`)}>
                          {group.map((ing) => (
                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                  <input type="number" step="0.1" min="0.1" value={extraQuantityG}
                    onChange={(e) => setExtraQuantityG(e.target.value)}
                    className={smallInputClass} />
                  <span className="text-xs text-gray-400">g</span>
                  <button type="button" onClick={addExtra}
                    disabled={!extraIngredientId}
                    className="rounded-md bg-gray-200 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-40">
                    {t('addExtra')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label htmlFor="ingredient_id" className={labelClass}>{t('logIngredient')}</label>
            <select id="ingredient_id" value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {INGREDIENT_CATEGORIES.map((cat) => {
                const group = (ingredients ?? []).filter((i) => i.category === cat)
                if (group.length === 0) return null
                return (
                  <optgroup key={cat} label={ti(`category.${cat}`)}>
                    {group.map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                )
              })}
              {(userIngredients ?? []).length > 0 && (
                <optgroup label="— Mis productos —">
                  {(userIngredients ?? []).map((ui: UserIngredient) => (
                    <option key={ui.id} value={ui.id}>
                      {(locale === 'es' ? ui.name_es ?? ui.name_en : ui.name_en)}{ui.brand ? ` (${ui.brand})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="quantity_g" className={labelClass}>{t('quantityG')}</label>
            <input id="quantity_g" type="number" step="0.01" min="0" value={quantityG}
              onChange={(e) => setQuantityG(e.target.value)} className={inputClass} />
          </div>
        </>
      )}

      {/* Meal type */}
      <div>
        <label htmlFor="meal_type" className={labelClass}>{t('mealType')}</label>
        <select id="meal_type" value={mealType}
          onChange={(e) => setMealType(e.target.value)} className={inputClass}>
          {MEAL_TYPES.map((meal) => (
            <option key={meal.value} value={meal.value}>{t(meal.value)}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className={labelClass}>{t('notes')}</label>
        <input id="notes" type="text" value={notes}
          onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {logMeal.error && <p className="text-sm text-red-600">{logMeal.error.message}</p>}
      {updateMeal.error && <p className="text-sm text-red-600">{updateMeal.error.message}</p>}

      <button type="submit" disabled={logMeal.isPending || updateMeal.isPending}
        className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60">
        {isEditing ? t('saveChanges') : (mode === 'recipe' ? t('logRecipe') : t('logIngredient'))}
      </button>
    </form>
  )
}
