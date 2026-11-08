'use client'

import { useTranslations } from 'next-intl'
import { RDA } from '@/constants/nutrition'
import type { Ingredient } from '@/types/domain'

const UNITS: Record<string, string> = {
  cal: 'kcal',
  protein_g: 'g',
  carbs_g: 'g',
  fat_g: 'g',
  fiber_g: 'g',
  iron_mg: 'mg',
  calcium_mg: 'mg',
  zinc_mg: 'mg',
  vit_b12_mcg: 'µg',
  vit_d_mcg: 'µg',
  vit_c_mg: 'mg',
  omega3_g: 'g',
}

const NUTRIENT_KEYS = Object.keys(UNITS)

const T_KEY: Record<string, string> = {
  cal: 'calories',
  protein_g: 'protein',
  carbs_g: 'carbs',
  fat_g: 'fat',
  fiber_g: 'fiber',
  iron_mg: 'iron',
  calcium_mg: 'calcium',
  zinc_mg: 'zinc',
  vit_b12_mcg: 'vit_b12',
  vit_d_mcg: 'vit_d',
  vit_c_mg: 'vit_c',
  omega3_g: 'omega3',
}

export default function NutritionCard({
  ingredient,
  grams = 100,
  label,
}: {
  ingredient: Ingredient
  grams?: number
  label?: string
}) {
  const t = useTranslations('nutrition')

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{ingredient.name}</h2>
      <p className="mb-4 text-sm text-gray-500">{label ?? `per ${grams}g`}</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {NUTRIENT_KEYS.map((key) => {
          const raw = ((ingredient[key as keyof Ingredient] as number) * grams) / 100
          const rdaPct = Math.min(100, (raw / RDA[key]) * 100)

          return (
            <div key={key}>
              <p className="text-xs uppercase tracking-wide text-gray-500">{t(T_KEY[key])}</p>
              <p className="text-sm font-medium text-gray-900">
                {raw.toFixed(1)} {UNITS[key]}
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-gray-100">
                <div className="h-1.5 rounded bg-green-400" style={{ width: `${rdaPct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
