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
