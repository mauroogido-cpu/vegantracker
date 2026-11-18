'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { StockItemWithIngredient, Supplier, CreatePurchasePayload } from '@/types/stock'

interface LineItem {
  stock_item_id: string
  quantity_gross: number
  yield_pct_snap: number
  price_paid: number
}

const CURRENCIES = ['PEN','ARS','USD','EUR','BRL','INR','JPY'] as const

interface Props {
  stockItems: StockItemWithIngredient[]
  suppliers: Supplier[]
  locale: string
}

export default function NuevaCompraForm({ stockItems, suppliers, locale }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [supplierId, setSupplierId]   = useState('')
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().slice(0, 10))
  const [currency, setCurrency]       = useState<typeof CURRENCIES[number]>('PEN')
  const [notes, setNotes]             = useState('')
  const [lines, setLines]             = useState<LineItem[]>([
    { stock_item_id: '', quantity_gross: 0, yield_pct_snap: 100, price_paid: 0 },
  ])
  const [error, setError] = useState('')

  function addLine() {
    setLines(l => [...l, { stock_item_id: '', quantity_gross: 0, yield_pct_snap: 100, price_paid: 0 }])
  }

  function removeLine(i: number) {
    setLines(l => l.filter((_, idx) => idx !== i))
  }

  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLines(l => l.map((line, idx) => {
      if (idx !== i) return line
      // auto-fill yield from stock_item default
      if (field === 'stock_item_id') {
        const item = stockItems.find(s => s.id === value)
        return { ...line, stock_item_id: value as string, yield_pct_snap: item?.yield_pct ?? 100 }
      }
      return { ...line, [field]: value }
    }))
  }

  const totalPaid = lines.reduce((s, l) => s + (l.price_paid || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validLines = lines.filter(l => l.stock_item_id && l.quantity_gross > 0 && l.price_paid > 0)
    if (validLines.length === 0) {
      setError('Agregá al menos un ítem con cantidad y precio válidos')
      return
    }

    const payload: CreatePurchasePayload = {
      supplier_id:  supplierId || undefined,
      purchased_at: purchasedAt,
      currency,
      total_paid:   totalPaid,
      notes:        notes || undefined,
      items: validLines.map(l => ({
        stock_item_id:  l.stock_item_id,
        quantity_gross: l.quantity_gross,
        yield_pct_snap: l.yield_pct_snap,
        price_paid:     l.price_paid,
      })),
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/stock/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? 'Error al guardar la compra')
          return
        }
        router.push(`/${locale}/app/despensa/compras`)
        router.refresh()
      } catch (err) {
        setError('Error de red. Intentá de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🛒 Nueva compra</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registrá una compra para actualizar el stock y el costo promedio ponderado
        </p>
      </div>

      {/* Cabecera */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="font-semibold text-gray-700">Datos de la compra</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={purchasedAt}
              onChange={e => setPurchasedAt(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as typeof CURRENCIES[number])}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (opcional)</label>
          <select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">— Sin proveedor —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Feria orgánica, super, etc."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Ítems */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">Ítems comprados</h2>

        {lines.map((line, i) => {
          const item = stockItems.find(s => s.id === line.stock_item_id)
          const qtyNet = line.quantity_gross * (line.yield_pct_snap / 100)
          const pricePer100 = qtyNet > 0 ? (line.price_paid / qtyNet * 100) : 0

          return (
            <div key={i} className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Ítem #{i + 1}</span>
                {lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)}
                    className="text-xs text-red-400 hover:text-red-600">✕ Quitar</button>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Ingrediente / Stock item</label>
                <select
                  value={line.stock_item_id}
                  onChange={e => updateLine(i, 'stock_item_id', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  required
                >
                  <option value="">— Seleccioná —</option>
                  {stockItems.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.yield_pct < 100 ? ` (rend. ${s.yield_pct}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Cantidad bruta (g)
                  </label>
                  <input
                    type="number" min={0} step={1}
                    value={line.quantity_gross || ''}
                    onChange={e => updateLine(i, 'quantity_gross', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Rendimiento %
                  </label>
                  <input
                    type="number" min={1} max={100} step={0.1}
                    value={line.yield_pct_snap}
                    onChange={e => updateLine(i, 'yield_pct_snap', parseFloat(e.target.value) || 100)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Precio ({currency})
                  </label>
                  <input
                    type="number" min={0} step={0.01}
                    value={line.price_paid || ''}
                    onChange={e => updateLine(i, 'price_paid', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              {line.quantity_gross > 0 && (
                <p className="text-xs text-gray-400">
                  → {qtyNet.toFixed(1)}g neto
                  {pricePer100 > 0 && ` · ${currency} ${pricePer100.toFixed(3)}/100g`}
                </p>
              )}
            </div>
          )
        })}

        <button type="button" onClick={addLine}
          className="text-sm text-green-600 hover:text-green-800 font-medium">
          + Agregar ítem
        </button>
      </div>

      {/* Total + Submit */}
      <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-3">
        <span className="text-sm text-gray-700">
          Total: <span className="font-semibold text-green-800">
            {currency} {totalPaid.toFixed(2)}
          </span>
          {' '}· {lines.filter(l => l.stock_item_id).length} ítems
        </span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Registrar compra'}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}
    </form>
  )
}
