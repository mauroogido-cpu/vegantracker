'use client'

import { useMemo, useState } from 'react'
import {
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
  { key: 'potassium_mg', label: 'Potasio', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnesio', unit: 'mg' },
  { key: 'folate_mcg', label: 'Ácido fólico', unit: 'µg' },
  { key: 'vit_a_rae_mcg', label: 'Vitamina A', unit: 'µg' },
  { key: 'vit_k_mcg', label: 'Vitamina K', unit: 'µg' },
  { key: 'vit_e_mg', label: 'Vitamina E', unit: 'mg' },
  { key: 'vit_b6_mg', label: 'Vitamina B6', unit: 'mg' },
  { key: 'selenium_mcg', label: 'Selenio', unit: 'µg' },
  { key: 'sodium_mg', label: 'Sodio', unit: 'mg' },
  { key: 'choline_mg', label: 'Colina', unit: 'mg' },
] as const

type NutrientKey = (typeof NUTRIENTS)[number]['key']

const CATEGORY_COLORS: Record<string, string> = {
  fruits: '#f97316',
  vegetables: '#22c55e',
  grains: '#eab308',
  legumes: '#8b5cf6',
  proteins: '#3b82f6',
  seeds: '#ec4899',
  other: '#6b7280',
}

const CATEGORY_LABELS: Record<string, string> = {
  fruits: 'Frutas',
  vegetables: 'Verduras',
  grains: 'Granos',
  legumes: 'Legumbres',
  proteins: 'Proteínas',
  seeds: 'Semillas y frutos secos',
  other: 'Otros',
}

type ScatterPoint = { x: number; y: number; name: string; category: string }

export default function NutrientExplorerView({ ingredients }: { ingredients: Ingredient[] }) {
  const [xKey, setXKey] = useState<NutrientKey>('protein_g')
  const [yKey, setYKey] = useState<NutrientKey>('cal')

  const xNutrient = NUTRIENTS.find((nutrient) => nutrient.key === xKey)!
  const yNutrient = NUTRIENTS.find((nutrient) => nutrient.key === yKey)!

  const groups = useMemo(() => {
    const byCategory = new Map<string, ScatterPoint[]>()

    for (const ingredient of ingredients) {
      const points = byCategory.get(ingredient.category) ?? []
      points.push({
        x: ingredient[xKey],
        y: ingredient[yKey],
        name: ingredient.name,
        category: ingredient.category,
      })
      byCategory.set(ingredient.category, points)
    }

    return [...byCategory.entries()]
  }, [ingredients, xKey, yKey])

  const selectClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Eje X
          <select
            value={xKey}
            onChange={(event) => setXKey(event.target.value as NutrientKey)}
            className={selectClass}
          >
            {NUTRIENTS.map((nutrient) => (
              <option key={nutrient.key} value={nutrient.key}>
                {nutrient.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          Eje Y
          <select
            value={yKey}
            onChange={(event) => setYKey(event.target.value as NutrientKey)}
            className={selectClass}
          >
            {NUTRIENTS.map((nutrient) => (
              <option key={nutrient.key} value={nutrient.key}>
                {nutrient.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
            <XAxis
              type="number"
              dataKey="x"
              name={xNutrient.label}
              tick={{ fontSize: 12 }}
              label={{
                value: `${xNutrient.label} (${xNutrient.unit})`,
                position: 'insideBottom',
                offset: -12,
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yNutrient.label}
              tick={{ fontSize: 12 }}
              width={64}
              label={{
                value: `${yNutrient.label} (${yNutrient.unit})`,
                angle: -90,
                position: 'insideLeft',
                fontSize: 12,
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const point = payload[0].payload as ScatterPoint

                return (
                  <div className="rounded-md border border-gray-200 bg-white p-2 shadow">
                    <p className="text-sm font-medium text-gray-900">{point.name}</p>
                    <p className="text-xs text-gray-600">
                      {xNutrient.label}: {point.x.toFixed(1)} {xNutrient.unit}
                    </p>
                    <p className="text-xs text-gray-600">
                      {yNutrient.label}: {point.y.toFixed(1)} {yNutrient.unit}
                    </p>
                  </div>
                )
              }}
            />
            <Legend verticalAlign="top" height={32} />
            {groups.map(([category, points]) => (
              <Scatter
                key={category}
                name={CATEGORY_LABELS[category] ?? category}
                data={points}
                fill={CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
