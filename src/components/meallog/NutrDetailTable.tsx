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
  | 'saturated_fat_g'
  | 'fiber_g'
  | 'iron_mg'
  | 'calcium_mg'
  | 'zinc_mg'
  | 'magnesium_mg'
  | 'potassium_mg'
  | 'sodium_mg'
  | 'selenium_mcg'
  | 'vit_a_rae_mcg'
  | 'vit_b6_mg'
  | 'vit_b12_mcg'
  | 'vit_c_mg'
  | 'vit_d_mcg'
  | 'vit_e_mg'
  | 'vit_k_mcg'
  | 'folate_mcg'
  | 'choline_mg'
  | 'omega3_g'

export type NutrValues = Record<NutrKey, number>
export type IngRow = { name: string; qty: number; nutr: NutrValues }

// ── Column definitions ────────────────────────────────────────────────────────

export type NutrColDef = {
  key:   NutrKey
  label: string
  unit:  string
  dec:   number
  group: 'macro' | 'fat' | 'mineral' | 'vitamin'
}

export const NUTR_COLS: NutrColDef[] = [
  { key: 'cal',             label: 'Cal',    unit: '',   dec: 0, group: 'macro'   },
  { key: 'protein_g',       label: 'Prot',   unit: 'g',  dec: 1, group: 'macro'   },
  { key: 'carbs_g',         label: 'Carbs',  unit: 'g',  dec: 1, group: 'macro'   },
  { key: 'fat_g',           label: 'Grasa',  unit: 'g',  dec: 1, group: 'macro'   },
  { key: 'saturated_fat_g', label: 'G.Sat',  unit: 'g',  dec: 1, group: 'fat'     },
  { key: 'fiber_g',         label: 'Fibra',  unit: 'g',  dec: 1, group: 'macro'   },
  { key: 'omega3_g',        label: 'Ω3',     unit: 'g',  dec: 2, group: 'fat'     },
  { key: 'iron_mg',         label: 'Fe',     unit: 'mg', dec: 1, group: 'mineral' },
  { key: 'calcium_mg',      label: 'Ca',     unit: 'mg', dec: 0, group: 'mineral' },
  { key: 'zinc_mg',         label: 'Zn',     unit: 'mg', dec: 1, group: 'mineral' },
  { key: 'magnesium_mg',    label: 'Mg',     unit: 'mg', dec: 0, group: 'mineral' },
  { key: 'potassium_mg',    label: 'K',      unit: 'mg', dec: 0, group: 'mineral' },
  { key: 'sodium_mg',       label: 'Na',     unit: 'mg', dec: 0, group: 'mineral' },
  { key: 'selenium_mcg',    label: 'Se',     unit: 'μg', dec: 1, group: 'mineral' },
  { key: 'vit_a_rae_mcg',   label: 'Vit A',  unit: 'μg', dec: 0, group: 'vitamin' },
  { key: 'vit_b6_mg',       label: 'B6',     unit: 'mg', dec: 2, group: 'vitamin' },
  { key: 'vit_b12_mcg',     label: 'B12',    unit: 'μg', dec: 2, group: 'vitamin' },
  { key: 'vit_c_mg',        label: 'C',      unit: 'mg', dec: 0, group: 'vitamin' },
  { key: 'vit_d_mcg',       label: 'Vit D',  unit: 'μg', dec: 2, group: 'vitamin' },
  { key: 'vit_e_mg',        label: 'Vit E',  unit: 'mg', dec: 1, group: 'vitamin' },
  { key: 'vit_k_mcg',       label: 'Vit K',  unit: 'μg', dec: 0, group: 'vitamin' },
  { key: 'folate_mcg',      label: 'Folato', unit: 'μg', dec: 0, group: 'vitamin' },
  { key: 'choline_mg',      label: 'Colina', unit: 'mg', dec: 0, group: 'vitamin' },
]

// ── Zero & helpers ────────────────────────────────────────────────────────────

export const ZERO_NUTR: NutrValues = {
  cal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, saturated_fat_g: 0, fiber_g: 0,
  iron_mg: 0, calcium_mg: 0, zinc_mg: 0, magnesium_mg: 0,
  potassium_mg: 0, sodium_mg: 0, selenium_mcg: 0,
  vit_a_rae_mcg: 0, vit_b6_mg: 0, vit_b12_mcg: 0, vit_c_mg: 0,
  vit_d_mcg: 0, vit_e_mg: 0, vit_k_mcg: 0,
  folate_mcg: 0, choline_mg: 0, omega3_g: 0,
}

type AnyIngr = Partial<Record<NutrKey, number | null | undefined>>

export function computeNutr(ingr: IngredientNutrients, qty: number): NutrValues {
  const i = ingr as AnyIngr
  const f = qty / 100
  return {
    cal:             (i.cal             ?? 0) * f,
    protein_g:       (i.protein_g       ?? 0) * f,
    carbs_g:         (i.carbs_g         ?? 0) * f,
    fat_g:           (i.fat_g           ?? 0) * f,
    saturated_fat_g: (i.saturated_fat_g ?? 0) * f,
    fiber_g:         (i.fiber_g         ?? 0) * f,
    iron_mg:         (i.iron_mg         ?? 0) * f,
    calcium_mg:      (i.calcium_mg      ?? 0) * f,
    zinc_mg:         (i.zinc_mg         ?? 0) * f,
    magnesium_mg:    (i.magnesium_mg    ?? 0) * f,
    potassium_mg:    (i.potassium_mg    ?? 0) * f,
    sodium_mg:       (i.sodium_mg       ?? 0) * f,
    selenium_mcg:    (i.selenium_mcg    ?? 0) * f,
    vit_a_rae_mcg:   (i.vit_a_rae_mcg   ?? 0) * f,
    vit_b6_mg:       (i.vit_b6_mg       ?? 0) * f,
    vit_b12_mcg:     (i.vit_b12_mcg     ?? 0) * f,
    vit_c_mg:        (i.vit_c_mg        ?? 0) * f,
    vit_d_mcg:       (i.vit_d_mcg       ?? 0) * f,
    vit_e_mg:        (i.vit_e_mg        ?? 0) * f,
    vit_k_mcg:       (i.vit_k_mcg       ?? 0) * f,
    folate_mcg:      (i.folate_mcg      ?? 0) * f,
    choline_mg:      (i.choline_mg      ?? 0) * f,
    omega3_g:        (i.omega3_g        ?? 0) * f,
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
    return [{ name: entry.ingredient.name_en, qty: entry.quantity_g, nutr: computeNutr(entry.ingredient, entry.quantity_g) }]
  }
  if (entry.user_ingredient && entry.quantity_g != null) {
    const ui = entry.user_ingredient
    const src = {
      id: ui.id, name_en: ui.name_en,
      cal: ui.cal ?? 0, protein_g: ui.protein_g ?? 0, carbs_g: ui.carbs_g ?? 0,
      fat_g: ui.fat_g ?? 0, saturated_fat_g: ui.saturated_fat_g ?? 0, fiber_g: ui.fiber_g ?? 0,
      iron_mg: ui.iron_mg ?? 0, calcium_mg: ui.calcium_mg ?? 0, zinc_mg: ui.zinc_mg ?? 0,
      magnesium_mg: ui.magnesium_mg ?? 0, potassium_mg: ui.potassium_mg ?? 0, sodium_mg: ui.sodium_mg ?? 0,
      selenium_mcg: (ui as AnyIngr).selenium_mcg ?? 0,
      vit_a_rae_mcg: (ui as AnyIngr).vit_a_rae_mcg ?? 0,
      vit_b6_mg: (ui as AnyIngr).vit_b6_mg ?? 0,
      vit_b12_mcg: ui.vit_b12_mcg ?? 0, vit_c_mg: ui.vit_c_mg ?? 0, vit_d_mcg: ui.vit_d_mcg ?? 0,
      vit_e_mg: (ui as AnyIngr).vit_e_mg ?? 0, vit_k_mcg: (ui as AnyIngr).vit_k_mcg ?? 0,
      folate_mcg: (ui as AnyIngr).folate_mcg ?? 0, choline_mg: (ui as AnyIngr).choline_mg ?? 0,
      omega3_g: ui.omega3_g ?? 0,
    } as IngredientNutrients
    return [{ name: ui.name_en, qty: entry.quantity_g, nutr: computeNutr(src, entry.quantity_g) }]
  }
  if (entry.recipe && entry.servings != null) {
    const scale  = entry.servings / entry.recipe.servings
    const ovMap  = new Map<string, MealLogOverride>(entry.overrides.map((o) => [o.ingredient_id, o]))
    const baseIngIds = new Set(entry.recipe.recipe_ingredients.map((ri) => ri.ingredient.id))

    const baseRows = entry.recipe.recipe_ingredients
      .filter((ri) => !ovMap.get(ri.ingredient.id)?.excluded)
      .map((ri) => {
        const ov  = ovMap.get(ri.ingredient.id)
        const qty = ov?.quantity_g != null ? ov.quantity_g : ri.quantity_g * scale
        return { name: ri.ingredient.name_en, qty, nutr: computeNutr(ri.ingredient, qty) }
      })

    const extraRows = entry.overrides
      .filter((o) => !o.excluded && !baseIngIds.has(o.ingredient_id) && o.quantity_g != null && o.ingredient)
      .map((o) => ({ name: o.ingredient!.name_en, qty: o.quantity_g!, nutr: computeNutr(o.ingredient!, o.quantity_g!) }))

    return [...baseRows, ...extraRows]
  }
  return []
}

// ── Group header colors ───────────────────────────────────────────────────────

const GROUP_BG: Record<NutrColDef['group'], string> = {
  macro:   'bg-sky-50',
  fat:     'bg-amber-50',
  mineral: 'bg-emerald-50',
  vitamin: 'bg-violet-50',
}

// ── NutrTable component ───────────────────────────────────────────────────────

interface NutrTableProps {
  entries:       MealLogDetail[]
  units:         UnitSystem
  showMealType?: boolean
  showGroups?:   boolean
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

export function NutrTable({ entries, units, showMealType = true, showGroups = false }: NutrTableProps) {
  if (entries.length === 0) {
    return <p className="py-4 text-center text-xs text-gray-400">Sin entradas</p>
  }

  const totalRows: NutrValues[] = []

  // Build group spans for optional group header row
  const groupSpans: { group: NutrColDef['group']; label: string; span: number }[] = []
  for (const col of NUTR_COLS) {
    const last = groupSpans[groupSpans.length - 1]
    const label =
      col.group === 'macro'   ? 'Macros'    :
      col.group === 'fat'     ? 'Grasas/Ω3' :
      col.group === 'mineral' ? 'Minerales' : 'Vitaminas'
    if (last && last.group === col.group) { last.span++ }
    else { groupSpans.push({ group: col.group, label, span: 1 }) }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs">
        <thead>
          {showGroups && (
            <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              <th className="sticky left-0 z-10 bg-gray-100 py-1 pl-3 pr-2 text-left" colSpan={2} />
              {groupSpans.map((gs, i) => (
                <th key={`${gs.group}-${i}`} colSpan={gs.span} className={`py-1 px-2 text-center ${GROUP_BG[gs.group]}`}>
                  {gs.label}
                </th>
              ))}
            </tr>
          )}
          <tr className="bg-gray-50 text-gray-500">
            <th className="sticky left-0 z-10 bg-gray-50 py-2 pl-3 pr-2 text-left font-medium">Ingrediente</th>
            <th className="py-2 px-2 text-right font-medium">{units === 'oz' ? 'oz' : 'g'}</th>
            {NUTR_COLS.map((c) => (
              <th key={c.key} className={`py-2 px-2 text-right font-medium whitespace-nowrap ${showGroups ? GROUP_BG[c.group] : ''}`}>
                {c.label}{c.unit ? <span className="font-normal text-gray-400"> {c.unit}</span> : null}
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
              : entry.ingredient     ? entry.ingredient.name_en
              : entry.user_ingredient ? entry.user_ingredient.name_en : '—'

            const headerText   = showMealType ? `${mealLabel} — ${entryTitle}` : entryTitle
            const hasOverrides = (entry.overrides?.length ?? 0) > 0

            return (
              <Fragment key={entry.id}>
                <tr className="bg-indigo-50">
                  <td colSpan={2 + NUTR_COLS.length} className="sticky left-0 py-1.5 pl-3 pr-2 font-semibold text-indigo-700 bg-indigo-50">
                    {headerText}
                    {hasOverrides && (
                      <span className="ml-2 text-[10px] font-normal text-primary-500">✎ {entry.overrides.length} mod.</span>
                    )}
                  </td>
                </tr>
                {rows.map((row, ri) => (
                  <tr key={`${entry.id}-${ri}`} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className={`sticky left-0 py-1.5 pl-4 pr-2 text-gray-700 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {row.name}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-gray-600">
                      {units === 'oz' ? (row.qty / 28.3495).toFixed(1) : Math.round(row.qty)}
                    </td>
                    {NUTR_COLS.map((c) => (
                      <td key={c.key} className="py-1.5 px-2 text-right tabular-nums text-gray-700">
                        {row.nutr[c.key].toFixed(c.dec)}
                      </td>
                    ))}
                  </tr>
                ))}
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
                {ei < entries.length - 1 && (
                  <tr><td colSpan={2 + NUTR_COLS.length} className="py-0.5 bg-gray-100" /></tr>
                )}
              </Fragment>
            )
          })}
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
