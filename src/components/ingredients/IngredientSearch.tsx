'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useIngredientSearch } from '@/hooks/useIngredients'
import type { Ingredient } from '@/types/domain'

export default function IngredientSearch({
  onSelect,
}: {
  onSelect: (ingredient: Ingredient) => void
}) {
  const t = useTranslations('ingredient')
  const { locale } = useParams<{ locale: string }>()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isPending } = useIngredientSearch(debouncedQuery, locale)

  function handleSelect(ingredient: Ingredient) {
    onSelect(ingredient)
    setQuery('')
    setDebouncedQuery('')
  }

  const showLoading = isPending && query.length >= 2
  const showEmpty = !isPending && query.length >= 2 && data?.length === 0

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {showLoading && <p className="mt-3 text-sm text-gray-500">...</p>}

      {data && data.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-md border border-gray-200 bg-white">
          {data.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => handleSelect(ingredient)}
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-primary-50"
              >
                {ingredient.name ?? ingredient.name_en}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && <p className="mt-3 text-sm text-gray-500">{t('noResults')}</p>}
    </div>
  )
}
