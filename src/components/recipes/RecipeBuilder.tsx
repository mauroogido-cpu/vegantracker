'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import IngredientSearch from '@/components/ingredients/IngredientSearch'
import NutritionCard from '@/components/ingredients/NutritionCard'
import { useAuth } from '@/hooks/useAuth'
import { useUserCosts } from '@/hooks/useCosts'
import {
  useAddRecipeIngredient,
  useRecipe,
  useRemoveRecipeIngredient,
  useUpdateRecipeIngredient,
} from '@/hooks/useRecipes'
import {
  calcRecipeCost,
  calcRecipeNutrition,
  NUTRITION_KEYS,
  type NutritionKey,
} from '@/lib/nutrition'
import type { Ingredient, RecipeIngredient } from '@/types/domain'

export default function RecipeBuilder({ recipeId }: { recipeId: string }) {
  const t = useTranslations('recipe')
  const tc = useTranslations('common')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()

  const { data, isLoading } = useRecipe(recipeId, locale)
  const { data: costs } = useUserCosts(user?.id ?? '')
  const addIngredient = useAddRecipeIngredient()
  const removeIngredient = useRemoveRecipeIngredient()
  const updateIngredient = useUpdateRecipeIngredient()

  const [pickedIngredient, setPickedIngredient] = useState<Ingredient | null>(null)
  const [grams, setGrams] = useState('100')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editGrams, setEditGrams] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const items: RecipeIngredient[] = data?.items ?? []

  const costMap = useMemo(
    () => new Map((costs ?? []).map((cost) => [cost.ingredient_id, cost.price_per_100g] as const)),
    [costs]
  )

  const nutrition = useMemo(() => calcRecipeNutrition(items), [items])
  const servings = data?.recipe?.servings ?? 1
  const perServing = Object.fromEntries(
    NUTRITION_KEYS.map((key) => [key, nutrition[key] / servings])
  ) as Record<NutritionKey, number>
  const estimatedCost = useMemo(() => calcRecipeCost(items, costMap), [items, costMap])
  const currency = costs?.[0]?.currency ?? 'USD'

  const totalsAsIngredient = {
    id: 'totals',
    name: t('totalNutrition'),
    name_en: 'Total',
    category: '',
    fdc_id: null,
    created_at: '',
    ...nutrition,
  } as Ingredient

  const perServingAsIngredient = {
    id: 'per-serving',
    name: t('perServingNutrition'),
    name_en: 'Per serving',
    category: '',
    fdc_id: null,
    created_at: '',
    ...perServing,
  } as Ingredient

  function handleAdd() {
    if (!pickedIngredient) return
    addIngredient.mutate(
      {
        recipe_id: recipeId,
        ingredient_id: pickedIngredient.id,
        quantity_g: Number(grams),
        notes: notes || null,
        sort_order: items.length,
      },
      {
        onSuccess: () => {
          setPickedIngredient(null)
          setGrams('100')
          setNotes('')
        },
      }
    )
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {data?.recipe && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{data.recipe.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {servings} {t('servings')}
          </p>
        </div>
      )}

      {/* Section A — Add ingredient */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('addIngredient')}
        </h3>
        <IngredientSearch onSelect={setPickedIngredient} />

        {pickedIngredient && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">{pickedIngredient.name}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="grams" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('grams')}
                </label>
                <input
                  id="grams"
                  type="number"
                  min="1"
                  value={grams}
                  onChange={(event) => setGrams(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
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
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={addIngredient.isPending}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {t('addIngredient')}
            </button>
            {addIngredient.error && (
              <p className="text-sm text-red-600">{addIngredient.error.message}</p>
            )}
          </div>
        )}
      </section>

      {/* Section B — Ingredient list */}
      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">{t('ingredient')}</th>
              <th className="px-4 py-3">{t('grams')}</th>
              <th className="px-4 py-3">{t('notes')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id}>
                {item.id === editingId ? (
                  <>
                    <td className="px-4 py-3 text-gray-900">
                      {item.ingredient?.name ?? item.ingredient?.name_en ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <input
                        type="number"
                        value={editGrams}
                        onChange={(event) => setEditGrams(event.target.value)}
                        className={inputClass}
                        style={{ width: '80px' }}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateIngredient.mutate(
                              {
                                id: item.id,
                                recipeId,
                                quantity_g: Number(editGrams),
                                notes: editNotes || null,
                              },
                              { onSuccess: () => setEditingId(null) }
                            )
                          }
                          className="rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          {t('save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                        >
                          {tc('cancel')}
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-900">
                      {item.ingredient?.name ?? item.ingredient?.name_en ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity_g}</td>
                    <td className="px-4 py-3 text-gray-700">{item.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id)
                            setEditGrams(String(item.quantity_g))
                            setEditNotes(item.notes ?? '')
                          }}
                          className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                        >
                          {t('edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeIngredient.mutate({ id: item.id, recipeId })}
                          className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  {t('addIngredient')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Section C — Totals */}
      {items.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t('totalNutrition')}
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            {servings} {t('servings')}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NutritionCard ingredient={totalsAsIngredient} label={t('totalNutrition')} />
            <NutritionCard ingredient={perServingAsIngredient} label={t('perServingNutrition')} />
          </div>
          <p className="mt-3 text-sm text-gray-700">
            {t('estimatedCost')}: ≈ {estimatedCost.toFixed(2)} {currency}
          </p>
        </section>
      )}
    </div>
  )
}
