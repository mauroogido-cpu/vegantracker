'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import IngredientSearch from '@/components/ingredients/IngredientSearch'
import NutritionCard from '@/components/ingredients/NutritionCard'
import type { Ingredient } from '@/types/domain'

export default function IngredientsPage() {
  const t = useTranslations('ingredient')
  const [selected, setSelected] = useState<Ingredient | null>(null)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t('title')}</h1>

      <IngredientSearch onSelect={setSelected} />

      {selected && (
        <div className="mt-6">
          <NutritionCard ingredient={selected} grams={100} />
        </div>
      )}
    </div>
  )
}
