'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useCreateRecipe, useUpdateRecipe } from '@/hooks/useRecipes'
import type { Recipe } from '@/types/domain'

const RECIPE_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other'] as const

const recipeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  servings: z.coerce.number().int().positive().default(1),
  category: z.enum(RECIPE_CATEGORIES),
  is_public: z.boolean().default(false),
  prep_time_min: z.coerce.number().int().nonnegative().optional(),
  instructions: z.string().optional(),
})

export default function RecipeForm({
  existingRecipe,
  onSuccess,
}: {
  existingRecipe?: Recipe
  onSuccess?: (recipe: Recipe) => void
}) {
  const t = useTranslations('recipe')
  const { user } = useAuth()
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()

  const [name, setName] = useState(existingRecipe?.name ?? '')
  const [description, setDescription] = useState(existingRecipe?.description ?? '')
  const [servings, setServings] = useState(existingRecipe ? String(existingRecipe.servings) : '1')
  const [category, setCategory] = useState<string>(existingRecipe?.category ?? 'other')
  const [isPublic, setIsPublic] = useState(existingRecipe?.is_public ?? false)
  const [prepTime, setPrepTime] = useState(
    existingRecipe?.prep_time_min != null ? String(existingRecipe.prep_time_min) : ''
  )
  const [instructions, setInstructions] = useState(existingRecipe?.instructions ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const parsed = recipeSchema.safeParse({
      name,
      description: description || undefined,
      servings,
      category,
      is_public: isPublic,
      prep_time_min: prepTime === '' ? undefined : prepTime,
      instructions: instructions || undefined,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid form')
      return
    }
    setError(null)

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description ?? '',
      servings: parsed.data.servings,
      category: parsed.data.category,
      is_public: parsed.data.is_public,
      prep_time_min: parsed.data.prep_time_min ?? null,
      instructions: parsed.data.instructions ?? null,
    }

    if (existingRecipe) {
      updateRecipe.mutate(
        { id: existingRecipe.id, data: payload },
        { onSuccess: (result) => result && onSuccess?.(result) }
      )
    } else {
      createRecipe.mutate(
        { ...payload, user_id: user.id, source_recipe_id: null },
        { onSuccess: (result) => result && onSuccess?.(result) }
      )
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  const mutationError = createRecipe.error ?? updateRecipe.error
  const submitting = createRecipe.isPending || updateRecipe.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className={labelClass}>
          {t('name')}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          {t('description')}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="servings" className={labelClass}>
            {t('servings')}
          </label>
          <input
            id="servings"
            type="number"
            min="1"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            {t('categoryLabel')}
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          >
            {RECIPE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(`category.${value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="prep_time_min" className={labelClass}>
          {t('prepTime')}
        </label>
        <input
          id="prep_time_min"
          type="number"
          min="0"
          value={prepTime}
          onChange={(event) => setPrepTime(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_public"
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="is_public" className="text-sm text-gray-700">
          {t('isPublic')}
        </label>
      </div>

      <div>
        <label htmlFor="instructions" className={labelClass}>
          {t('instructions')}
        </label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={4}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {mutationError && <p className="text-sm text-red-600">{mutationError.message}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {t('save')}
      </button>
    </form>
  )
}
