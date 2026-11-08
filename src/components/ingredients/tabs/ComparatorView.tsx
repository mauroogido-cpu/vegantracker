'use client'

import { useMemo, useState } from 'react'
import type { Ingredient } from '@/types/domain'

const NUTRIENTS = [
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

type NutrientKey = (typeof NUTRIENTS)[number]

const NUTRIENT_LABELS: Record<NutrientKey, { label: string; unit: string }> = {
  cal: { label: 'Calorías', unit: 'kcal' },
  protein_g: { label: 'Proteína', unit: 'g' },
  carbs_g: { label: 'Carbohidratos', unit: 'g' },
  fat_g: { label: 'Grasas', unit: 'g' },
  fiber_g: { label: 'Fibra', unit: 'g' },
  iron_mg: { label: 'Hierro', unit: 'mg' },
  calcium_mg: { label: 'Calcio', unit: 'mg' },
  zinc_mg: { label: 'Zinc', unit: 'mg' },
  vit_b12_mcg: { label: 'Vitamina B12', unit: 'µg' },
  vit_d_mcg: { label: 'Vitamina D', unit: 'µg' },
  vit_c_mg: { label: 'Vitamina C', unit: 'mg' },
  omega3_g: { label: 'Omega-3', unit: 'g' },
}

const MAX_SELECTED = 3

export default function ComparatorView({ ingredients }: { ingredients: Ingredient[] }) {
  const [selected, setSelected] = useState<Ingredient[]>([])
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const isFull = selected.length >= MAX_SELECTED

  const results = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    const selectedIds = new Set(selected.map((ingredient) => ingredient.id))

    return ingredients
      .filter(
        (ingredient) =>
          !selectedIds.has(ingredient.id) && ingredient.name.toLowerCase().includes(search)
      )
      .slice(0, 8)
  }, [ingredients, searchText, selected])

  function addIngredient(ingredient: Ingredient) {
    if (isFull || selected.some((item) => item.id === ingredient.id)) return
    setSelected([...selected, ingredient])
    setSearchText('')
    setShowDropdown(false)
  }

  function removeIngredient(id: string) {
    setSelected(selected.filter((ingredient) => ingredient.id !== id))
  }

  function clearAll() {
    setSelected([])
    setSearchText('')
    setShowDropdown(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchText}
          disabled={isFull}
          onChange={(event) => {
            setSearchText(event.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setShowDropdown(false)}
          placeholder={
            isFull ? 'Máximo 3 ingredientes' : 'Buscar ingrediente para comparar...'
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        />

        {showDropdown && !isFull && results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {results.map((ingredient) => (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addIngredient(ingredient)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                >
                  <span className="truncate">{ingredient.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {ingredient.cal} kcal · {ingredient.protein_g}g prot
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selected.map((ingredient) => (
          <span
            key={ingredient.id}
            className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
          >
            {ingredient.name}
            <button
              type="button"
              onClick={() => removeIngredient(ingredient.id)}
              aria-label={`Quitar ${ingredient.name}`}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </span>
        ))}

        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Nutriente</th>
                {selected.map((ingredient) => (
                  <th key={ingredient.id} className="px-4 py-3">
                    {ingredient.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {NUTRIENTS.map((key) => {
                const max = Math.max(...selected.map((ingredient) => ingredient[key]))

                return (
                  <tr key={key}>
                    <td className="px-4 py-2 text-gray-600">
                      {NUTRIENT_LABELS[key].label} ({NUTRIENT_LABELS[key].unit})
                    </td>
                    {selected.map((ingredient) => (
                      <td
                        key={ingredient.id}
                        className={`px-4 py-2 ${
                          ingredient[key] === max
                            ? 'font-bold text-green-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {ingredient[key].toFixed(1)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
