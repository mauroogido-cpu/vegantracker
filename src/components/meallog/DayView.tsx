'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { MEAL_TYPES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { useDayLog, useDeleteMealLog } from '@/hooks/useMealLog'
import { useUserRecipes } from '@/hooks/useRecipes'
import { getAllIngredients } from '@/lib/api/ingredients'
import MealLogModal from './MealLogModal'

interface DayViewProps {
  date: string
  locale: string
}

export default function DayView({ date, locale }: DayViewProps) {
  const t = useTranslations('meallog')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)

  const { data: logs } = useDayLog(user?.id ?? '', date)
  const deleteMealLog = useDeleteMealLog()

  const { data: recipes } = useUserRecipes(user?.id ?? '')
  const { data: ingredients } = useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })

  const recipeMap = useMemo(
    () => new Map((recipes ?? []).map((r) => [r.id, r.name] as const)),
    [recipes]
  )
  const ingredientMap = useMemo(
    () => new Map((ingredients ?? []).map((i) => [i.id, i.name] as const)),
    [ingredients]
  )

  const hasEntries = logs && logs.length > 0

  return (
    <div>
      {/* Header fecha + botón */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {new Date(date + 'T00:00:00').toLocaleDateString(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('addEntry')}
        </button>
      </div>

      {/* Entradas agrupadas por tipo de comida */}
      {hasEntries ? (
        <div className="space-y-5">
          {MEAL_TYPES.map((meal) => {
            const entries = logs.filter((e) => e.meal_type === meal.value)
            if (entries.length === 0) return null

            return (
              <section key={meal.value}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {t(meal.value)}
                </h3>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.recipe_id
                            ? `${recipeMap.get(entry.recipe_id) ?? '—'} × ${entry.servings ?? ''} ${t('servings')}`
                            : `${ingredientMap.get(entry.ingredient_id ?? '') ?? '—'} · ${entry.quantity_g ?? ''}g`}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-gray-500">{entry.notes}</p>
                        )}
                        {entry.overrides && entry.overrides.length > 0 && (
                          <p className="text-xs text-primary-600">
                            {entry.overrides.length} modificación{entry.overrides.length !== 1 ? 'es' : ''}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMealLog.mutate(entry.id)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        {tc('delete')}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-500">{t('noMeals')}</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {t('addEntry')}
          </button>
        </div>
      )}

      {showModal && (
        <MealLogModal date={date} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
