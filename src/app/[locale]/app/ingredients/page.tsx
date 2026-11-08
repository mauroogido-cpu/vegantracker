'use client'

import { useLocale, useTranslations } from 'next-intl'
import IngredientTabs from '@/components/ingredients/tabs/IngredientTabs'
import { useAllIngredients } from '@/hooks/useIngredients'

export default function IngredientsPage() {
  const t = useTranslations('ingredient')
  const locale = useLocale()
  const { data: ingredients, isLoading } = useAllIngredients(locale)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t('title')}</h1>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 animate-pulse rounded bg-gray-200" />
        </div>
      ) : (
        <IngredientTabs ingredients={ingredients ?? []} locale={locale} />
      )}
    </div>
  )
}
