'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { StockItem, PrepTaskType } from '@/types/stock'

interface IOLine {
  stock_item_id: string
  qty_g: number
  unit: string
}

interface Props {
  stockItems: StockItem[]
  onSuccess?: () => void
}

const TASK_TYPES: { value: PrepTaskType; icon: string }[] = [
  { value: 'cook',     icon: '🍳' },
  { value: 'blend',   icon: '🥤' },
  { value: 'ferment', icon: '🫙' },
  { value: 'dehy',    icon: '☀️' },
  { value: 'sprout',  icon: '🌱' },
  { value: 'other',   icon: '🔧' },
]

function IOBlock({
  label,
  lines,
  onChange,
  stockItems,
}: {
  label: string
  lines: IOLine[]
  onChange: (lines: IOLine[]) => void
  stockItems: StockItem[]
}) {
  const t = useTranslations('stock.prepTasks')

  const addLine = () =>
    onChange([...lines, { stock_item_id: '', qty_g: 0, unit: 'g' }])

  const updateLine = (i: number, patch: Partial<IOLine>) =>
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const removeLine = (i: number) => onChange(lines.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{label}</h4>
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select
            value={line.stock_item_id}
            onChange={(e) => updateLine(i, { stock_item_id: e.target.value })}
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="">{t('selectItem')}</option>
            {stockItems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step={0.1}
            value={line.qty_g || ''}
            onChange={(e) => updateLine(i, { qty_g: parseFloat(e.target.value) || 0 })}
            placeholder={t('quantity')}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
          />
          <input
            type="text"
            value={line.unit}
            onChange={(e) => updateLine(i, { unit: e.target.value })}
            placeholder={t('unit')}
            className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeLine(i)}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLine}
        className="text-xs text-green-600 hover:text-green-800 font-medium"
      >
        + {t('addLine')}
      </button>
    </div>
  )
}

export default function NuevaTareaForm({ stockItems, onSuccess }: Props) {
  const t = useTranslations('stock.prepTasks')
  const supabase = createClient()

  const [name, setName] = useState('')
  const [taskType, setTaskType] = useState<PrepTaskType>('cook')
  const [scheduledFor, setScheduledFor] = useState('')
  const [notes, setNotes] = useState('')
  const [inputs, setInputs] = useState<IOLine[]>([{ stock_item_id: '', qty_g: 0, unit: 'g' }])
  const [outputs, setOutputs] = useState<IOLine[]>([{ stock_item_id: '', qty_g: 0, unit: 'g' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data: task, error: te } = await supabase
        .from('prep_tasks')
        .insert({
          name,
          task_type: taskType,
          scheduled_for: scheduledFor || null,
          notes: notes || null,
          status: 'pending',
        })
        .select('id')
        .single()
      if (te || !task) throw te ?? new Error('No task returned')

      const inputRows = inputs
        .filter((l) => l.stock_item_id && l.qty_g > 0)
        .map((l) => ({ prep_task_id: task.id, stock_item_id: l.stock_item_id, qty_g: l.qty_g, unit: l.unit, io_type: 'input' }))

      const outputRows = outputs
        .filter((l) => l.stock_item_id && l.qty_g > 0)
        .map((l) => ({ prep_task_id: task.id, stock_item_id: l.stock_item_id, qty_g: l.qty_g, unit: l.unit, io_type: 'output' }))

      const allRows = [...inputRows, ...outputRows]
      if (allRows.length) {
        const { error: le } = await supabase.from('prep_task_lines').insert(allRows)
        if (le) throw le
      }

      onSuccess?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('newTitle')}</h2>
        <p className="text-sm text-gray-500">{t('newSubtitle')}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t('namePlaceholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('taskType')}</label>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((tt) => (
              <button
                key={tt.value}
                type="button"
                onClick={() => setTaskType(tt.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                  taskType === tt.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                }`}
              >
                <span>{tt.icon}</span>
                <span>{t(`types.${tt.value}` as any)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduledFor')}</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('notesPlaceholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <IOBlock
          label={t('inputsLabel')}
          lines={inputs}
          onChange={setInputs}
          stockItems={stockItems}
        />

        <IOBlock
          label={t('outputsLabel')}
          lines={outputs}
          onChange={setOutputs}
          stockItems={stockItems}
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? t('submitting') : t('createTask')}
        </button>
      </div>
    </form>
  )
}
