'use client'

import { useMemo, useState } from 'react'
import IngredientDetailModal from '@/components/ingredients/IngredientDetailModal'
import type { Ingredient } from '@/types/domain'

const NUTRIENTS = [
  { key: 'protein_g', label: 'Proteína', unit: 'g' },
  { key: 'cal', label: 'Calorías', unit: 'kcal' },
  { key: 'fiber_g', label: 'Fibra', unit: 'g' },
  { key: 'iron_mg', label: 'Hierro', unit: 'mg' },
  { key: 'calcium_mg', label: 'Calcio', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'omega3_g', label: 'Omega-3', unit: 'g' },
  { key: 'vit_b12_mcg', label: 'Vitamina B12', unit: 'µg' },
  { key: 'vit_d_mcg', label: 'Vitamina D', unit: 'µg' },
  { key: 'vit_c_mg', label: 'Vitamina C', unit: 'mg' },
  { key: 'carbs_g', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat_g', label: 'Grasas', unit: 'g' },
] as const

type NutrientKey = (typeof NUTRIENTS)[number]['key']

const TOP_OPTIONS = [5, 10, 20]

export default function NutrientRankingView({ ingredients }: { ingredients: Ingredient[] }) {
  const [selectedNutrient, setSelectedNutrient] = useState<NutrientKey>('protein_g')
  const [topN, setTopN] = useState(10)
  const [selected, setSelected] = useState<Ingredient | null>(null)

  const nutrient = NUTRIENTS.find((n) => n.key === selectedNutrient)!

  const ranking = useMemo(
    () =>
      [...ingredients]
        .sort((a, b) => b[selectedNutrient] - a[selectedNutrient])
        .slice(0, topN),
    [ingredients, selectedNutrient, topN]
  )

  const max = ranking[0]?.[selectedNutrient] ?? 0

  const selectClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Nutriente
          <select
            value={selectedNutrient}
            onChange={(event) => setSelectedNutrient(event.target.value as NutrientKey)}
            className={selectClass}
          >
            {NUTRIENTS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          Mostrar
          <select
            value={topN}
            onChange={(event) => setTopN(Number(event.target.value))}
            className={selectClass}
          >
            {TOP_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="space-y-2">
        {ranking.map((ingredient, index) => {
          const value = ingredient[selectedNutrient]
          const pct = max > 0 ? (value / max) * 100 : 0

          return (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => setSelected(ingredient)}
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-green-400 hover:shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-gray-900">
                    <span className="mr-2 text-xs font-semibold text-gray-500">{index + 1}.</span>
                    {ingredient.name}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-gray-900">
                    {value.toFixed(1)} {nutrient.unit}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-gray-100">
                  <div className="h-1.5 rounded bg-green-500" style={{ width: `${pct}%` }} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {ranking.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-500">Sin resultados</p>
      )}

      {selected && (
        <IngredientDetailModal ingredient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
