'use client'

import { useMemo, useState } from 'react'
import {
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
  seeds: 'Semillas',
  other: 'Otros',
}

type ScatterPoint = { x: number; y: number; name: string; category: string }

type ActiveTooltip = {
  point: ScatterPoint
  ingredientId: string
}

function stats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return { mean, std: Math.sqrt(variance) }
}

const OUTLIER_THRESHOLD = 2.5

export default function NutrientExplorerView({ ingredients }: { ingredients: Ingredient[] }) {
  const [xKey, setXKey] = useState<NutrientKey>('protein_g')
  const [yKey, setYKey] = useState<NutrientKey>('cal')
  const [hideOutliers, setHideOutliers] = useState(false)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [outlierExceptions, setOutlierExceptions] = useState<Set<string>>(new Set())
  // null = todas las categorías visibles; string = solo esa categoría
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  // tooltip fijo al hacer click/tap
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null)

  const xNutrient = NUTRIENTS.find((n) => n.key === xKey)!
  const yNutrient = NUTRIENTS.find((n) => n.key === yKey)!

  const { xStats, yStats } = useMemo(() => {
    const xs = ingredients.map((i) => i[xKey] as number)
    const ys = ingredients.map((i) => i[yKey] as number)
    return { xStats: stats(xs), yStats: stats(ys) }
  }, [ingredients, xKey, yKey])

  function isOutlier(ingredient: Ingredient): boolean {
    if (outlierExceptions.has(ingredient.id)) return false
    const xVal = ingredient[xKey] as number
    const yVal = ingredient[yKey] as number
    return (
      Math.abs(xVal - xStats.mean) > OUTLIER_THRESHOLD * xStats.std ||
      Math.abs(yVal - yStats.mean) > OUTLIER_THRESHOLD * yStats.std
    )
  }

  // Categorías presentes en los datos
  const availableCategories = useMemo(() => {
    return [...new Set(ingredients.map((i) => i.category))]
  }, [ingredients])

  const groups = useMemo(() => {
    const byCategory = new Map<string, ScatterPoint[]>()
    for (const ingredient of ingredients) {
      if (excluded.has(ingredient.id)) continue
      if (hideOutliers && isOutlier(ingredient)) continue
      if (activeCategory && ingredient.category !== activeCategory) continue
      const points = byCategory.get(ingredient.category) ?? []
      points.push({
        x: ingredient[xKey] as number,
        y: ingredient[yKey] as number,
        name: ingredient.name,
        category: ingredient.category,
      })
      byCategory.set(ingredient.category, points)
    }
    return [...byCategory.entries()]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients, xKey, yKey, hideOutliers, xStats, yStats, excluded, outlierExceptions, activeCategory])

  const hiddenIngredients = useMemo(() => {
    return ingredients.filter(
      (i) => excluded.has(i.id) || (hideOutliers && isOutlier(i))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients, xKey, yKey, hideOutliers, xStats, yStats, excluded, outlierExceptions])

  function handlePointClick(point: ScatterPoint) {
    const ingredient = ingredients.find((i) => i.name === point.name)
    if (!ingredient) return
    // Si ya está en el tooltip activo, lo cierra
    if (activeTooltip?.ingredientId === ingredient.id) {
      setActiveTooltip(null)
      return
    }
    setActiveTooltip({ point, ingredientId: ingredient.id })
  }

  function hideFromTooltip() {
    if (!activeTooltip) return
    setExcluded((prev) => new Set([...prev, activeTooltip.ingredientId]))
    setActiveTooltip(null)
  }

  function restoreIngredient(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setOutlierExceptions((prev) => new Set([...prev, id]))
  }

  function restoreAll() {
    setExcluded(new Set())
    setOutlierExceptions(new Set())
  }

  function toggleCategory(cat: string) {
    setActiveCategory((prev) => (prev === cat ? null : cat))
    setActiveTooltip(null)
  }

  const selectClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  return (
    <div className="space-y-4">
      {/* Selects de ejes */}
      <div className="flex flex-wrap items-center gap-4">
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

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={hideOutliers}
            onChange={(e) => setHideOutliers(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Ocultar outliers ({OUTLIER_THRESHOLD}σ)
        </label>
      </div>

      {/* Chips de categoría */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setActiveCategory(null); setActiveTooltip(null) }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === null
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {availableCategories.map((cat) => {
          const color = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other
          const label = CATEGORY_LABELS[cat] ?? cat
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              style={isActive ? { backgroundColor: color, color: '#fff', borderColor: color } : { borderColor: color, color: color }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? '' : 'bg-white hover:opacity-80'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Ingredientes ocultos */}
      {hiddenIngredients.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Ocultos:</span>
          {hiddenIngredients.map((ingredient) => (
            <span
              key={ingredient.id}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {ingredient.name}
              <button
                type="button"
                onClick={() => restoreIngredient(ingredient.id)}
                aria-label={`Restaurar ${ingredient.name}`}
                className="ml-0.5 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </span>
          ))}
          {(excluded.size > 0 || outlierExceptions.size > 0) && (
            <button
              type="button"
              onClick={restoreAll}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
            >
              Restaurar todos
            </button>
          )}
        </div>
      )}

      {/* Tooltip fijo al hacer click/tap */}
      {activeTooltip && (
        <div className="flex items-start justify-between rounded-md border border-gray-200 bg-white p-3 shadow-md">
          <div>
            <p className="text-sm font-semibold text-gray-900">{activeTooltip.point.name}</p>
            <p className="text-xs text-gray-600">
              {xNutrient.label}: {activeTooltip.point.x.toFixed(1)} {xNutrient.unit}
            </p>
            <p className="text-xs text-gray-600">
              {yNutrient.label}: {activeTooltip.point.y.toFixed(1)} {yNutrient.unit}
            </p>
          </div>
          <div className="ml-4 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Cerrar"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={hideFromTooltip}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              Ocultar del gráfico
            </button>
          </div>
        </div>
      )}

      {/* Gráfico */}
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
            {/* Tooltip de hover — solo visible en desktop cuando no hay tooltip fijo */}
            {!activeTooltip && (
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
                      <p className="mt-1 text-xs text-gray-400">Tap para ver opciones</p>
                    </div>
                  )
                }}
              />
            )}
            {groups.map(([category, points]) => (
              <Scatter
                key={category}
                name={CATEGORY_LABELS[category] ?? category}
                data={points}
                fill={CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other}
                onClick={(data) => handlePointClick(data as unknown as ScatterPoint)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Fuente */}
      <p className="text-right text-xs text-gray-400">
        Fuente:{' '}
        <a
          href="https://fdc.nal.usda.gov/download-datasets"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          USDA FoodData Central
        </a>
      </p>
    </div>
  )
}
