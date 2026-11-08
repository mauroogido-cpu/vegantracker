'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { CURRENCIES } from '@/constants/nutrition'
import { useAuth } from '@/hooks/useAuth'
import { useUpsertCost } from '@/hooks/useCosts'
import type { IngredientCost } from '@/types/domain'

const costSchema = z.object({
  price: z.coerce.number().positive(),
  quantity_g: z.coerce.number().positive(),
  currency: z.enum(['PEN', 'USD', 'EUR', 'ARS', 'INR', 'BRL', 'JPY']),
  store: z.string().max(100).optional(),
  purchased_at: z.string().optional(),
})

type FieldErrors = Partial<Record<'price' | 'quantity_g' | 'currency', string[]>>

export default function CostForm({
  ingredientId,
  ingredientName,
  existingCost,
  onSuccess,
}: {
  ingredientId: string
  ingredientName: string
  existingCost?: IngredientCost
  onSuccess?: () => void
}) {
  const t = useTranslations('ingredient')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const upsert = useUpsertCost()

  const [price, setPrice] = useState(existingCost ? String(existingCost.price) : '')
  const [quantityG, setQuantityG] = useState(existingCost ? String(existingCost.quantity_g) : '')
  const [currency, setCurrency] = useState(existingCost?.currency ?? 'PEN')
  const [store, setStore] = useState(existingCost?.store ?? '')
  const [purchasedAt, setPurchasedAt] = useState(existingCost?.purchased_at ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const priceNum = Number(price)
  const qtyNum = Number(quantityG)
  const per100g = qtyNum > 0 ? ((priceNum / qtyNum) * 100).toFixed(2) : '0.00'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const parsed = costSchema.safeParse({
      price,
      quantity_g: quantityG,
      currency,
      store: store || undefined,
      purchased_at: purchasedAt || undefined,
    })

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors)
      return
    }
    setFieldErrors({})

    upsert.mutate(
      {
        user_id: user.id,
        ingredient_id: ingredientId,
        price: parsed.data.price,
        quantity_g: parsed.data.quantity_g,
        currency: parsed.data.currency,
        store: parsed.data.store ?? null,
        purchased_at: parsed.data.purchased_at ?? null,
      },
      { onSuccess: () => onSuccess?.() }
    )
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-900">{ingredientName}</p>

      <div>
        <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
          {t('price')}
        </label>
        <input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className={inputClass}
        />
        {fieldErrors.price && <p className="mt-1 text-sm text-red-600">{fieldErrors.price[0]}</p>}
      </div>

      <div>
        <label htmlFor="quantity_g" className="mb-1 block text-sm font-medium text-gray-700">
          {t('quantityG')}
        </label>
        <input
          id="quantity_g"
          type="number"
          step="0.01"
          min="0"
          value={quantityG}
          onChange={(event) => setQuantityG(event.target.value)}
          className={inputClass}
        />
        {fieldErrors.quantity_g && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.quantity_g[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="currency" className="mb-1 block text-sm font-medium text-gray-700">
          {t('currency')}
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className={inputClass}
        >
          {CURRENCIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {fieldErrors.currency && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.currency[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="store" className="mb-1 block text-sm font-medium text-gray-700">
          {t('store')}
        </label>
        <input
          id="store"
          type="text"
          value={store}
          onChange={(event) => setStore(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="purchased_at" className="mb-1 block text-sm font-medium text-gray-700">
          {t('purchasedAt')}
        </label>
        <input
          id="purchased_at"
          type="date"
          value={purchasedAt}
          onChange={(event) => setPurchasedAt(event.target.value)}
          className={inputClass}
        />
      </div>

      <p className="text-sm text-gray-600">
        {`≈ ${per100g} ${currency} per 100g`}
      </p>

      {upsert.error && (
        <p className="text-sm text-red-600">{upsert.error.message}</p>
      )}

      <button
        type="submit"
        disabled={upsert.isPending}
        className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {tc('save')}
      </button>
    </form>
  )
}
