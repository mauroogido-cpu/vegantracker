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
  // extended nutrients
  potassium_mg: number
  sodium_mg: number
  selenium_mcg: number
  vit_a_rae_mcg: number
  folate_mcg: number
  magnesium_mg: number
  vit_k_mcg: number
  vit_e_mg: number
  vit_b6_mg: number
  choline_mg: number
  saturated_fat_g: number
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

export type MealLogOverride = {
  id: string
  meal_log_id: string
  ingredient_id: string
  quantity_g: number | null   // null when excluded = true
  excluded: boolean
}

export type OverrideInput = Pick<MealLogOverride, 'ingredient_id' | 'quantity_g' | 'excluded'>

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
  overrides?: MealLogOverride[]   // populated by getDayLog via JOIN
}


export type DayHistorySummary = {
  logged_at:   string   // YYYY-MM-DD
  entry_count: number
  cal:         number
  protein_g:   number
  carbs_g:     number
  fat_g:       number
  fiber_g:     number
  iron_mg:     number
  calcium_mg:  number
  zinc_mg:     number
  vit_b12_mcg: number
  vit_d_mcg:   number
  vit_c_mg:    number
  omega3_g:    number
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
  // extended nutrients
  potassium_mg: number
  sodium_mg: number
  selenium_mcg: number
  vit_a_rae_mcg: number
  folate_mcg: number
  magnesium_mg: number
  vit_k_mcg: number
  vit_e_mg: number
  vit_b6_mg: number
  choline_mg: number
  saturated_fat_g: number
}

export interface DayNutrition {
  date: string
  totals: NutritionTotals
  cost?: number
  currency?: Currency
}

// --- Detail types for expandable history ---

export type IngredientNutrients = {
  id: string
  name_en: string
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
  saturated_fat_g: number
}

export type RecipeIngredientDetail = {
  id: string
  quantity_g: number
  sort_order: number
  ingredient: IngredientNutrients
}

export type RecipeDetail = {
  id: string
  name: string
  servings: number
  recipe_ingredients: RecipeIngredientDetail[]
}

export type MealLogDetail = {
  id: string
  user_id: string
  logged_at: string
  meal_type: string
  recipe_id: string | null
  ingredient_id: string | null
  servings: number | null
  quantity_g: number | null
  notes: string | null
  created_at: string
  ingredient: IngredientNutrients | null
  recipe: RecipeDetail | null
  overrides: MealLogOverride[]
}
