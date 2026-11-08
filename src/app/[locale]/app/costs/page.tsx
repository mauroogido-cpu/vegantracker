'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import CostForm from '@/components/costs/CostForm'
import IngredientSearch from '@/components/ingredients/IngredientSearch'
import { useAuth } from '@/hooks/useAuth'
import { useDeleteCost, useUserCosts } from '@/hooks/useCosts'
import { getAllIngredients } from '@/lib/api/ingredients'
import type { Ingredient, IngredientCost } from '@/types/domain'

export default function CostsPage() {
  const t = useTranslations('ingredient')
  const tc = useTranslations('common')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()

  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [editingCost, setEditingCost] = useState<IngredientCost | null>(null)

  const { data: costs } = useUserCosts(user?.id ?? '')
  const deleteCost = useDeleteCost()

  const { data: allIngredients } = useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })

  const nameMap = useMemo(
    () =>
      new Map(
        (allIngredients ?? []).map((ingredient) => [ingredient.id, ingredient.name] as const)
      ),
    [allIngredients]
  )

  if (!user) return null

  function handleEdit(cost: IngredientCost) {
    setEditingCost(cost)
    setSelectedIngredient({
      id: cost.ingredient_id,
      name: nameMap.get(cost.ingredient_id) ?? '',
    } as Ingredient)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t('myCosts')}</h1>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <IngredientSearch
          onSelect={(ingredient) => {
            setSelectedIngredient(ingredient)
            setEditingCost(null)
          }}
        />

        {selectedIngredient && (
          <div className="mt-4">
            <CostForm
              ingredientId={selectedIngredient.id}
              ingredientName={selectedIngredient.name}
              existingCost={editingCost ?? undefined}
              onSuccess={() => {
                setSelectedIngredient(null)
                setEditingCost(null)
              }}
            />
          </div>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto w-full">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">{t('title')}</th>
              <th className="px-4 py-3">{t('price')}</th>
              <th className="px-4 py-3">{t('quantityG')}</th>
              <th className="px-4 py-3">{t('pricePer100g')}</th>
              <th className="px-4 py-3">{t('currency')}</th>
              <th className="px-4 py-3">{t('store')}</th>
              <th className="px-4 py-3">{t('purchasedAt')}</th>
              <th className="px-4 py-3">{tc('edit')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {costs?.map((cost) => (
              <tr key={cost.id}>
                <td className="px-4 py-3 text-gray-900">
                  {nameMap.get(cost.ingredient_id) ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">{cost.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-700">{cost.quantity_g}</td>
                <td className="px-4 py-3 text-gray-700">
                  {cost.price_per_100g?.toFixed(2) ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">{cost.currency}</td>
                <td className="px-4 py-3 text-gray-700">{cost.store ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{cost.purchased_at ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(cost)}
                      className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                    >
                      {tc('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCost.mutate(cost.id)}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      {tc('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!costs || costs.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                  {tc('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  )
}
