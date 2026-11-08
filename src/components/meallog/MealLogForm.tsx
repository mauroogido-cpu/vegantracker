'use client'

import { useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { MEAL_TYPES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { useLogMeal } from '@/hooks/useMealLog'
import { useUserRecipes } from '@/hooks/useRecipes'
import { getAllIngredients } from '@/lib/api/ingredients'
import type { MealType } from '@/types/domain'

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

export default function MealLogForm({
  date,
  onSuccess,
}: {
  date: string
  onSuccess?: () => void
}) {
  const t = useTranslations('meallog')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()
  const logMeal = useLogMeal()

  const { data: recipes } = useUserRecipes(user?.id ?? '')
  const { data: ingredients } = useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })

  const [mode, setMode] = useState<'recipe' | 'ingredient'>('recipe')
  const [recipeId, setRecipeId] = useState('')
  const [servings, setServings] = useState('1')
  const [ingredientId, setIngredientId] = useState('')
  const [quantityG, setQuantityG] = useState('100')
  const [mealType, setMealType] = useState<string>('breakfast')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    if (mode === 'recipe') {
      const parsed = recipeSchema.safeParse({
        recipe_id: recipeId,
        servings,
        meal_type: mealType,
        notes: notes || undefined,
      })
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid form')
        return
      }
      setError(null)
      logMeal.mutate(
        {
          user_id: user.id,
          logged_at: date,
          meal_type: parsed.data.meal_type,
          recipe_id: parsed.data.recipe_id,
          ingredient_id: null,
          servings: parsed.data.servings,
          quantity_g: null,
          notes: parsed.data.notes ?? null,
        },
        { onSuccess: () => onSuccess?.() }
      )
    } else {
      const parsed = ingredientSchema.safeParse({
        ingredient_id: ingredientId,
        quantity_g: quantityG,
        meal_type: mealType,
        notes: notes || undefined,
      })
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid form')
        return
      }
      setError(null)
      logMeal.mutate(
        {
          user_id: user.id,
          logged_at: date,
          meal_type: parsed.data.meal_type,
          recipe_id: null,
          ingredient_id: parsed.data.ingredient_id,
          servings: null,
          quantity_g: parsed.data.quantity_g,
          notes: parsed.data.notes ?? null,
        },
        { onSuccess: () => onSuccess?.() }
      )
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('recipe')}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            mode === 'recipe' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {t('logRecipe')}
        </button>
        <button
          type="button"
          onClick={() => setMode('ingredient')}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            mode === 'ingredient' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {t('logIngredient')}
        </button>
      </div>

      {mode === 'recipe' ? (
        <>
          <div>
            <label htmlFor="recipe_id" className={labelClass}>
              {t('logRecipe')}
            </label>
            <select
              id="recipe_id"
              value={recipeId}
              onChange={(event) => setRecipeId(event.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {(recipes ?? []).map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="servings" className={labelClass}>
              {t('servings')}
            </label>
            <input
              id="servings"
              type="number"
              step="0.01"
              min="0"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
              className={inputClass}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="ingredient_id" className={labelClass}>
              {t('logIngredient')}
            </label>
            <select
              id="ingredient_id"
              value={ingredientId}
              onChange={(event) => setIngredientId(event.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {(ingredients ?? []).map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity_g" className={labelClass}>
              {t('quantityG')}
            </label>
            <input
              id="quantity_g"
              type="number"
              step="0.01"
              min="0"
              value={quantityG}
              onChange={(event) => setQuantityG(event.target.value)}
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="meal_type" className={labelClass}>
          {t('mealType')}
        </label>
        <select
          id="meal_type"
          value={mealType}
          onChange={(event) => setMealType(event.target.value)}
          className={inputClass}
        >
          {MEAL_TYPES.map((meal) => (
            <option key={meal.value} value={meal.value}>
              {t(meal.value)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          {t('notes')}
        </label>
        <input
          id="notes"
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {logMeal.error && <p className="text-sm text-red-600">{logMeal.error.message}</p>}

      <button
        type="submit"
        disabled={logMeal.isPending}
        className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {mode === 'recipe' ? t('logRecipe') : t('logIngredient')}
      </button>
    </form>
  )
}
