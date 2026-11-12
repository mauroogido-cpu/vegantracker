'use client'

import { useState } from 'react'
import { useCreateUserIngredient, useUpdateUserIngredient } from '@/hooks/useUserIngredients'
import type { Category, UserIngredient, UserIngredientInput } from '@/types/domain'

// ─── helpers ─────────────────────────────────────────────────────────────────

function toNum(val: string): number | null {
  const n = parseFloat(val)
  return val.trim() === '' || isNaN(n) ? null : n
}

const CATEGORIES: Category[] = [
  'fruits', 'vegetables', 'grains', 'legumes', 'proteins', 'seeds', 'other',
]

// ─── types ───────────────────────────────────────────────────────────────────

interface Props {
  /** If provided, the form is in edit mode */
  existing?: UserIngredient
  onSuccess?: (ingredient: UserIngredient) => void
  onCancel?: () => void
}

type FieldValue = string   // form state is always string; toNum() on submit

interface FormState {
  // Identity
  name_en: string
  name_es: string
  brand: string
  barcode: string
  category: Category
  // Macros
  cal: string
  protein_g: string
  carbs_g: string
  fat_g: string
  fiber_g: string
  saturated_fat_g: string
  sugar_g: string
  sodium_mg: string
  // Minerals
  iron_mg: string
  calcium_mg: string
  zinc_mg: string
  // Vitamins
  vit_b12_mcg: string
  vit_d_mcg: string
  vit_c_mg: string
  omega3_g: string
}

function emptyForm(): FormState {
  return {
    name_en: '', name_es: '', brand: '', barcode: '', category: 'other',
    cal: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '',
    saturated_fat_g: '', sugar_g: '', sodium_mg: '',
    iron_mg: '', calcium_mg: '', zinc_mg: '',
    vit_b12_mcg: '', vit_d_mcg: '', vit_c_mg: '', omega3_g: '',
  }
}

function fromExisting(e: UserIngredient): FormState {
  const s = (v: number | null) => v === null ? '' : String(v)
  return {
    name_en: e.name_en, name_es: e.name_es ?? '', brand: e.brand ?? '',
    barcode: e.barcode ?? '', category: e.category,
    cal: s(e.cal), protein_g: s(e.protein_g), carbs_g: s(e.carbs_g),
    fat_g: s(e.fat_g), fiber_g: s(e.fiber_g),
    saturated_fat_g: s(e.saturated_fat_g), sugar_g: s(e.sugar_g),
    sodium_mg: s(e.sodium_mg),
    iron_mg: s(e.iron_mg), calcium_mg: s(e.calcium_mg), zinc_mg: s(e.zinc_mg),
    vit_b12_mcg: s(e.vit_b12_mcg), vit_d_mcg: s(e.vit_d_mcg),
    vit_c_mg: s(e.vit_c_mg), omega3_g: s(e.omega3_g),
  }
}

function toInput(f: FormState): UserIngredientInput {
  return {
    name_en: f.name_en.trim(),
    name_es: f.name_es.trim() || null,
    brand: f.brand.trim() || null,
    barcode: f.barcode.trim() || null,
    category: f.category,
    source_ingredient_id: null,
    cal: toNum(f.cal),
    protein_g: toNum(f.protein_g),
    carbs_g: toNum(f.carbs_g),
    fat_g: toNum(f.fat_g),
    fiber_g: toNum(f.fiber_g),
    saturated_fat_g: toNum(f.saturated_fat_g),
    sugar_g: toNum(f.sugar_g),
    sodium_mg: toNum(f.sodium_mg),
    iron_mg: toNum(f.iron_mg),
    calcium_mg: toNum(f.calcium_mg),
    zinc_mg: toNum(f.zinc_mg),
    vit_b12_mcg: toNum(f.vit_b12_mcg),
    vit_d_mcg: toNum(f.vit_d_mcg),
    vit_c_mg: toNum(f.vit_c_mg),
    omega3_g: toNum(f.omega3_g),
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function NutrientInput({
  label, unit, name, value, onChange,
}: {
  label: string; unit: string; name: keyof FormState
  value: string; onChange: (name: keyof FormState, val: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">
        {label} <span className="text-gray-400">({unit})</span>
      </label>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => onChange(name, e.target.value)}
          placeholder="—"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5
                     text-sm placeholder-gray-300 focus:border-green-500 focus:outline-none"
        />
        {value === '' && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2
                           text-xs text-amber-400" title="Unknown — will show as incomplete">
            ?
          </span>
        )}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function UserIngredientForm({ existing, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(
    existing ? fromExisting(existing) : emptyForm()
  )
  const [showMicros, setShowMicros] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateUserIngredient()
  const updateMutation = useUpdateUserIngredient()

  const isLoading = createMutation.isPending || updateMutation.isPending

  function set(name: keyof FormState, val: FieldValue) {
    setForm(prev => ({ ...prev, [name]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name_en.trim()) {
      setError('El nombre en inglés es obligatorio.')
      return
    }

    const input = toInput(form)
    let result: UserIngredient | null = null

    if (existing) {
      result = await updateMutation.mutateAsync({ id: existing.id, input })
    } else {
      result = await createMutation.mutateAsync(input)
    }

    if (!result) {
      setError('No se pudo guardar. Revisá la consola para más detalles.')
      return
    }

    onSuccess?.(result)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Identity ─────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Producto
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Nombre (EN) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name_en}
              onChange={e => set('name_en', e.target.value)}
              placeholder="e.g. Soy Milk Gloria"
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm
                         focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Nombre (ES)</label>
            <input
              type="text"
              value={form.name_es}
              onChange={e => set('name_es', e.target.value)}
              placeholder="Leche de soya Gloria"
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm
                         focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Marca</label>
            <input
              type="text"
              value={form.brand}
              onChange={e => set('brand', e.target.value)}
              placeholder="Gloria"
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm
                         focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Código de barras</label>
            <input
              type="text"
              value={form.barcode}
              onChange={e => set('barcode', e.target.value)}
              placeholder="7501055310128"
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm
                         focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Categoría</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value as Category)}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm
                         focus:border-green-500 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Macronutrients ───────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Macronutrientes <span className="text-gray-300 font-normal normal-case">(por 100 g)</span>
          </h3>
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
            Dejá vacío lo que no figure en la etiqueta
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NutrientInput label="Calorías"      unit="kcal" name="cal"             value={form.cal}             onChange={set} />
          <NutrientInput label="Proteínas"     unit="g"    name="protein_g"       value={form.protein_g}       onChange={set} />
          <NutrientInput label="Carbohidratos" unit="g"    name="carbs_g"         value={form.carbs_g}         onChange={set} />
          <NutrientInput label="Grasas"        unit="g"    name="fat_g"           value={form.fat_g}           onChange={set} />
          <NutrientInput label="Fibra"         unit="g"    name="fiber_g"         value={form.fiber_g}         onChange={set} />
          <NutrientInput label="Gr. saturadas" unit="g"    name="saturated_fat_g" value={form.saturated_fat_g} onChange={set} />
          <NutrientInput label="Azúcar"        unit="g"    name="sugar_g"         value={form.sugar_g}         onChange={set} />
          <NutrientInput label="Sodio"         unit="mg"   name="sodium_mg"       value={form.sodium_mg}       onChange={set} />
        </div>
      </section>

      {/* ── Micronutrients (collapsible) ─────────────────────── */}
      <section>
        <button
          type="button"
          onClick={() => setShowMicros(v => !v)}
          className="flex items-center gap-1 text-sm font-semibold uppercase
                     tracking-wide text-gray-400 hover:text-green-600"
        >
          <span>{showMicros ? '▾' : '▸'}</span>
          Micronutrientes
          <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal
                           normal-case text-gray-500">opcional</span>
        </button>

        {showMicros && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NutrientInput label="Hierro"    unit="mg"  name="iron_mg"     value={form.iron_mg}     onChange={set} />
            <NutrientInput label="Calcio"    unit="mg"  name="calcium_mg"  value={form.calcium_mg}  onChange={set} />
            <NutrientInput label="Zinc"      unit="mg"  name="zinc_mg"     value={form.zinc_mg}     onChange={set} />
            <NutrientInput label="Vit. B12"  unit="mcg" name="vit_b12_mcg" value={form.vit_b12_mcg} onChange={set} />
            <NutrientInput label="Vit. D"    unit="mcg" name="vit_d_mcg"   value={form.vit_d_mcg}   onChange={set} />
            <NutrientInput label="Vit. C"    unit="mg"  name="vit_c_mg"    value={form.vit_c_mg}    onChange={set} />
            <NutrientInput label="Omega-3"   unit="g"   name="omega3_g"    value={form.omega3_g}    onChange={set} />
          </div>
        )}
      </section>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium
                     text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Guardando…' : existing ? 'Actualizar' : 'Guardar producto'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm
                       text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
