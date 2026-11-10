import type { Category, MealType, Currency } from '@/types/domain'

/** Recommended Daily Allowance per nutrient (adult reference values). */
export const RDA: Record<string, number> = {
  cal: 2000,
  protein_g: 50,
  carbs_g: 275,
  fat_g: 78,
  fiber_g: 28,
  iron_mg: 18,
  calcium_mg: 1000,
  zinc_mg: 11,
  vit_b12_mcg: 2.4,
  vit_d_mcg: 15,
  vit_c_mg: 90,
  omega3_g: 1.6,
  // extended nutrients
  potassium_mg: 4700,
  sodium_mg: 2300,
  selenium_mcg: 55,
  vit_a_rae_mcg: 900,
  folate_mcg: 400,
  magnesium_mg: 420,
  vit_k_mcg: 120,
  vit_e_mg: 15,
  vit_b6_mg: 1.7,
  choline_mg: 550,
  // Saturated fat — WHO upper limit: <10% of 2 000 kcal = ~22 g
  saturated_fat_g: 22,
}

/** Ingredient categories with their i18n label keys. */
export const CATEGORIES: { value: Category; labelKey: string }[] = [
  { value: 'fruits', labelKey: 'ingredient.category.fruits' },
  { value: 'vegetables', labelKey: 'ingredient.category.vegetables' },
  { value: 'grains', labelKey: 'ingredient.category.grains' },
  { value: 'legumes', labelKey: 'ingredient.category.legumes' },
  { value: 'proteins', labelKey: 'ingredient.category.proteins' },
  { value: 'seeds', labelKey: 'ingredient.category.seeds' },
  { value: 'other', labelKey: 'ingredient.category.other' },
]

/** Meal types with their i18n label keys. */
export const MEAL_TYPES: { value: MealType; labelKey: string }[] = [
  { value: 'breakfast', labelKey: 'meallog.breakfast' },
  { value: 'lunch', labelKey: 'meallog.lunch' },
  { value: 'dinner', labelKey: 'meallog.dinner' },
  { value: 'snack', labelKey: 'meallog.snack' },
]

/** Supported currencies. */
export const CURRENCIES: Currency[] = ['PEN', 'ARS', 'USD', 'EUR', 'INR', 'BRL', 'JPY']

// ── Nutrient classification ──────────────────────────────────────────────────

/**
 * How to interpret each nutrient's reference value:
 * - 'min_only'   → only a minimum target exists (no UL); deficit is bad, excess is neutral
 * - 'range_amdr' → AMDR macro; both deficit AND soft excess are flagged (no hard UL)
 * - 'range_ul'   → hard Tolerable Upper Intake Level (NIH); deficit AND excess are clinically relevant
 */
export type NutrientRole = 'min_only' | 'range_amdr' | 'range_ul'

export const NUTRIENT_ROLE: Record<string, NutrientRole> = {
  cal:         'range_amdr',
  protein_g:   'min_only',
  carbs_g:     'range_amdr',
  fat_g:       'range_amdr',
  fiber_g:     'min_only',
  iron_mg:     'range_ul',
  calcium_mg:  'range_ul',
  zinc_mg:     'range_ul',
  vit_b12_mcg: 'min_only',
  vit_d_mcg:   'range_ul',
  vit_c_mg:    'range_ul',
  omega3_g:    'min_only',
  // extended
  potassium_mg:   'min_only',
  sodium_mg:      'range_ul',
  selenium_mcg:   'range_ul',
  magnesium_mg:   'min_only',
  vit_a_rae_mcg:  'range_ul',
  folate_mcg:     'range_ul',
  vit_k_mcg:      'min_only',
  vit_e_mg:       'range_ul',
  vit_b6_mg:      'range_ul',
  choline_mg:     'range_ul',
  saturated_fat_g:'range_amdr',
}

/**
 * Tolerable Upper Intake Levels (NIH/National Academies, adults 19-70).
 * Absolute values in the same unit as the nutrient.
 * Note: calcium UL is 2500 mg for adults < 51 y, 2000 mg for ≥ 51 y.
 */
export const NUTRIENT_UL: Partial<Record<string, number>> = {
  iron_mg:        45,
  calcium_mg:     2500,   // conservative; use 2000 for age ≥ 51
  zinc_mg:        40,
  vit_d_mcg:      100,    // 4 000 IU
  vit_c_mg:       2000,
  sodium_mg:      2300,
  selenium_mcg:   400,
  vit_a_rae_mcg:  3000,
  folate_mcg:     1000,
  vit_e_mg:       1000,
  vit_b6_mg:      100,
  choline_mg:     3500,
}
