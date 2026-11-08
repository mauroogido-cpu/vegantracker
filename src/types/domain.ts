export type Category = 'fruits' | 'vegetables' | 'grains' | 'legumes' | 'proteins' | 'seeds' | 'other'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Currency = 'PEN' | 'ARS' | 'USD' | 'EUR' | 'INR' | 'BRL' | 'JPY'
export type Locale = 'en' | 'es' | 'pt-BR' | 'ja'

export type User = {
  id: string
  email: string
  created_at: string
}

export type Ingredient = {
  id: string
  name: string        // from ingredient_translations.name (joined)
  name_en: string     // fallback, direct column
  category: string
  fdc_id: number | null
  created_at: string
  // nutrition per 100g — exact DB column names
  cal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  iron_mg: number
  calcium_mg: number
  zinc_mg: number
  vit_b12_mcg: number
  vit_d_mcg: number
  vit_c_mg: number
  omega3_g: number
}

export type IngredientCost = {
  id: string
  ingredient_id: string
  user_id: string
  price: number
  quantity_g: number
  price_per_100g: number
  currency: string
  store: string | null
  purchased_at: string | null
  created_at: string
}

export type Recipe = {
  id: string
  user_id: string
  name: string
  description: string
  servings: number
  category: string
  is_public: boolean
  source_recipe_id: string | null
  prep_time_min: number | null
  instructions: string | null
  created_at: string
  updated_at: string
}

export type RecipeIngredient = {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity_g: number
  notes: string | null
  sort_order: number
  // joined fields (populated by API, not in DB)
  ingredient?: Ingredient
}

export type MealLog = {
  id: string
  user_id: string
  logged_at: string        // date string YYYY-MM-DD
  meal_type: string
  recipe_id: string | null
  ingredient_id: string | null
  servings: number | null
  quantity_g: number | null
  notes: string | null
  created_at: string
}

export interface NutritionTotals {
  cal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  iron_mg: number
  calcium_mg: number
  zinc_mg: number
  vit_b12_mcg: number
  vit_d_mcg: number
  vit_c_mg: number
  omega3_g: number
}

export interface DayNutrition {
  date: string
  totals: NutritionTotals
  cost?: number
  currency?: Currency
}
