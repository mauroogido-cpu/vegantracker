'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import IngredientDetailModal from '@/components/ingredients/IngredientDetailModal'
import { CATEGORIES } from '@/constants/nutrition'
import type { Ingredient } from '@/types/domain'

export default function CategoryView({
  ingredients,
  locale,
}: {
  ingredients: Ingredient[]
  locale: string
}) {
  const t = useTranslations('ingredient')

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [selected, setSelected] = useState<Ingredient | null>(null)

  const search = searchText.trim().toLowerCase()
  const filtered = ingredients.filter(
    (ingredient) =>
      (activeCategory === 'all' || ingredient.category === activeCategory) &&
      (search === '' || ingredient.name.toLowerCase().includes(search))
  )

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${
      active ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={chipClass(activeCategory === 'all')}
        >
          {t('category.all')}
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setActiveCategory(category.value)}
            className={chipClass(activeCategory === category.value)}
          >
            {t(`category.${category.value}`)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((ingredient) => (
          <button
            key={ingredient.id}
            type="button"
            onClick={() => setSelected(ingredient)}
            className="rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-green-400 hover:shadow"
          >
            <p className="text-sm font-medium text-gray-900">{ingredient.name}</p>
            <p className="text-xs text-gray-500">{t(`category.${ingredient.category}`)}</p>
            <p className="mt-2 text-xs text-gray-700">{ingredient.cal} kcal</p>
            <p className="text-xs text-gray-700">{ingredient.protein_g}g prot</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-500">{t('noResults')}</p>
      )}

      {selected && (
        <IngredientDetailModal ingredient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
