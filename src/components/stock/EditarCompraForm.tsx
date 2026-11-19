'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CURRENCIES } from '@/constants/nutrition'
import type { Currency } from '@/types/domain'
import type {
  PurchaseWithItems,
  PurchaseIngredientOption,
  StockItemWithIngredient,
  Supplier,
} from '@/types/stock'

interface ExistingLine {
  id:              string
  stock_item_name: string
  quantity_gross:  number
  yield_pct_snap:  number
  quantity_net:    number   // local preview (qty_gross * yield / 100)
  price_paid:      number
}

interface NewLine {
  selection:      string   // 'stock:<uuid>' | 'ingredient:<uuid>'
  quantity_gross: number
  yield_pct_snap: number
  price_paid:     number
}

interface Props {
  purchase:    PurchaseWithItems
  stockItems:  StockItemWithIngredient[]
  ingredients: PurchaseIngredientOption[]
  suppliers:   Supplier[]
  locale:      string
}

const newLine = (): NewLine => ({
  selection:      '',
  quantity_gross: 0,
  yield_pct_snap: 100,
  price_paid:     0,
})

export default function EditarCompraForm({
  purchase, stockItems, ingredients, suppliers, locale,
}: Props) {
  const t      = useTranslations('stock.purchases')
  const router = useRouter()

  // ── Estado: cabecera ─────────────────────────────────────────
  const [date,       setDate]       = useState(purchase.purchased_at.slice(0, 10))
  const [currency,   setCurrency]   = useState<Currency>((purchase.currency ?? 'PEN') as Currency)
  const [supplierId, setSupplierId] = useState(purchase.supplier_id ?? '')
  const [notes,      setNotes]      = useState(purchase.notes ?? '')

  // ── Estado: líneas existentes (solo precio editable) ─────────
  const [existingLines, setExistingLines] = useState<ExistingLine[]>(
    (purchase.items ?? []).map((item) => ({
      id:              item.id,
      stock_item_name: (item.stock_item as any)?.name ?? '—',
      quantity_gross:  item.quantity_gross,
      yield_pct_snap:  item.yield_pct_snap,
      quantity_net:    item.quantity_net,
      price_paid:      item.price_paid ?? 0,
    }))
  )

  // ── Estado: nuevas líneas ────────────────────────────────────
  const [newLines, setNewLines] = useState<NewLine[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const sym = currency === 'PEN' ? 'S/' : currency

  // ── Helpers ──────────────────────────────────────────────────
  const updateExistingLine = (id: string, patch: Partial<ExistingLine>) =>
    setExistingLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const updated = { ...l, ...patch }
        // Recalcular preview de neto si cambió alguna cantidad
        if (patch.quantity_gross !== undefined || patch.yield_pct_snap !== undefined) {
          updated.quantity_net = Math.round(updated.quantity_gross * (updated.yield_pct_snap / 100) * 100) / 100
        }
        return updated
      })
    )

  const addNewLine = () => setNewLines((prev) => [...prev, newLine()])

  const removeNewLine = (i: number) =>
    setNewLines((prev) => prev.filter((_, idx) => idx !== i))

  const updateNewLine = (i: number, patch: Partial<NewLine>) =>
    setNewLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const selectNewItem = (i: number, selection: string) => {
    const stockId   = selection.startsWith('stock:') ? selection.slice('stock:'.length) : null
    const stockItem = stockId ? stockItems.find((s) => s.id === stockId) : null
    updateNewLine(i, { selection, yield_pct_snap: stockItem?.yield_pct ?? 100 })
  }

  const lineNet = (l: NewLine) => l.quantity_gross * (l.yield_pct_snap / 100)

  const existingTotal = existingLines.reduce((acc, l) => acc + (l.price_paid || 0), 0)
  const newTotal      = newLines.reduce((acc, l) => acc + (l.price_paid || 0), 0)
  const grandTotal    = existingTotal + newTotal

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Payload: cabecera + precios actualizados + nuevas líneas
    const updateItems = existingLines
      .filter((l) => {
        const original = purchase.items?.find((i) => i.id === l.id)
        if (!original) return false
        return (
          original.price_paid    !== l.price_paid    ||
          original.quantity_gross !== l.quantity_gross ||
          original.yield_pct_snap !== l.yield_pct_snap
        )
      })
      .map((l) => ({
        id:             l.id,
        price_paid:     l.price_paid,
        quantity_gross: l.quantity_gross,
        yield_pct_snap: l.yield_pct_snap,
      }))

    const validNewLines = newLines.filter((l) => l.selection && l.quantity_gross > 0)

    const addItems = validNewLines.map((l) => {
      const [kind, id] = l.selection.split(':')
      return {
        ...(kind === 'stock' ? { stock_item_id: id } : { ingredient_id: id }),
        quantity_gross:  l.quantity_gross,
        yield_pct_snap:  l.yield_pct_snap,
        price_paid:      l.price_paid,
      }
    })

    const payload: Record<string, unknown> = {
      supplier_id:  supplierId || null,
      purchased_at: date,
      currency,
      total_paid:   grandTotal,
      notes:        notes || null,
    }
    if (updateItems.length > 0) payload.update_items = updateItems
    if (addItems.length  > 0) payload.add_items    = addItems

    setSubmitting(true)
    try {
      const res = await fetch(`/api/stock/purchases/${purchase.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
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
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">✏️ Editar compra</h2>
        <p className="text-sm text-gray-500">Modificá datos de la compra o agregá ítems nuevos.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Cabecera ───────────────────────────────────────── */}
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

      {/* ── Ítems existentes ───────────────────────────────── */}
      {existingLines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Ítems existentes</h3>

          <div className="space-y-2">
            {existingLines.map((line) => (
              <div key={line.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-3">
                <p className="text-sm font-medium text-gray-800">{line.stock_item_name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('grossQty')}</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={line.quantity_gross || ''}
                      onChange={(e) =>
                        updateExistingLine(line.id, { quantity_gross: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      onChange={(e) =>
                        updateExistingLine(line.id, { yield_pct_snap: parseFloat(e.target.value) || 100 })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('price', { currency: sym })}</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.price_paid || ''}
                      onChange={(e) =>
                        updateExistingLine(line.id, { price_paid: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {t('netCalc', {
                        net: line.quantity_net.toFixed(1),
                        currency: sym,
                        price: (line.quantity_net > 0 ? (line.price_paid / line.quantity_net) * 100 : 0).toFixed(2),
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Nuevas líneas ──────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Agregar ítems nuevos</h3>

        {newLines.map((line, i) => {
          const net = lineNet(line)
          return (
            <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">{t('itemN', { n: i + 1 })}</span>
                <button
                  type="button"
                  onClick={() => removeNewLine(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {t('removeItem')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">{t('ingredientLabel')}</label>
                  <select
                    value={line.selection}
                    onChange={(e) => selectNewItem(i, e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">{t('selectIngredient')}</option>
                    {stockItems.length > 0 && (
                      <optgroup label={t('groupInStock')}>
                        {stockItems.map((s) => (
                          <option key={s.id} value={`stock:${s.id}`}>
                            {s.ingredient?.name_en ?? s.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {ingredients.length > 0 && (
                      <optgroup label={t('groupCatalog')}>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={`ingredient:${ing.id}`}>
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
                    onChange={(e) =>
                      updateNewLine(i, { quantity_gross: parseFloat(e.target.value) || 0 })
                    }
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
                    onChange={(e) =>
                      updateNewLine(i, { yield_pct_snap: parseFloat(e.target.value) || 100 })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {t('price', { currency: sym })}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.price_paid || ''}
                    onChange={(e) =>
                      updateNewLine(i, { price_paid: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="text-xs text-gray-500 pb-2">
                  {t('netCalc', {
                    net:      net.toFixed(1),
                    currency: sym,
                    price:    (net > 0 ? (line.price_paid / net) * 100 : 0).toFixed(2),
                  })}
                </div>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addNewLine}
          className="text-sm text-green-600 hover:text-green-800 font-medium"
        >
          + {t('addItem')}
        </button>
      </div>

      {/* ── Total + Submit ─────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {t('total', {
            currency: sym,
            amount: grandTotal.toFixed(2),
            n: existingLines.length + newLines.filter((l) => l.selection).length,
          })}
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}
