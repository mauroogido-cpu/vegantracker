'use client'

import { useState } from 'react'
import CategoryView from '@/components/ingredients/tabs/CategoryView'
import ComparatorView from '@/components/ingredients/tabs/ComparatorView'
import NutrientExplorerView from '@/components/ingredients/tabs/NutrientExplorerView'
import NutrientRankingView from '@/components/ingredients/tabs/NutrientRankingView'
import VeganCriticalView from '@/components/ingredients/tabs/VeganCriticalView'
import MyProductsView from '@/components/ingredients/tabs/MyProductsView'
import type { Ingredient } from '@/types/domain'

const TABS = [
  { key: 'categories', label: 'Categorías' },
  { key: 'ranking', label: 'Ranking' },
  { key: 'critical', label: 'Nutrientes Críticos' },
  { key: 'comparator', label: 'Comparador' },
  { key: 'explorer',    label: 'Explorador'    },
  { key: 'myproducts', label: 'Mis Productos' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function IngredientTabs({
  ingredients,
  locale,
}: {
  ingredients: Ingredient[]
  locale: string
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('categories')

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm transition ${
              activeTab === tab.key
                ? 'border-b-2 border-green-700 font-medium text-green-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'categories' && <CategoryView ingredients={ingredients} locale={locale} />}
      {activeTab === 'ranking' && <NutrientRankingView ingredients={ingredients} />}
      {activeTab === 'critical' && <VeganCriticalView ingredients={ingredients} />}
      {activeTab === 'comparator' && <ComparatorView ingredients={ingredients} />}
      {activeTab === 'explorer'    && <NutrientExplorerView ingredients={ingredients} />}
      {activeTab === 'myproducts' && <MyProductsView />}
    </div>
  )
}
