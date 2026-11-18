'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { StockItem, Supplier } from '@/types/stock'

interface LineItem {
  stock_item_id: string
  gross_qty_g: number
  yield_pct: number
  price_per_100g: number
}

interface Props {
  stockItems: StockItem[]
  suppliers: Supplier[]
  currency?: string
  onSuccess?: () => void
}

export default function NuevaCompraForm({ stockItems, suppliers, currency = 'PEN', onSuccess }: Props) {
  const t = useTranslations('stock.purchases')
  const supabase = createClient()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([
    { stock_item_id: '', gross_qty_g: 0, yield_pct: 100, price_per_100g: 0 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sym = currency === 'PEN' ? 'S/' : '$'

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { stock_item_id: '', gross_qty_g: 0, yield_pct: 100, price_per_100g: 0 },
    ])

  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i))

  const updateLine = (i: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const totalAmount = lines.reduce((acc, l) => {
    const net = l.gross_qty_g * (l.yield_pct / 100)
    return acc + net * (l.price_per_100g / 100)
  }, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data: purchase, error: pe } = await supabase
        .from('purchases')
        .insert({
          purchase_date: date,
          supplier_id: supplierId || null,
          currency,
          notes: notes || null,
          total_amount: totalAmount,
        })
        .select('id')
        .single()
      if (pe || !purchase) throw pe ?? new Error('No purchase returned')

      const lineRows = lines
        .filter((l) => l.stock_item_id && l.gross_qty_g > 0)
        .map((l) => {
          const net = l.gross_qty_g * (l.yield_pct / 100)
          return {
            purchase_id: purchase.id,
            stock_item_id: l.stock_item_id,
            gross_qty_g: l.gross_qty_g,
            yield_pct: l.yield_pct,
            net_qty_g: net,
            price_per_100g: l.price_per_100g,
            subtotal: net * (l.price_per_100g / 100),
          }
        })

      if (lineRows.length) {
        const { error: le } = await supabase.from('purchase_lines').insert(lineRows)
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

      {/* Datos de la compra */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-gray-700">{t('purchaseData')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('currency')}</label>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {currency}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('supplier')}</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">{t('noSupplier')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('notesPlaceholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </fieldset>

      {/* Ítems */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">{t('itemsSection')}</h3>
        {lines.map((line, i) => {
          const net = line.gross_qty_g * (line.yield_pct / 100)
          const subtotal = net * (line.price_per_100g / 100)
          return (
            <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">{t('itemN', { n: i + 1 })}</span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t('removeItem')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">{t('ingredientLabel')}</label>
                  <select
                    value={line.stock_item_id}
                    onChange={(e) => updateLine(i, { stock_item_id: e.target.value })}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">{t('selectIngredient')}</option>
                    {stockItems.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('grossQty')}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={line.gross_qty_g || ''}
                    onChange={(e) => updateLine(i, { gross_qty_g: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('yieldPct')}</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={line.yield_pct}
                    onChange={(e) => updateLine(i, { yield_pct: parseFloat(e.target.value) || 100 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('price', { currency: sym })}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.price_per_100g || ''}
                    onChange={(e) => updateLine(i, { price_per_100g: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="text-xs text-gray-500 pb-2">
                  {t('netCalc', {
                    net: net.toFixed(1),
                    currency: sym,
                    price: subtotal.toFixed(2),
                  })}
                </div>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addLine}
          className="text-sm text-green-600 hover:text-green-800 font-medium"
        >
          + {t('addItem')}
        </button>
      </div>

      {/* Total + Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {t('total', {
            currency: sym,
            amount: totalAmount.toFixed(2),
            n: lines.filter((l) => l.stock_item_id).length,
          })}
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  )
}
