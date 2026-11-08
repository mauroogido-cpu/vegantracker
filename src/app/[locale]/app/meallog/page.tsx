'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import MealLogForm from '@/components/meallog/MealLogForm'
import { MEAL_TYPES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { useDayLog, useDeleteMealLog } from '@/hooks/useMealLog'
import { useUserRecipes } from '@/hooks/useRecipes'
import { getAllIngredients } from '@/lib/api/ingredients'

const getLocalDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MealLogPage() {
  const t = useTranslations('meallog')
  const tc = useTranslations('common')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState(getLocalDateString)
  const [showForm, setShowForm] = useState(false)

  const { data: logs } = useDayLog(user?.id ?? '', selectedDate)
  const deleteMealLog = useDeleteMealLog()

  const { data: recipes } = useUserRecipes(user?.id ?? '')
  const { data: ingredients } = useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })

  const recipeMap = useMemo(
    () => new Map((recipes ?? []).map((recipe) => [recipe.id, recipe.name] as const)),
    [recipes]
  )
  const ingredientMap = useMemo(
    () => new Map((ingredients ?? []).map((ingredient) => [ingredient.id, ingredient.name] as const)),
    [ingredients]
  )

  if (!user) return null

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-6">
        {MEAL_TYPES.map((meal) => {
          const entries = (logs ?? []).filter((entry) => entry.meal_type === meal.value)
          if (entries.length === 0) return null

          return (
            <section key={meal.value}>
              <h2 className="mb-2 text-lg font-semibold text-gray-800">{t(meal.value)}</h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">
                        {entry.recipe_id
                          ? `${recipeMap.get(entry.recipe_id) ?? '—'} × ${entry.servings ?? ''} ${t('servings')}`
                          : `${ingredientMap.get(entry.ingredient_id ?? '') ?? '—'} ${entry.quantity_g ?? ''}g`}
                      </p>
                      {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMealLog.mutate(entry.id)}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      {tc('delete')}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {(!logs || logs.length === 0) && <p className="text-sm text-gray-500">{t('noMeals')}</p>}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          {t('addEntry')}
        </button>

        {showForm && (
          <div className="mt-4">
            <MealLogForm date={selectedDate} onSuccess={() => setShowForm(false)} />
          </div>
        )}
      </div>
    </div>
  )
}
