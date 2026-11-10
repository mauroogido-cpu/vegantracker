import { RDA } from '@/constants/nutrition'
import type { Ingredient, MealLog, RecipeIngredient } from '@/types/domain'

export const NUTRITION_KEYS = [
  'cal',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
  'iron_mg',
  'calcium_mg',
  'zinc_mg',
  'vit_b12_mcg',
  'vit_d_mcg',
  'vit_c_mg',
  'omega3_g',
  'potassium_mg',
  'sodium_mg',
  'selenium_mcg',
  'vit_a_rae_mcg',
  'folate_mcg',
  'magnesium_mg',
  'vit_k_mcg',
  'vit_e_mg',
  'vit_b6_mg',
  'choline_mg',
  'saturated_fat_g',
] as const

export type NutritionKey = (typeof NUTRITION_KEYS)[number]

export function calcRecipeNutrition(
  items: RecipeIngredient[]
): Record<NutritionKey, number> {
  const totals = Object.fromEntries(
    NUTRITION_KEYS.map((key) => [key, 0])
  ) as Record<NutritionKey, number>

  for (const item of items) {
    if (!item.ingredient) continue
    for (const key of NUTRITION_KEYS) {
      totals[key] += (item.ingredient[key] * item.quantity_g) / 100
    }
  }

  return totals
}

export function calcRecipeCost(
  items: RecipeIngredient[],
  costMap: Map<string, number>
): number {
  let total = 0

  for (const item of items) {
    total += ((costMap.get(item.ingredient_id) ?? 0) * item.quantity_g) / 100
  }

  return total
}

export function calcDayNutrition(
  logs: MealLog[],
  recipeNutritionMap: Map<string, Record<NutritionKey, number>>,
  recipeServingsMap: Map<string, number>,
  ingredientMap: Map<string, Ingredient>,
  // Map of recipe_id → its RecipeIngredient list (with ingredient joined).
  // Required to apply per-ingredient overrides. Pass an empty Map when
  // overrides are not needed (e.g. dashboard summaries without detail).
  recipeIngredientsMap: Map<string, RecipeIngredient[]> = new Map()
): Record<NutritionKey, number> {
  const totals = Object.fromEntries(
    NUTRITION_KEYS.map((key) => [key, 0])
  ) as Record<NutritionKey, number>

  for (const log of logs) {
    // ── Recipe entry ──────────────────────────────────────────────────────
    if (log.recipe_id && log.servings) {
      const recipeItems = recipeIngredientsMap.get(log.recipe_id)
      const hasOverrides = (log.overrides?.length ?? 0) > 0

      if (recipeItems && (hasOverrides || recipeItems.length > 0)) {
        // Build a lookup of overrides by ingredient_id for O(1) access
        const overrideMap = new Map(
          (log.overrides ?? []).map((o) => [o.ingredient_id, o])
        )
        const recipeServings = recipeServingsMap.get(log.recipe_id) ?? 1
        const servingsRatio  = log.servings / recipeServings

        for (const ri of recipeItems) {
          if (!ri.ingredient) continue
          const override = overrideMap.get(ri.ingredient_id)

          // Skip if explicitly excluded this entry
          if (override?.excluded) continue

          // Use override quantity if present, else scale the recipe default
          const qty = override?.quantity_g ?? ri.quantity_g * servingsRatio

          for (const key of NUTRITION_KEYS) {
            totals[key] += (ri.ingredient[key] * qty) / 100
          }
        }

        // Extra ingredients (overrides whose ingredient_id is not in the recipe)
        const recipeIngredientIds = new Set(recipeItems.map((ri) => ri.ingredient_id))
        for (const override of log.overrides ?? []) {
          if (override.excluded || recipeIngredientIds.has(override.ingredient_id)) continue
          if (!override.quantity_g) continue
          const ingredient = ingredientMap.get(override.ingredient_id)
          if (!ingredient) continue
          for (const key of NUTRITION_KEYS) {
            totals[key] += (ingredient[key] * override.quantity_g) / 100
          }
        }
      } else {
        // Fallback: no recipeItems loaded — use the pre-computed recipe nutrition
        const nutrition = recipeNutritionMap.get(log.recipe_id)
        if (nutrition) {
          const totalServings = recipeServingsMap.get(log.recipe_id) ?? 1
          for (const key of NUTRITION_KEYS) {
            totals[key] += (nutrition[key] / totalServings) * log.servings
          }
        }
      }
    }

    // ── Loose ingredient entry ────────────────────────────────────────────
    if (log.ingredient_id && log.quantity_g) {
      const ingredient = ingredientMap.get(log.ingredient_id)
      if (ingredient) {
        for (const key of NUTRITION_KEYS) {
          totals[key] += (ingredient[key] * log.quantity_g) / 100
        }
      }
    }
  }

  return totals
}

export function calcRdaPercent(
  nutrition: Record<NutritionKey, number>,
  rda: Record<string, number> = RDA
): Record<NutritionKey, number> {
  const result = {} as Record<NutritionKey, number>

  for (const key of NUTRITION_KEYS) {
    const ref = (rda[key] as number | undefined) ?? RDA[key]
    result[key] = Math.min(150, (nutrition[key] / ref) * 100)
  }

  return result
}

// ── Unified nutrient status ───────────────────────────────────────────────────
// Single source of truth for color logic used by Dashboard, HistoryView,
// and any future component. Applies role-aware thresholds:
//
//   min_only   → only deficit matters  (protein, fiber, B12, omega-3)
//   range_amdr → soft min + soft max   (cal, carbs, fat — AMDR-based)
//   range_ul   → deficit + hard UL     (iron, calcium, zinc, vit D, C …)

import { NUTRIENT_ROLE, NUTRIENT_UL } from '@/constants/nutrition'

export type StatusLabel = 'low' | 'below' | 'good' | 'high' | 'excess'

export interface NutrientStatus {
  bar:   string       // Tailwind bg-* for filled bars   (Dashboard)
  dot:   string       // Tailwind bg-* for small circles (HistoryView)
  label: StatusLabel
}

/**
 * Returns the colour + semantic label for a nutrient value.
 *
 * @param value    - absolute amount consumed
 * @param rda      - personalised RDA for this user (from useRDA)
 * @param key      - nutrient key, e.g. 'iron_mg'
 */
export function nutrientStatus(
  value: number,
  rda: number,
  key: string
): NutrientStatus {
  const role = NUTRIENT_ROLE[key] ?? 'min_only'
  const ul   = NUTRIENT_UL[key]
  const rdaPct = rda > 0 ? (value / rda) * 100 : 0

  // ── 1. Hard upper limit (range_ul only) ───────────────────────────────────
  if (role === 'range_ul' && ul !== undefined) {
    if (value > ul)       return { bar: 'bg-red-500',    dot: 'bg-red-500',    label: 'excess' }
    if (value > ul * 0.8) return { bar: 'bg-orange-400', dot: 'bg-orange-400', label: 'high'   }
  }

  // ── 2. Deficit check (all roles) ─────────────────────────────────────────
  if (rdaPct < 50) return { bar: 'bg-red-400',   dot: 'bg-red-400',   label: 'low'   }
  if (rdaPct < 80) return { bar: 'bg-amber-400', dot: 'bg-yellow-400', label: 'below' }

  // ── 3. Soft upper (range_amdr: cal, carbs, fat) ───────────────────────────
  if (role === 'range_amdr') {
    if (rdaPct > 150) return { bar: 'bg-red-400',    dot: 'bg-orange-400', label: 'high' }
    if (rdaPct > 120) return { bar: 'bg-amber-400',  dot: 'bg-orange-400', label: 'high' }
  }

  // ── 4. Good range ─────────────────────────────────────────────────────────
  return { bar: 'bg-green-400', dot: 'bg-green-500', label: 'good' }
}

// Keep legacy bar/dot helpers for any external callers not yet migrated
export function nutrientBarColor(percent: number): string {
  if (percent < 50) return 'bg-red-400'
  if (percent < 80) return 'bg-amber-400'
  if (percent <= 130) return 'bg-green-400'
  return 'bg-amber-400'
}
export function nutrientDotColor(percent: number): string {
  if (percent < 50) return 'bg-red-400'
  if (percent < 80) return 'bg-yellow-400'
  if (percent <= 130) return 'bg-green-500'
  return 'bg-orange-400'
}
