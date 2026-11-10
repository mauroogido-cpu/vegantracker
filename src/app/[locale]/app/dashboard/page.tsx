'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { MEAL_TYPES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { getDayLogDetail } from '@/lib/api/meallog'
import { nutrientStatus } from '@/lib/nutrition'
import { useRDA } from '@/hooks/useRDA'
import { usePrefsStore } from '@/stores/usePrefsStore'
import {
  NutrTable,
  getEntryRows,
  sumNutr,
  ZERO_NUTR,
  type NutrKey,
} from '@/components/meallog/NutrDetailTable'

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLocalDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Nutrient display config ───────────────────────────────────────────────────

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
  cal:         'calories',
  protein_g:   'protein',
  carbs_g:     'carbs',
  fat_g:       'fat',
  fiber_g:     'fiber',
  iron_mg:     'iron',
  calcium_mg:  'calcium',
  zinc_mg:     'zinc',
  vit_b12_mcg: 'vit_b12',
  vit_d_mcg:   'vit_d',
  vit_c_mg:    'vit_c',
  omega3_g:    'omega3',
}

const UNITS: Record<ShownKey, string> = {
  cal:         'kcal',
  protein_g:   'g',
  carbs_g:     'g',
  fat_g:       'g',
  fiber_g:     'g',
  iron_mg:     'mg',
  calcium_mg:  'mg',
  zinc_mg:     'mg',
  vit_b12_mcg: 'µg',
  vit_d_mcg:   'µg',
  vit_c_mg:    'mg',
  omega3_g:    'g',
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
const SHOWN_KEYS: ShownKey[] = [...MACROS, ...MICROS]

// ── NutrientStat card ─────────────────────────────────────────────────────────

function NutrientStat({
  label,
  value,
  unit,
  percent,
  nk,
  rawValue,
  rdaValue,
}: {
  label:    string
  value:    string
  unit:     string
  percent:  number
  nk:       string
  rawValue: number
  rdaValue: number
}) {
  const status = nutrientStatus(rawValue, rdaValue, nk)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">
        {value}{' '}
        <span className="text-xs font-normal text-gray-500">{unit}</span>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const tNav  = useTranslations('nav')
  const tDash = useTranslations('dashboard')
  const tNut  = useTranslations('nutrition')
  const tMeal = useTranslations('meallog')
  const { locale } = useParams<{ locale: string }>()
  const { user }   = useAuth()
  const { rda }    = useRDA()
  const units      = usePrefsStore((s) => s.units)

  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    setSelectedDate(getLocalDateString())
  }, [])

  // Single query: full detail with ingredients + overrides (same source as HistoryView expanded)
  const { data: dayDetail } = useQuery({
    queryKey: ['dashboard', 'detail', user?.id, selectedDate, locale],
    queryFn:  () => getDayLogDetail(user!.id, selectedDate, locale),
    enabled:  !!user && !!selectedDate,
    staleTime: 1000 * 60,
  })

  // Compute daily totals from ingredient rows (overrides applied)
  const dayTotal = useMemo(() => {
    if (!dayDetail?.length) return ZERO_NUTR
    return sumNutr(dayDetail.flatMap((e) => getEntryRows(e)).map((r) => r.nutr))
  }, [dayDetail])

  // Per-nutrient RDA percentages for the shown subset
  const rdaPercent = useMemo(() => {
    return Object.fromEntries(
      SHOWN_KEYS.map((k) => [
        k,
        Math.min(150, (dayTotal[k as NutrKey] / (rda[k] ?? 1)) * 100),
      ])
    ) as Record<ShownKey, number>
  }, [dayTotal, rda])

  const logs = dayDetail ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">{tNav('dashboard')}</h1>

      {/* Date picker */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="dashboard-date" className="text-sm font-medium text-gray-700">
          {tMeal('title')}
        </label>
        <input
          id="dashboard-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* ── Section 1 — Daily Nutrition Summary ─────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          {tDash('dailySummary')}
        </h2>

        {/* Macros */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {MACROS.map((key) => (
            <div key={key} className="min-w-[140px] flex-1">
              <NutrientStat
                label={tNut(T_KEY[key])}
                value={dayTotal[key as NutrKey].toFixed(0)}
                unit={UNITS[key]}
                percent={rdaPercent[key]}
                nk={key}
                rawValue={dayTotal[key as NutrKey]}
                rdaValue={rda[key] ?? 1}
              />
            </div>
          ))}
        </div>

        {/* Micros */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {MICROS.map((key) => (
            <NutrientStat
              key={key}
              label={tNut(T_KEY[key])}
              value={dayTotal[key as NutrKey].toFixed(0)}
              unit={UNITS[key]}
              percent={rdaPercent[key]}
              nk={key}
              rawValue={dayTotal[key as NutrKey]}
              rdaValue={rda[key] ?? 1}
            />
          ))}
        </div>
      </section>

      {/* ── Section 2 — Today's Meals ───────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {tDash('todayMeals')}
          </h2>
          <Link
            href={`/${locale}/app/meallog`}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            {tDash('goToLog')}
          </Link>
        </div>

        {logs.length === 0 && (
          <p className="text-sm text-gray-500">{tDash('noMeals')}</p>
        )}

        {/* Semáforo legend */}
        {logs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />≥ 80% RDA
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />50–79%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />&lt; 50%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400" />Cerca del límite
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />Excede límite
            </span>
          </div>
        )}

        <div className="space-y-6">
          {MEAL_TYPES.map((meal) => {
            const entries = logs.filter((e) => e.meal_type === meal.value)
            if (entries.length === 0) return null

            return (
              <div key={meal.value}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {tMeal(meal.value)}
                </h3>
                <NutrTable
                  entries={entries}
                  units={units}
                  showMealType={false}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 3 — Quick links ──────────────────────────────────────────── */}
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
