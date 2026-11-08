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
  ingredientMap: Map<string, Ingredient>
): Record<NutritionKey, number> {
  const totals = Object.fromEntries(
    NUTRITION_KEYS.map((key) => [key, 0])
  ) as Record<NutritionKey, number>

  for (const log of logs) {
    if (log.recipe_id && log.servings) {
      const nutrition = recipeNutritionMap.get(log.recipe_id)
      if (nutrition) {
        const totalServings = recipeServingsMap.get(log.recipe_id) ?? 1
        for (const key of NUTRITION_KEYS) {
          totals[key] += (nutrition[key] / totalServings) * log.servings
        }
      }
    }

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
  nutrition: Record<NutritionKey, number>
): Record<NutritionKey, number> {
  const result = {} as Record<NutritionKey, number>

  for (const key of NUTRITION_KEYS) {
    result[key] = Math.min(150, (nutrition[key] / RDA[key]) * 100)
  }

  return result
}
