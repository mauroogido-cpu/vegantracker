'use client'

import { useMemo, useState } from 'react'
import IngredientDetailModal from '@/components/ingredients/IngredientDetailModal'
import { RDA } from '@/constants/nutrition'
import type { Ingredient } from '@/types/domain'

const VEGAN_CRITICAL = [
  {
    key: 'vit_b12_mcg',
    label: 'Vitamina B12',
    unit: 'µg',
    why: 'No se encuentra en plantas; suplementación esencial.',
  },
  {
    key: 'vit_d_mcg',
    label: 'Vitamina D',
    unit: 'µg',
    why: 'Síntesis solar limitada en interiores; pocas fuentes vegetales.',
  },
  {
    key: 'calcium_mg',
    label: 'Calcio',
    unit: 'mg',
    why: 'Crítico para huesos; biodisponibilidad variable en vegetales.',
  },
  {
    key: 'omega3_g',
    label: 'Omega-3',
    unit: 'g',
    why: 'ALA abundante en semillas; conversión a EPA/DHA es baja.',
  },
  {
    key: 'zinc_mg',
    label: 'Zinc',
    unit: 'mg',
    why: 'Fitatos en legumbres reducen absorción; requiere variedad.',
  },
  {
    key: 'iron_mg',
    label: 'Hierro',
    unit: 'mg',
    why: 'Hierro no hemo de plantas absorbe menos que el hemo animal.',
  },
] as const

type CriticalKey = (typeof VEGAN_CRITICAL)[number]['key']

export default function VeganCriticalView({ ingredients }: { ingredients: Ingredient[] }) {
  const [selected, setSelected] = useState<Ingredient | null>(null)

  const topByNutrient = useMemo(() => {
    const map = new Map<CriticalKey, Ingredient[]>()
    for (const nutrient of VEGAN_CRITICAL) {
      map.set(
        nutrient.key,
        [...ingredients].sort((a, b) => b[nutrient.key] - a[nutrient.key]).slice(0, 5)
      )
    }
    return map
  }, [ingredients])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {VEGAN_CRITICAL.map((nutrient) => (
        <section
          key={nutrient.key}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-900">
            {nutrient.label} (RDA: {RDA[nutrient.key]} {nutrient.unit})
          </h3>
          <p className="mt-1 text-xs text-gray-500">{nutrient.why}</p>

          <hr className="my-3 border-gray-100" />

          <ul className="space-y-1">
            {(topByNutrient.get(nutrient.key) ?? []).map((ingredient) => (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onClick={() => setSelected(ingredient)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left transition hover:bg-gray-50"
                >
                  <span className="truncate text-sm text-gray-800">{ingredient.name}</span>
                  <span className="shrink-0 text-xs font-medium text-gray-600">
                    {ingredient[nutrient.key].toFixed(1)} {nutrient.unit}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selected && (
        <IngredientDetailModal ingredient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
