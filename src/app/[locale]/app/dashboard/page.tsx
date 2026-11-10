'use client'

import { useEffect, useMemo, useState } from 'react'
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
  nutrientStatus,
  calcDayNutrition,
  calcRdaPercent,
  calcRecipeNutrition,
  type NutritionKey,
} from '@/lib/nutrition'
import { useRDA } from '@/hooks/useRDA'

const getLocalDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type ShownKey =
  | 'cal'
  | 'protein_g'
  | 'carbs_g'
  | 'fat_g'
  | 'fiber_g'
  | 'iron_mg'
  | 'calcium_mg'
  | 'zinc_mg'
  | 'vit_b12_mcg'
  | 'vit_d_mcg'
  | 'vit_c_mg'
  | 'omega3_g'

const T_KEY: Record<ShownKey, string> = {
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

const UNITS: Record<ShownKey, string> = {
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

const MACROS: ShownKey[] = ['cal', 'protein_g', 'carbs_g', 'fat_g']
const MICROS: ShownKey[] = [
  'fiber_g',
  'iron_mg',
  'calcium_mg',
  'zinc_mg',
  'vit_b12_mcg',
  'vit_c_mg',
  'omega3_g',
]


function NutrientStat({
  label,
  value,
  unit,
  percent,
  nk,
  rawValue,
  rdaValue,
}: {
  label: string
  value: string
  unit: string
  percent: number
  nk: string
  rawValue: number
  rdaValue: number
}) {
  const status = nutrientStatus(rawValue, rdaValue, nk)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">
        {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
      </p>
      <p className="text-xs text-gray-500">{percent.toFixed(0)}%</p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-gray-100">
        <div
          className={`h-1.5 rounded ${status.bar}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  )
}

/** Small pill showing one nutrient value */
function NutrientPill({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
      <span className="font-medium text-gray-800">{value.toFixed(0)}</span>
      <span>{unit}</span>
      <span className="text-gray-400">{label}</span>
    </span>
  )
}

const ENTRY_MACROS: ShownKey[] = ['cal', 'protein_g', 'carbs_g', 'fat_g']

function EntryNutritionRow({
  perServing,
  total,
  servings,
  tNut,
}: {
  perServing: Record<NutritionKey, number>
  total: Record<NutritionKey, number>
  servings: number
  tNut: (key: string) => string
}) {
  const multiServing = servings > 1
  return (
    <div className="mt-1.5 space-y-1">
      {multiServing && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-gray-400 w-20 shrink-0">Por porción:</span>
          <div className="flex flex-wrap gap-1">
            {ENTRY_MACROS.map((key) => (
              <NutrientPill
                key={key}
                label={tNut(T_KEY[key])}
                value={perServing[key]}
                unit={UNITS[key]}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-xs text-gray-400 w-20 shrink-0">
          {multiServing ? `Total (×${servings}):` : 'Total:'}
        </span>
        <div className="flex flex-wrap gap-1">
          {ENTRY_MACROS.map((key) => (
            <NutrientPill
              key={key}
              label={tNut(T_KEY[key])}
              value={total[key]}
              unit={UNITS[key]}
            />
          ))}
        </div>
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
  const { rda }  = useRDA()

  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    setSelectedDate(getLocalDateString())
  }, [])

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

  const recipeServingsMap = useMemo(
    () => new Map((userRecipes ?? []).map((recipe) => [recipe.id, recipe.servings] as const)),
    [userRecipes]
  )

  const dayNutrition = useMemo(
    () =>
      calcDayNutrition(
        dayLogs ?? [],
        recipeDetails ?? new Map<string, Record<NutritionKey, number>>(),
        recipeServingsMap,
        ingredientMap
      ),
    [dayLogs, recipeDetails, recipeServingsMap, ingredientMap]
  )

  const rdaPercent = useMemo(() => calcRdaPercent(dayNutrition, rda), [dayNutrition, rda])

  const logs = dayLogs ?? []

  function calcEntryNutrition(entry: (typeof logs)[0]) {
    if (entry.recipe_id) {
      const recipeNutrition = recipeDetails?.get(entry.recipe_id)
      const totalServings = recipeServingsMap.get(entry.recipe_id) ?? 1
      if (!recipeNutrition) return null
      const loggedServings = entry.servings ?? 1
      const perServing = Object.fromEntries(
        (Object.keys(recipeNutrition) as NutritionKey[]).map((k) => [
          k,
          recipeNutrition[k] / totalServings,
        ])
      ) as Record<NutritionKey, number>
      const total = Object.fromEntries(
        (Object.keys(perServing) as NutritionKey[]).map((k) => [k, perServing[k] * loggedServings])
      ) as Record<NutritionKey, number>
      return { perServing, total, servings: loggedServings }
    }

    if (entry.ingredient_id) {
      const ingredient = ingredientMap.get(entry.ingredient_id)
      if (!ingredient) return null
      const f = (entry.quantity_g ?? 0) / 100
      const total = {
        cal: (ingredient.cal ?? 0) * f,
        protein_g: (ingredient.protein_g ?? 0) * f,
        carbs_g: (ingredient.carbs_g ?? 0) * f,
        fat_g: (ingredient.fat_g ?? 0) * f,
        fiber_g: (ingredient.fiber_g ?? 0) * f,
        iron_mg: (ingredient.iron_mg ?? 0) * f,
        calcium_mg: (ingredient.calcium_mg ?? 0) * f,
        zinc_mg: (ingredient.zinc_mg ?? 0) * f,
        vit_b12_mcg: (ingredient.vit_b12_mcg ?? 0) * f,
        vit_d_mcg: (ingredient.vit_d_mcg ?? 0) * f,
        vit_c_mg: (ingredient.vit_c_mg ?? 0) * f,
        omega3_g: (ingredient.omega3_g ?? 0) * f,
      } as Record<NutritionKey, number>
      const zero = Object.fromEntries(
        Object.keys(total).map((k) => [k, 0])
      ) as Record<NutritionKey, number>
      return { perServing: zero, total, servings: 1 }
    }

    return null
  }

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
                nk={key}
                rawValue={dayNutrition[key]}
                rdaValue={rda[key] ?? 1}
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
              nk={key}
              rawValue={dayNutrition[key]}
              rdaValue={rda[key] ?? 1}
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
                  {entries.map((entry) => {
                    const entryNutrition = calcEntryNutrition(entry)
                    return (
                      <li key={entry.id} className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">
                            {entry.recipe_id
                              ? recipeNameMap.get(entry.recipe_id) ?? '—'
                              : ingredientMap.get(entry.ingredient_id ?? '')?.name ?? '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {entry.recipe_id
                              ? `× ${entry.servings ?? 1} ${
                                  (entry.servings ?? 1) === 1 ? 'porción' : 'porciones'
                                }`
                              : `${entry.quantity_g ?? ''}g`}
                          </span>
                          {entry.notes && (
                            <span className="text-xs text-gray-400">— {entry.notes}</span>
                          )}
                        </div>
                        {entryNutrition && (
                          <EntryNutritionRow
                            perServing={entryNutrition.perServing}
                            total={entryNutrition.total}
                            servings={entryNutrition.servings}
                            tNut={tNut}
                          />
                        )}
                      </li>
                    )
                  })}
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
