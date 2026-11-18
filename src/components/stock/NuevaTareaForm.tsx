'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { StockItemWithIngredient, PrepTaskType, CreatePrepTaskPayload } from '@/types/stock'

interface IOLine {
  stock_item_id: string
  quantity: number
  unit: string
}

const TASK_TYPES: { value: PrepTaskType; label: string; icon: string }[] = [
  { value: 'prep',      label: 'Preparación (corte/lavado)', icon: '🔪' },
  { value: 'transform', label: 'Transformación (tofu, leche)',  icon: '🔄' },
  { value: 'cook',      label: 'Cocción / batch cook',           icon: '🍳' },
]

interface Props {
  stockItems: StockItemWithIngredient[]
  locale: string
}

export default function NuevaTareaForm({ stockItems, locale }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName]               = useState('')
  const [taskType, setTaskType]       = useState<PrepTaskType>('prep')
  const [scheduledFor, setScheduledFor] = useState('')
  const [notes, setNotes]             = useState('')
  const [inputs, setInputs]           = useState<IOLine[]>([
    { stock_item_id: '', quantity: 0, unit: 'g' }
  ])
  const [outputs, setOutputs]         = useState<IOLine[]>([
    { stock_item_id: '', quantity: 0, unit: 'g' }
  ])
  const [error, setError]             = useState('')

  function addInput()  { setInputs(l => [...l, { stock_item_id: '', quantity: 0, unit: 'g' }]) }
  function addOutput() { setOutputs(l => [...l, { stock_item_id: '', quantity: 0, unit: 'g' }]) }

  function updateInput(i: number, f: keyof IOLine, v: string | number)  {
    setInputs(l => l.map((x, idx) => idx === i ? { ...x, [f]: v } : x))
  }
  function updateOutput(i: number, f: keyof IOLine, v: string | number) {
    setOutputs(l => l.map((x, idx) => idx === i ? { ...x, [f]: v } : x))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validInputs  = inputs.filter(l => l.stock_item_id && l.quantity > 0)
    const validOutputs = outputs.filter(l => l.stock_item_id && l.quantity > 0)

    if (!name.trim()) { setError('El nombre de la tarea es requerido'); return }
    if (validInputs.length === 0)  { setError('Agregá al menos un insumo'); return }
    if (validOutputs.length === 0) { setError('Agregá al menos un producto esperado'); return }

    const payload: CreatePrepTaskPayload = {
      name:          name.trim(),
      task_type:     taskType,
      scheduled_for: scheduledFor || undefined,
      notes:         notes || undefined,
      inputs:  validInputs.map(l => ({ stock_item_id: l.stock_item_id, quantity: l.quantity, unit: l.unit })),
      outputs: validOutputs.map(l => ({ stock_item_id: l.stock_item_id, quantity_expected: l.quantity, unit: l.unit })),
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/stock/prep-tasks', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? 'Error al guardar la tarea')
          return
        }
        router.push(`/${locale}/app/despensa/tareas`)
        router.refresh()
      } catch {
        setError('Error de red. Intentá de nuevo.')
      }
    })
  }

  function IOBlock({
    title, lines, onAdd, onUpdate, onRemove,
  }: {
    title: string
    lines: IOLine[]
    onAdd: () => void
    onUpdate: (i: number, f: keyof IOLine, v: string | number) => void
    onRemove: (i: number) => void
  }) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">{title}</h2>
        {lines.map((line, i) => (
          <div key={i} className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">#{i + 1}</span>
              {lines.length > 1 && (
                <button type="button" onClick={() => onRemove(i)}
                  className="text-xs text-red-400 hover:text-red-600">✕</button>
              )}
            </div>
            <select
              value={line.stock_item_id}
              onChange={e => onUpdate(i, 'stock_item_id', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
              required
            >
              <option value="">— Seleccioná stock item —</option>
              {stockItems.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Cantidad</label>
                <input type="number" min={0} step={0.1}
                  value={line.quantity || ''}
                  onChange={e => onUpdate(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Unidad</label>
                <select value={line.unit}
                  onChange={e => onUpdate(i, 'unit', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none">
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="unit">unidad</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={onAdd}
          className="text-sm text-green-600 hover:text-green-800 font-medium">
          + Agregar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔪 Nueva tarea de pre-producción</h1>
        <p className="text-sm text-gray-500 mt-1">
          Preparación, transformación o cocción que mueve stock
        </p>
      </div>

      {/* Datos base */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: Tofu casero, Apio pre-cortado, Batch lentejas"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="space-y-1">
              {TASK_TYPES.map(t => (
                <label key={t.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="taskType" value={t.value}
                    checked={taskType === t.value}
                    onChange={() => setTaskType(t.value)}
                    className="text-green-600"
                  />
                  {t.icon} {t.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha programada (opc.)</label>
            <input type="date" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Instrucciones, referencias de receta, etc."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      <IOBlock
        title="📥 Insumos (inputs — se descuentan del stock al completar)"
        lines={inputs}
        onAdd={addInput}
        onUpdate={updateInput}
        onRemove={i => setInputs(l => l.filter((_, idx) => idx !== i))}
      />

      <IOBlock
        title="📤 Productos esperados (outputs — se suman al stock al completar)"
        lines={outputs}
        onAdd={addOutput}
        onUpdate={updateOutput}
        onRemove={i => setOutputs(l => l.filter((_, idx) => idx !== i))}
      />

      <div className="flex justify-end">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
          {pending ? 'Guardando…' : 'Crear tarea'}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</p>
      )}
    </form>
  )
}
