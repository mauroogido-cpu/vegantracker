'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CURRENCIES } from '@/constants/nutrition'
import type { Currency } from '@/types/domain'
import type {
  CreatePurchaseInput,
  PurchaseIngredientOption,
  StockItemWithIngredient,
  Supplier,
} from '@/types/stock'

interface LineItem {
  /** '' | 'stock:<uuid>' | 'ingredient:<uuid>' */
  selection: string
  quantity_gross: number
  yield_pct_snap: number
  price_paid: number
}

interface Props {
  stockItems: StockItemWithIngredient[]
  /** Ingredientes del catálogo que todavía no tienen stock_item */
  ingredients: PurchaseIngredientOption[]
  suppliers: Supplier[]
  locale: string
}

const newLine = (): LineItem => ({
  selection: '',
  quantity_gross: 0,
  yield_pct_snap: 100,
  price_paid: 0,
})

const stockValue = (id: string) => `stock:${id}`
const ingredientValue = (id: string) => `ingredient:${id}`

export default function NuevaCompraForm({ stockItems, ingredients, suppliers, locale }: Props) {
  const t = useTranslations('stock.purchases')
  const router = useRouter()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [currency, setCurrency] = useState<Currency>('PEN')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([newLine()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sym = currency === 'PEN' ? 'S/' : currency

  const addLine = () => setLines((prev) => [...prev, newLine()])

  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i))

  const updateLine = (i: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const selectItem = (i: number, selection: string) => {
    const stockId = selection.startsWith('stock:') ? selection.slice('stock:'.length) : null
    const stockItem = stockId ? stockItems.find((s) => s.id === stockId) : null
    updateLine(i, {
      selection,
      yield_pct_snap: stockItem?.yield_pct ?? 100,
    })
  }

  const lineNet = (l: LineItem) => l.quantity_gross * (l.yield_pct_snap / 100)

  const totalAmount = lines.reduce((acc, l) => acc + (l.price_paid || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validLines = lines.filter((l) => l.selection && l.quantity_gross > 0)
    if (validLines.length === 0) {
      setError(t('errorNoItems'))
      return
    }

    const payload: CreatePurchaseInput = {
      supplier_id: supplierId || undefined,
      purchased_at: date,
      currency,
      total_paid: totalAmount,
      notes: notes || undefined,
      items: validLines.map((l) => {
        const [kind, id] = l.selection.split(':')
        return {
          ...(kind === 'stock' ? { stock_item_id: id } : { ingredient_id: id }),
          quantity_gross: l.quantity_gross,
          yield_pct_snap: l.yield_pct_snap,
          price_paid: l.price_paid,
        }
      }),
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/stock/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? t('errorSave'))
      }
      router.push(`/${locale}/app/despensa/compras`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorSave'))
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
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
          const net = lineNet(line)
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
                    value={line.selection}
                    onChange={(e) => selectItem(i, e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">{t('selectIngredient')}</option>
                    {stockItems.length > 0 && (
                      <optgroup label={t('groupInStock')}>
                        {stockItems.map((s) => (
                          <option key={s.id} value={stockValue(s.id)}>
                            {s.ingredient?.name_en ?? s.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {ingredients.length > 0 && (
                      <optgroup label={t('groupCatalog')}>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ingredientValue(ing.id)}>
                            {ing.name}{ing.category ? ` · ${ing.category}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('grossQty')}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={line.quantity_gross || ''}
                    onChange={(e) => updateLine(i, { quantity_gross: parseFloat(e.target.value) || 0 })}
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
                    value={line.yield_pct_snap}
                    onChange={(e) => updateLine(i, { yield_pct_snap: parseFloat(e.target.value) || 100 })}
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
                    value={line.price_paid || ''}
                    onChange={(e) => updateLine(i, { price_paid: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="text-xs text-gray-500 pb-2">
                  {t('netCalc', {
                    net: net.toFixed(1),
                    currency: sym,
                    price: (net > 0 ? (line.price_paid / net) * 100 : 0).toFixed(2),
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
            n: lines.filter((l) => l.selection).length,
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
