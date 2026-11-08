'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { MEAL_TYPES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { useDayLog } from '@/hooks/useMealLog'
import { useUserRecipes } from '@/hooks/useRecipes'
import { getAllIngredients } from '@/lib/api/ingredients'
import { getRecipeWithIngredients } from '@/lib/api/recipes'
import {
  calcDayNutrition,
  calcRdaPercent,
  calcRecipeNutrition,
  type NutritionKey,
} from '@/lib/nutrition'

const getLocalDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const T_KEY: Record<NutritionKey, string> = {
  cal: 'calories',
  protein_g: 'protein',
  carbs_g: 'carbs',
  fat_g: 'fat',
  fiber_g: 'fiber',
  iron_mg: 'iron',
  calcium_mg: 'calcium',
  zinc_mg: 'zinc',
  vit_b12_mcg: 'vit_b12',
  vit_d_mcg: 'vit_d',
  vit_c_mg: 'vit_c',
  omega3_g: 'omega3',
}

const UNITS: Record<NutritionKey, string> = {
  cal: 'kcal',
  protein_g: 'g',
  carbs_g: 'g',
  fat_g: 'g',
  fiber_g: 'g',
  iron_mg: 'mg',
  calcium_mg: 'mg',
  zinc_mg: 'mg',
  vit_b12_mcg: 'µg',
  vit_d_mcg: 'µg',
  vit_c_mg: 'mg',
  omega3_g: 'g',
}

const MACROS: NutritionKey[] = ['cal', 'protein_g', 'carbs_g', 'fat_g']
const MICROS: NutritionKey[] = [
  'fiber_g',
  'iron_mg',
  'calcium_mg',
  'zinc_mg',
  'vit_b12_mcg',
  'vit_d_mcg',
  'vit_c_mg',
  'omega3_g',
]

function barColor(percent: number): string {
  if (percent < 100) return 'bg-green-400'
  if (percent <= 120) return 'bg-amber-400'
  return 'bg-red-400'
}

function NutrientStat({
  label,
  value,
  unit,
  percent,
}: {
  label: string
  value: string
  unit: string
  percent: number
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">
        {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
      </p>
      <p className="text-xs text-gray-500">{percent.toFixed(0)}%</p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-gray-100">
        <div
          className={`h-1.5 rounded ${barColor(percent)}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const tNav = useTranslations('nav')
  const tDash = useTranslations('dashboard')
  const tNut = useTranslations('nutrition')
  const tMeal = useTranslations('meallog')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState(getLocalDateString)

  const { data: dayLogs } = useDayLog(user?.id ?? '', selectedDate)

  const { data: recipeDetails } = useQuery({
    queryKey: ['dashboard', 'recipes', user?.id, selectedDate],
    queryFn: async (): Promise<Map<string, Record<NutritionKey, number>>> => {
      if (!dayLogs || !user) return new Map<string, Record<NutritionKey, number>>()
      const recipeIds = [
        ...new Set(dayLogs.filter((log) => log.recipe_id).map((log) => log.recipe_id as string)),
      ]
      const results = await Promise.all(recipeIds.map((id) => getRecipeWithIngredients(id, locale)))
      const map = new Map<string, Record<NutritionKey, number>>()
      results.forEach((result, index) => {
        if (result) map.set(recipeIds[index], calcRecipeNutrition(result.items))
      })
      return map
    },
    enabled: !!dayLogs && !!user,
    staleTime: 1000 * 60 * 5,
  })

  const { data: allIngredients } = useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })

  const { data: userRecipes } = useUserRecipes(user?.id ?? '')

  const ingredientMap = useMemo(
    () => new Map((allIngredients ?? []).map((ingredient) => [ingredient.id, ingredient] as const)),
    [allIngredients]
  )

  const recipeNameMap = useMemo(
    () => new Map((userRecipes ?? []).map((recipe) => [recipe.id, recipe.name] as const)),
    [userRecipes]
  )

  const dayNutrition = useMemo(
    () =>
      calcDayNutrition(
        dayLogs ?? [],
        recipeDetails ?? new Map<string, Record<NutritionKey, number>>(),
        ingredientMap
      ),
    [dayLogs, recipeDetails, ingredientMap]
  )

  const rdaPercent = useMemo(() => calcRdaPercent(dayNutrition), [dayNutrition])

  const logs = dayLogs ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">{tNav('dashboard')}</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="dashboard-date" className="text-sm font-medium text-gray-700">
          {tMeal('title')}
        </label>
        <input
          id="dashboard-date"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Section 1 — Daily Nutrition Summary */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">{tDash('dailySummary')}</h2>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {MACROS.map((key) => (
            <div key={key} className="min-w-[140px] flex-1">
              <NutrientStat
                label={tNut(T_KEY[key])}
                value={dayNutrition[key].toFixed(0)}
                unit={UNITS[key]}
                percent={rdaPercent[key]}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {MICROS.map((key) => (
            <NutrientStat
              key={key}
              label={tNut(T_KEY[key])}
              value={dayNutrition[key].toFixed(0)}
              unit={UNITS[key]}
              percent={rdaPercent[key]}
            />
          ))}
        </div>
      </section>

      {/* Section 2 — Today's Meals */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{tDash('todayMeals')}</h2>
          <Link
            href={`/${locale}/app/meallog`}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            {tDash('goToLog')}
          </Link>
        </div>

        {logs.length === 0 && <p className="text-sm text-gray-500">{tDash('noMeals')}</p>}

        <div className="space-y-4">
          {MEAL_TYPES.map((meal) => {
            const entries = logs.filter((log) => log.meal_type === meal.value)
            if (entries.length === 0) return null

            return (
              <div key={meal.value}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {tMeal(meal.value)}
                </h3>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {entries.map((entry) => (
                    <li key={entry.id} className="px-4 py-2 text-sm text-gray-900">
                      {entry.recipe_id
                        ? `${recipeNameMap.get(entry.recipe_id) ?? '—'} × ${entry.servings ?? ''}`
                        : `${ingredientMap.get(entry.ingredient_id ?? '')?.name ?? '—'} ${
                            entry.quantity_g ?? ''
                          }g`}
                      {entry.notes && (
                        <span className="ml-2 text-xs text-gray-500">— {entry.notes}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 3 — Quick links */}
      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href={`/${locale}/app/meallog`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:border-primary-400"
          >
            {tNav('meallog')}
          </Link>
          <Link
            href={`/${locale}/app/recipes`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:border-primary-400"
          >
            {tNav('recipes')}
          </Link>
          <Link
            href={`/${locale}/app/ingredients`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:border-primary-400"
          >
            {tNav('ingredients')}
          </Link>
        </div>
      </section>
    </div>
  )
}
