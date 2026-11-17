'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { MEAL_TYPES, NUTRIENT_ROLE, NUTRIENT_UL } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { getDayLogDetail, getWeekDetails } from '@/lib/api/meallog'
import { nutrientStatus } from '@/lib/nutrition'
import { useRDA, type RDAMeta } from '@/hooks/useRDA'
import { usePrefsStore } from '@/stores/usePrefsStore'
import {
  NutrTable,
  getEntryRows,
  sumNutr,
  ZERO_NUTR,
  type NutrKey,
  type NutrValues,
} from '@/components/meallog/NutrDetailTable'

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLocalDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Use a fixed locale so SSR and client produce identical strings
function fmt(n: number): string {
  return n % 1 === 0
    ? n.toLocaleString('en-US')
    : n.toLocaleString('en-US', { maximumFractionDigits: 1 })
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
  | 'vit_d_mcg'
  | 'vit_c_mg'
  | 'omega3_g'
  | 'magnesium_mg'
  | 'potassium_mg'
  | 'sodium_mg'

const T_KEY: Record<ShownKey, string> = {
  cal:          'calories',
  protein_g:    'protein',
  carbs_g:      'carbs',
  fat_g:        'fat',
  fiber_g:      'fiber',
  iron_mg:      'iron',
  calcium_mg:   'calcium',
  zinc_mg:      'zinc',
  vit_d_mcg:    'vit_d',
  vit_c_mg:     'vit_c',
  omega3_g:     'omega3',
  magnesium_mg: 'magnesium',
  potassium_mg: 'potassium',
  sodium_mg:    'sodium',
}

const UNITS: Record<ShownKey, string> = {
  cal:          'kcal',
  protein_g:    'g',
  carbs_g:      'g',
  fat_g:        'g',
  fiber_g:      'g',
  iron_mg:      'mg',
  calcium_mg:   'mg',
  zinc_mg:      'mg',
  vit_d_mcg:    'µg',
  vit_c_mg:     'mg',
  omega3_g:     'g',
  magnesium_mg: 'mg',
  potassium_mg: 'mg',
  sodium_mg:    'mg',
}

const MACROS: ShownKey[] = ['cal', 'protein_g', 'carbs_g', 'fat_g']
const MICROS: ShownKey[] = [
  'fiber_g', 'iron_mg', 'calcium_mg', 'zinc_mg',
  'magnesium_mg', 'potassium_mg', 'sodium_mg',
  'vit_c_mg', 'omega3_g',
]
const SHOWN_KEYS: ShownKey[] = [...MACROS, ...MICROS]

// ── Build per-nutrient reference label ────────────────────────────────────────

function buildRefLabels(
  nk: ShownKey,
  rdaValue: number,
  unit: string,
  meta: RDAMeta,
): { line1: string; line2: string | null } {
  const role = NUTRIENT_ROLE[nk] ?? 'min_only'
  const ul   = NUTRIENT_UL[nk]

  const targetStr = `meta: ${fmt(rdaValue)} ${unit}`
  const line1 = role === 'range_ul' && ul !== undefined
    ? `${targetStr} · UL: ${fmt(ul)} ${unit}`
    : targetStr

  let line2: string | null = null

  if (nk === 'cal' && meta.calSource === 'calculated' && meta.tdee !== null) {
    line2 = 'Mifflin-St Jeor × nivel actividad'
  }
  if (nk === 'protein_g' && meta.macrosSource === 'derived' && meta.weightKg !== null) {
    line2 = `0.8 g/kg peso · ${fmt(meta.weightKg)} kg`
  }
  if (nk === 'carbs_g' && meta.tdee !== null) {
    line2 = `AMDR: 45–65% de ${fmt(meta.tdee)} kcal · meta 55%`
  }
  if (nk === 'fat_g' && meta.tdee !== null) {
    line2 = `mínimo AMDR: 20% de ${fmt(meta.tdee)} kcal ÷ 9`
  }
  if (nk === 'iron_mg')   line2 = 'RDA ×1.8 biodisponibilidad vegana'
  if (nk === 'zinc_mg')   line2 = 'RDA ×1.5 inhibición por fitatos'
  if (nk === 'omega3_g')  line2 = 'ALA esencial — cubre linaza, chía, nueces'

  return { line1, line2 }
}

// ── MacroDonut ────────────────────────────────────────────────────────────────
//
// SVG donut showing protein / carbs / fat as % of total kcal.
// r=50, circumference = 2π×50 ≈ 314.159

const C = 2 * Math.PI * 50  // 314.159

function MacroDonut({ totals }: { totals: NutrValues }) {
  const pKcal = totals.protein_g * 4
  const cKcal = totals.carbs_g   * 4
  const fKcal = totals.fat_g     * 9
  const total = pKcal + cKcal + fKcal || 1   // avoid /0

  const pLen = (pKcal / total) * C
  const cLen = (cKcal / total) * C
  const fLen = (fKcal / total) * C

  const pPct = Math.round((pKcal / total) * 100)
  const cPct = Math.round((cKcal / total) * 100)
  const fPct = 100 - pPct - cPct  // avoid rounding to 101

  const totalKcal = Math.round(totals.cal)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 130 130" aria-hidden="true">
        {/* Track */}
        <circle cx="65" cy="65" r="50" fill="none" stroke="#F3F4F6" strokeWidth="20" />
        {/* Protein */}
        <circle
          cx="65" cy="65" r="50" fill="none"
          stroke="#3B82F6" strokeWidth="20"
          strokeDasharray={`${pLen} ${C}`}
          strokeDashoffset={0}
          transform="rotate(-90 65 65)"
        />
        {/* Carbs */}
        <circle
          cx="65" cy="65" r="50" fill="none"
          stroke="#F59E0B" strokeWidth="20"
          strokeDasharray={`${cLen} ${C}`}
          strokeDashoffset={-pLen}
          transform="rotate(-90 65 65)"
        />
        {/* Fat */}
        <circle
          cx="65" cy="65" r="50" fill="none"
          stroke="#8B5CF6" strokeWidth="20"
          strokeDasharray={`${fLen} ${C}`}
          strokeDashoffset={-(pLen + cLen)}
          transform="rotate(-90 65 65)"
        />
        {/* Center label */}
        <text x="65" y="61" textAnchor="middle"
          fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="11"
          fontWeight="600" fill="#374151" suppressHydrationWarning>
          {totalKcal.toLocaleString('en-US')}
        </text>
        <text x="65" y="74" textAnchor="middle"
          fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="9"
          fill="#9CA3AF">
          kcal
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          <span>Prot</span>
          <span className="ml-auto font-semibold text-gray-700 tabular-nums">{pPct}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span>Carbos</span>
          <span className="ml-auto font-semibold text-gray-700 tabular-nums">{cPct}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
          <span>Grasa</span>
          <span className="ml-auto font-semibold text-gray-700 tabular-nums">{fPct}%</span>
        </div>
      </div>
    </div>
  )
}

// ── NutrientStat card ─────────────────────────────────────────────────────────

function NutrientStat({
  label,
  value,
  unit,
  percent,
  nk,
  rawValue,
  rdaValue,
  meta,
}: {
  label:    string
  value:    string
  unit:     string
  percent:  number
  nk:       ShownKey
  rawValue: number
  rdaValue: number
  meta:     RDAMeta
}) {
  const status = nutrientStatus(rawValue, rdaValue, nk)
  const { line1, line2 } = buildRefLabels(nk, rdaValue, unit, meta)

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
      <p
        className="mt-1 text-[10px] leading-tight text-gray-400"
        suppressHydrationWarning
      >
        {line1}
      </p>
      {line2 && (
        <p
          className="mt-0.5 text-[10px] leading-tight text-gray-300 italic"
          suppressHydrationWarning
        >
          {line2}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = 'today' | 'week'

export default function DashboardPage() {
  const tNav  = useTranslations('nav')
  const tDash = useTranslations('dashboard')
  const tNut  = useTranslations('nutrition')
  const tMeal = useTranslations('meallog')
  const { locale } = useParams<{ locale: string }>()
  const { user }   = useAuth()
  const { rda, rdaMeta, source: rdaSource } = useRDA()
  const units = usePrefsStore((s) => s.units)

  const [selectedDate, setSelectedDate] = useState('')
  const [viewMode, setViewMode]         = useState<ViewMode>('today')
  // Track whether the user manually chose a mode (overrides auto-fallback)
  const [userChoseMode, setUserChoseMode] = useState(false)

  useEffect(() => {
    setSelectedDate(getLocalDateString())
  }, [])

  // ── Today's detail ────────────────────────────────────────────────────────
  const { data: dayDetail } = useQuery({
    queryKey: ['dashboard', 'detail', user?.id, selectedDate, locale],
    queryFn:  () => getDayLogDetail(user!.id, selectedDate, locale),
    enabled:  !!user && !!selectedDate,
    staleTime: 1000 * 60,
  })

  // ── Last 7 days detail (parallel fetches) ────────────────────────────────
  const { data: weekData } = useQuery({
    queryKey: ['dashboard', 'week', user?.id, locale],
    queryFn:  () => getWeekDetails(user!.id, locale),
    enabled:  !!user,
    staleTime: 1000 * 60 * 5,
  })

  // ── Auto-fallback: if no data today and week has data, switch to week ─────
  useEffect(() => {
    if (userChoseMode) return
    if (dayDetail === undefined || weekData === undefined) return

    const todayIsEmpty = dayDetail.length === 0
    const weekHasData  = weekData.some((d) => d.length > 0)

    if (todayIsEmpty && weekHasData) {
      setViewMode('week')
    } else {
      setViewMode('today')
    }
  }, [dayDetail, weekData, userChoseMode])

  // ── Reset userChoseMode when date changes (back to auto-fallback logic) ───
  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setUserChoseMode(false)
  }

  const handleToggle = (mode: ViewMode) => {
    setViewMode(mode)
    setUserChoseMode(true)
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const todayTotal = useMemo(() => {
    if (!dayDetail?.length) return ZERO_NUTR
    return sumNutr(dayDetail.flatMap((e) => getEntryRows(e)).map((r) => r.nutr))
  }, [dayDetail])

  // Weekly average: sum of all days with entries, divided by number of such days
  const weekTotal = useMemo((): NutrValues => {
    if (!weekData) return ZERO_NUTR
    const daysWithData = weekData.filter((d) => d.length > 0)
    if (daysWithData.length === 0) return ZERO_NUTR

    const allRows = daysWithData.flatMap((dayEntries) =>
      dayEntries.flatMap((e) => getEntryRows(e)).map((r) => r.nutr),
    )
    const sum = sumNutr(allRows)
    const n   = daysWithData.length

    return Object.fromEntries(
      Object.entries(sum).map(([k, v]) => [k, v / n]),
    ) as NutrValues
  }, [weekData])

  const dayTotal = viewMode === 'week' ? weekTotal : todayTotal

  // Auto-fallback notification: show banner when we switched automatically
  const autoSwitched =
    !userChoseMode &&
    viewMode === 'week' &&
    (dayDetail?.length ?? 0) === 0

  const rdaPercent = useMemo(() => {
    return Object.fromEntries(
      SHOWN_KEYS.map((k) => [
        k,
        Math.min(150, (dayTotal[k as NutrKey] / (rda[k] ?? 1)) * 100),
      ])
    ) as Record<ShownKey, number>
  }, [dayTotal, rda])

  const logs = viewMode === 'today' ? (dayDetail ?? []) : []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">{tNav('dashboard')}</h1>

      {/* ── View toggle ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-0 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => handleToggle('today')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'today'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => handleToggle('week')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Últimos 7 días
          </button>
        </div>

        {/* Date picker — only in today mode */}
        {viewMode === 'today' && (
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="dashboard-date" className="text-sm font-medium text-gray-700">
              {tMeal('title')}
            </label>
            <input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        )}

        {rdaSource === 'default' && (
          <span className="text-xs text-amber-600">
            ⚠ RDA genérico —{' '}
            <Link href={`/${locale}/app/settings`} className="underline hover:text-amber-700">
              completá tu perfil
            </Link>{' '}
            para metas personalizadas
          </span>
        )}
      </div>

      {/* Auto-fallback notice */}
      {autoSwitched && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
          Sin registros para hoy — mostrando el promedio de los últimos 7 días.
        </p>
      )}

      {/* ── Section 1 — Daily Nutrition Summary ─────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          {tDash('dailySummary')}
          {viewMode === 'week' && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              promedio diario · últimos 7 días
            </span>
          )}
        </h2>

        {/* Macro block: donut + 4 cards */}
        <div className="flex gap-4 items-start flex-wrap mb-4">
          {/* Donut */}
          <div className="w-[130px] flex-shrink-0">
            <MacroDonut totals={dayTotal} />
          </div>

          {/* 4 macro cards */}
          <div className="flex gap-3 flex-1 flex-wrap min-w-0">
            {MACROS.map((key) => (
              <div key={key} className="min-w-[130px] flex-1">
                <NutrientStat
                  label={tNut(T_KEY[key])}
                  value={dayTotal[key as NutrKey].toFixed(0)}
                  unit={UNITS[key]}
                  percent={rdaPercent[key]}
                  nk={key}
                  rawValue={dayTotal[key as NutrKey]}
                  rdaValue={rda[key] ?? 1}
                  meta={rdaMeta}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Micros */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {MICROS.map((key) => (
            <NutrientStat
              key={key}
              label={tNut(T_KEY[key])}
              value={dayTotal[key as NutrKey].toFixed(1)}
              unit={UNITS[key]}
              percent={rdaPercent[key]}
              nk={key}
              rawValue={dayTotal[key as NutrKey]}
              rdaValue={rda[key] ?? 1}
              meta={rdaMeta}
            />
          ))}
        </div>
      </section>

      {/* ── Section 2 — Today's Meals (only in 'today' mode) ────────────────── */}
      {viewMode === 'today' && (
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
                  <NutrTable entries={entries} units={units} showMealType={false} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Section 3 — Quick links ──────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href={`/${locale}/app/meallog`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:border-primary-400">
            {tNav('meallog')}
          </Link>
          <Link href={`/${locale}/app/recipes`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:border-primary-400">
            {tNav('recipes')}
          </Link>
          <Link href={`/${locale}/app/ingredients`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:border-primary-400">
            {tNav('ingredients')}
          </Link>
        </div>
      </section>
    </div>
  )
}
