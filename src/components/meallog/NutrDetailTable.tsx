'use client'

import { Fragment } from 'react'
import type { UnitSystem } from '@/stores/usePrefsStore'
import type { MealLogDetail, MealLogOverride, IngredientNutrients } from '@/types/domain'

// ── Types ────────────────────────────────────────────────────────────────────

export type NutrKey =
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

export type NutrValues = Record<NutrKey, number>

export type IngRow = { name: string; qty: number; nutr: NutrValues }

// ── Constants ─────────────────────────────────────────────────────────────────

export const NUTR_COLS: { key: NutrKey; label: string; unit: string; dec: number }[] = [
  { key: 'cal',         label: 'Cal',   unit: '',   dec: 0 },
  { key: 'protein_g',   label: 'Prot',  unit: 'g',  dec: 1 },
  { key: 'carbs_g',     label: 'Carbs', unit: 'g',  dec: 1 },
  { key: 'fat_g',       label: 'Grasa', unit: 'g',  dec: 1 },
  { key: 'fiber_g',     label: 'Fibra', unit: 'g',  dec: 1 },
  { key: 'iron_mg',     label: 'Fe',    unit: 'mg', dec: 1 },
  { key: 'calcium_mg',  label: 'Ca',    unit: 'mg', dec: 0 },
  { key: 'zinc_mg',     label: 'Zn',    unit: 'mg', dec: 1 },
  { key: 'vit_b12_mcg', label: 'B12',  unit: 'μg', dec: 1 },
  { key: 'vit_c_mg',    label: 'C',     unit: 'mg', dec: 0 },
  { key: 'omega3_g',    label: 'Ω3',    unit: 'g',  dec: 2 },
]

export const ZERO_NUTR: NutrValues = {
  cal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
  iron_mg: 0, calcium_mg: 0, zinc_mg: 0, vit_b12_mcg: 0,
  vit_d_mcg: 0, vit_c_mg: 0, omega3_g: 0,
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

export function computeNutr(ingr: IngredientNutrients, qty: number): NutrValues {
  const f = qty / 100
  return {
    cal:         ingr.cal         * f,
    protein_g:   ingr.protein_g   * f,
    carbs_g:     ingr.carbs_g     * f,
    fat_g:       ingr.fat_g       * f,
    fiber_g:     ingr.fiber_g     * f,
    iron_mg:     ingr.iron_mg     * f,
    calcium_mg:  ingr.calcium_mg  * f,
    zinc_mg:     ingr.zinc_mg     * f,
    vit_b12_mcg: ingr.vit_b12_mcg * f,
    vit_d_mcg:   ingr.vit_d_mcg   * f,
    vit_c_mg:    ingr.vit_c_mg    * f,
    omega3_g:    ingr.omega3_g    * f,
  }
}

export function sumNutr(rows: NutrValues[]): NutrValues {
  return rows.reduce(
    (acc, r) => {
      for (const k of Object.keys(acc) as NutrKey[]) acc[k] += r[k]
      return acc
    },
    { ...ZERO_NUTR }
  )
}

export function getEntryRows(entry: MealLogDetail): IngRow[] {
  if (entry.ingredient && entry.quantity_g != null) {
    return [{
      name: entry.ingredient.name_en,
      qty:  entry.quantity_g,
      nutr: computeNutr(entry.ingredient, entry.quantity_g),
    }]
  }
  if (entry.recipe && entry.servings != null) {
    const scale  = entry.servings / entry.recipe.servings
    const ovMap  = new Map<string, MealLogOverride>(
      entry.overrides.map((o) => [o.ingredient_id, o])
    )
    return entry.recipe.recipe_ingredients
      .filter((ri) => !ovMap.get(ri.ingredient.id)?.excluded)
      .map((ri) => {
        const ov  = ovMap.get(ri.ingredient.id)
        const qty = ov?.quantity_g != null ? ov.quantity_g : ri.quantity_g * scale
        return { name: ri.ingredient.name_en, qty, nutr: computeNutr(ri.ingredient, qty) }
      })
  }
  return []
}

// ── NutrTable component ───────────────────────────────────────────────────────


interface NutrTableProps {
  entries:      MealLogDetail[]
  units:        UnitSystem
  /** When false, omits "MealType — " prefix from entry headers. Default true. */
  showMealType?: boolean
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  dinner:    'Cena',
  snack:     'Snack',
}

function fmt(v: number, dec: number, unit: string) {
  return `${v.toFixed(dec)}${unit}`
}

export function NutrTable({ entries, units, showMealType = true }: NutrTableProps) {
  if (entries.length === 0) {
    return <p className="py-4 text-center text-xs text-gray-400">Sin entradas</p>
  }

  const totalRows: NutrValues[] = []

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="sticky left-0 z-10 bg-gray-50 py-2 pl-3 pr-2 text-left font-medium">
              Ingrediente
            </th>
            <th className="py-2 px-2 text-right font-medium">
              {units === 'oz' ? 'oz' : 'g'}
            </th>
            {NUTR_COLS.map((c) => (
              <th key={c.key} className="py-2 px-2 text-right font-medium whitespace-nowrap">
                {c.label}
                {c.unit ? (
                  <span className="font-normal text-gray-400"> {c.unit}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, ei) => {
            const rows     = getEntryRows(entry)
            const subtotal = sumNutr(rows.map((r) => r.nutr))
            totalRows.push(subtotal)

            const mealLabel  = MEAL_LABELS[entry.meal_type] ?? entry.meal_type
            const entryTitle = entry.recipe
              ? `${entry.recipe.name}${entry.servings != null && entry.servings !== 1 ? ` × ${entry.servings}` : ''}`
              : entry.ingredient
              ? entry.ingredient.name_en
              : '—'

            const headerText = showMealType
              ? `${mealLabel} — ${entryTitle}`
              : entryTitle

            const hasOverrides = (entry.overrides?.length ?? 0) > 0

            return (
              <Fragment key={entry.id}>
                {/* Entry header */}
                <tr className="bg-indigo-50">
                  <td
                    colSpan={2 + NUTR_COLS.length}
                    className="sticky left-0 py-1.5 pl-3 pr-2 font-semibold text-indigo-700 bg-indigo-50"
                  >
                    {headerText}
                    {hasOverrides && (
                      <span className="ml-2 text-[10px] font-normal text-primary-500">
                        ✎ {entry.overrides.length} mod.
                      </span>
                    )}
                  </td>
                </tr>

                {/* Ingredient rows */}
                {rows.map((row, ri) => (
                  <tr
                    key={`${entry.id}-${ri}`}
                    className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td
                      className={`sticky left-0 py-1.5 pl-4 pr-2 text-gray-700 ${
                        ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {row.name}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-gray-600">
                      {units === 'oz'
                        ? (row.qty / 28.3495).toFixed(1)
                        : Math.round(row.qty)}
                    </td>
                    {NUTR_COLS.map((c) => (
                      <td
                        key={c.key}
                        className="py-1.5 px-2 text-right tabular-nums text-gray-700"
                      >
                        {row.nutr[c.key].toFixed(c.dec)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Subtotal row (only if >1 ingredient) */}
                {rows.length > 1 && (
                  <tr className="border-t border-gray-200 bg-orange-50 font-semibold">
                    <td className="sticky left-0 bg-orange-50 py-1.5 pl-4 pr-2 text-orange-800">
                      Subtotal
                    </td>
                    <td className="py-1.5 px-2" />
                    {NUTR_COLS.map((c) => (
                      <td
                        key={c.key}
                        className="py-1.5 px-2 text-right tabular-nums text-orange-800"
                      >
                        {subtotal[c.key].toFixed(c.dec)}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Spacer between entries */}
                {ei < entries.length - 1 && (
                  <tr>
                    <td
                      colSpan={2 + NUTR_COLS.length}
                      className="py-0.5 bg-gray-100"
                    />
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
                <td className="sticky left-0 bg-emerald-50 py-2 pl-3 pr-2 text-emerald-900">
                  TOTAL
                </td>
                <td className="py-2 px-2" />
                {NUTR_COLS.map((c) => (
                  <td
                    key={c.key}
                    className="py-2 px-2 text-right tabular-nums text-emerald-900"
                  >
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
