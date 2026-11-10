'use client'
import { Fragment } from 'react'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useMealLogHistory, useDayLogDetail } from '@/hooks/useMealLog'
import type { DayHistorySummary, MealLogDetail, IngredientNutrients, MealLogOverride } from '@/types/domain'
import { usePrefsStore, displayWeight } from '@/stores/usePrefsStore'
import { useRDA } from '@/hooks/useRDA'
import { nutrientStatus } from '@/lib/nutrition'

// NutrKey — subset of nutrient keys used in this component
type NutrKey = 'cal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' |
               'iron_mg' | 'calcium_mg' | 'zinc_mg' | 'vit_b12_mcg' |
               'vit_d_mcg' | 'vit_c_mg' | 'omega3_g'


// ---------------------------------------------------------------------------
// Nutrient column definitions
// ---------------------------------------------------------------------------
const NUTR_COLS = [
  { key: 'cal'        as NutrKey, label: 'Cal',   unit: '',   dec: 0 },
  { key: 'protein_g'  as NutrKey, label: 'Prot',  unit: 'g',  dec: 1 },
  { key: 'carbs_g'    as NutrKey, label: 'Carbs', unit: 'g',  dec: 1 },
  { key: 'fat_g'      as NutrKey, label: 'Grasa', unit: 'g',  dec: 1 },
  { key: 'fiber_g'    as NutrKey, label: 'Fibra', unit: 'g',  dec: 1 },
  { key: 'iron_mg'    as NutrKey, label: 'Fe',    unit: 'mg', dec: 1 },
  { key: 'calcium_mg' as NutrKey, label: 'Ca',    unit: 'mg', dec: 0 },
  { key: 'zinc_mg'    as NutrKey, label: 'Zn',    unit: 'mg', dec: 1 },
  { key: 'vit_b12_mcg'as NutrKey, label: 'B12',  unit: 'μg', dec: 1 },
  { key: 'vit_c_mg'   as NutrKey, label: 'C',     unit: 'mg', dec: 0 },
  { key: 'omega3_g'   as NutrKey, label: 'Ω3',    unit: 'g',  dec: 2 },
]

type NutrValues = Record<NutrKey, number>

const ZERO_NUTR: NutrValues = {
  cal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
  iron_mg: 0, calcium_mg: 0, zinc_mg: 0, vit_b12_mcg: 0,
  vit_d_mcg: 0, vit_c_mg: 0, omega3_g: 0,
}

function computeNutr(ingr: IngredientNutrients, qty: number): NutrValues {
  const f = qty / 100
  return {
    cal: ingr.cal * f,
    protein_g: ingr.protein_g * f,
    carbs_g: ingr.carbs_g * f,
    fat_g: ingr.fat_g * f,
    fiber_g: ingr.fiber_g * f,
    iron_mg: ingr.iron_mg * f,
    calcium_mg: ingr.calcium_mg * f,
    zinc_mg: ingr.zinc_mg * f,
    vit_b12_mcg: ingr.vit_b12_mcg * f,
    vit_d_mcg: ingr.vit_d_mcg * f,
    vit_c_mg: ingr.vit_c_mg * f,
    omega3_g: ingr.omega3_g * f,
  }
}

function sumNutr(rows: NutrValues[]): NutrValues {
  return rows.reduce(
    (acc, r) => {
      for (const k of Object.keys(acc) as NutrKey[]) acc[k] += r[k]
      return acc
    },
    { ...ZERO_NUTR }
  )
}

function fmt(v: number, dec: number, unit: string) {
  return `${v.toFixed(dec)}${unit}`
}

// ---------------------------------------------------------------------------
// Per-entry ingredient rows
// ---------------------------------------------------------------------------
type IngRow = { name: string; qty: number; nutr: NutrValues }

function getEntryRows(entry: MealLogDetail): IngRow[] {
  if (entry.ingredient && entry.quantity_g != null) {
    return [{ name: entry.ingredient.name_en, qty: entry.quantity_g, nutr: computeNutr(entry.ingredient, entry.quantity_g) }]
  }
  if (entry.recipe && entry.servings != null) {
    const scale = entry.servings / entry.recipe.servings
    const ovMap = new Map<string, MealLogOverride>(entry.overrides.map((o) => [o.ingredient_id, o]))
    return entry.recipe.recipe_ingredients
      .filter((ri) => !ovMap.get(ri.ingredient.id)?.excluded)
      .map((ri) => {
        const ov = ovMap.get(ri.ingredient.id)
        const qty = ov?.quantity_g != null ? ov.quantity_g : ri.quantity_g * scale
        return { name: ri.ingredient.name_en, qty, nutr: computeNutr(ri.ingredient, qty) }
      })
  }
  return []
}

// ---------------------------------------------------------------------------
// Meal type labels
// ---------------------------------------------------------------------------
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

// ---------------------------------------------------------------------------
// Summary badge (collapsed row)
// ---------------------------------------------------------------------------
function NutrientBadge({ label, value, nk, unit, rda }: { label: string; value: number | null; nk: NutrKey; unit: string; rda: Record<string, number> }) {
  const status = nutrientStatus(value ?? 0, rda[nk] ?? 1, nk)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
        <span className="text-xs font-medium text-gray-700">
          {value != null ? `${Math.round(value)}${unit}` : '—'}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nutrient detail table
// ---------------------------------------------------------------------------
function NutrTable({ entries, units }: { entries: MealLogDetail[]; units: import('@/stores/usePrefsStore').UnitSystem }) {
  if (entries.length === 0) return <p className="py-4 text-center text-xs text-gray-400">Sin entradas</p>

  const totalRows: NutrValues[] = []

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="sticky left-0 z-10 bg-gray-50 py-2 pl-3 pr-2 text-left font-medium">Ingrediente</th>
            <th className="py-2 px-2 text-right font-medium">{units === 'oz' ? 'oz' : 'g'}</th>
            {NUTR_COLS.map((c) => (
              <th key={c.key} className="py-2 px-2 text-right font-medium whitespace-nowrap">
                {c.label}{c.unit ? <span className="font-normal text-gray-400"> {c.unit}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, ei) => {
            const rows = getEntryRows(entry)
            const subtotal = sumNutr(rows.map((r) => r.nutr))
            totalRows.push(subtotal)

            const mealLabel = MEAL_LABELS[entry.meal_type] ?? entry.meal_type
            const entryTitle = entry.recipe
              ? `${entry.recipe.name}${entry.servings != null && entry.servings !== 1 ? ` × ${entry.servings}` : ''}`
              : entry.ingredient
              ? entry.ingredient.name_en
              : '—'

            return (
              <Fragment key={entry.id}>
                {/* Entry header */}
                <tr className="bg-indigo-50">
                  <td
                    colSpan={2 + NUTR_COLS.length}
                    className="sticky left-0 py-1.5 pl-3 pr-2 font-semibold text-indigo-700 bg-indigo-50"
                  >
                    {mealLabel} — {entryTitle}
                  </td>
                </tr>

                {/* Ingredient rows */}
                {rows.map((row, ri) => (
                  <tr
                    key={`${entry.id}-${ri}`}
                    className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className={`sticky left-0 py-1.5 pl-4 pr-2 text-gray-700 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {row.name}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-gray-600">{units === 'oz' ? (row.qty / 28.3495).toFixed(1) : Math.round(row.qty)}</td>
                    {NUTR_COLS.map((c) => (
                      <td key={c.key} className="py-1.5 px-2 text-right tabular-nums text-gray-700">
                        {row.nutr[c.key].toFixed(c.dec)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Subtotal row (only if >1 ingredient) */}
                {rows.length > 1 && (
                  <tr className="border-t border-gray-200 bg-orange-50 font-semibold">
                    <td className="sticky left-0 bg-orange-50 py-1.5 pl-4 pr-2 text-orange-800">Subtotal</td>
                    <td className="py-1.5 px-2" />
                    {NUTR_COLS.map((c) => (
                      <td key={c.key} className="py-1.5 px-2 text-right tabular-nums text-orange-800">
                        {subtotal[c.key].toFixed(c.dec)}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Spacer between entries */}
                {ei < entries.length - 1 && (
                  <tr>
                    <td colSpan={2 + NUTR_COLS.length} className="py-0.5 bg-gray-100" />
                  </tr>
                )}
              </Fragment>
            )
          })}

          {/* TOTAL row */}
          {(() => {
            const total = sumNutr(totalRows)
            return (
              <tr className="border-t-2 border-gray-400 bg-emerald-50 font-bold">
                <td className="sticky left-0 bg-emerald-50 py-2 pl-3 pr-2 text-emerald-900">TOTAL</td>
                <td className="py-2 px-2" />
                {NUTR_COLS.map((c) => (
                  <td key={c.key} className="py-2 px-2 text-right tabular-nums text-emerald-900">
                    {fmt(total[c.key], c.dec, c.unit)}
                  </td>
                ))}
              </tr>
            )
          })()}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DayRow — collapsed summary + expandable detail
// ---------------------------------------------------------------------------
interface DayRowProps {
  day: DayHistorySummary
  locale: string
  userId: string
}

function DayRow({ day, locale, userId }: DayRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { data: detail, isLoading } = useDayLogDetail(userId, day.logged_at, expanded, locale)
  const units = usePrefsStore((s) => s.units)
  const { rda } = useRDA()

  const calStatus = nutrientStatus(day.cal ?? 0, rda['cal'] ?? 1, 'cal')

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Clickable summary header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50 transition-colors"
      >
        {/* Fecha + calorías + chevron */}
        <div className="flex items-center gap-3 min-w-[160px]">
          {/* Chevron */}
          <span className="text-gray-400 flex-shrink-0">
            {expanded ? (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(day.logged_at + 'T00:00:00').toLocaleDateString(locale, {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </p>
            <p className="text-xs text-gray-400">{day.entry_count} entr{day.entry_count === 1 ? 'ada' : 'adas'}</p>
          </div>
          {/* Calorías */}
          <div className="flex flex-col items-center ml-2">
            <span className="text-[10px] text-gray-400">Cal</span>
            <div className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${calStatus.dot}`} />
              <span className="text-xs font-semibold text-gray-800">
                {day.cal != null ? Math.round(day.cal) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="flex flex-wrap gap-3">
          <NutrientBadge label="Prot"  value={day.protein_g}  nk="protein_g"  unit="g" rda={rda}  />
          <NutrientBadge label="Carbs" value={day.carbs_g}    nk="carbs_g"    unit="g" rda={rda}  />
          <NutrientBadge label="Grasa" value={day.fat_g}      nk="fat_g"      unit="g" rda={rda}  />
          <NutrientBadge label="Fibra" value={day.fiber_g}    nk="fiber_g"    unit="g" rda={rda}  />
        </div>

        {/* Micronutrientes */}
        <div className="flex flex-wrap gap-3">
          <NutrientBadge label="Fe"  value={day.iron_mg}     nk="iron_mg"     unit="mg" rda={rda} />
          <NutrientBadge label="Ca"  value={day.calcium_mg}  nk="calcium_mg"  unit="mg" rda={rda} />
          <NutrientBadge label="Zn"  value={day.zinc_mg}     nk="zinc_mg"     unit="mg" rda={rda} />
          <NutrientBadge label="B12" value={day.vit_b12_mcg} nk="vit_b12_mcg" unit="μg" rda={rda} />
          <NutrientBadge label="C"   value={day.vit_c_mg}    nk="vit_c_mg"    unit="mg" rda={rda} />
          <NutrientBadge label="Ω3"  value={day.omega3_g}    nk="omega3_g"    unit="g" rda={rda}  />
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2 pt-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : (
            <NutrTable entries={detail ?? []} units={units} />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HistoryView (main export)
// ---------------------------------------------------------------------------
interface HistoryViewProps {
  locale: string
}

export default function HistoryView({ locale }: HistoryViewProps) {
  const t = useTranslations('meallog')
  const { user } = useAuth()

  const toDate   = new Date().toISOString().slice(0, 10)
  const fromDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: history, isLoading } = useMealLogHistory(user?.id ?? '', fromDate, toDate)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-sm text-gray-500">{t('noHistory')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Leyenda semáforo — 5 estados */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-1">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />≥ 80% RDA</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" />50–79%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />&lt; 50%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />Cerca del límite (UL)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Excede límite seguro</span>
      </div>
      {history.map((day) => (
        <DayRow key={day.logged_at} day={day} locale={locale} userId={user?.id ?? ''} />
      ))}
    </div>
  )
}
