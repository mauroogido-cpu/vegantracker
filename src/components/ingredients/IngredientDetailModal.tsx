'use client'

import NutritionCard from '@/components/ingredients/NutritionCard'
import type { Ingredient } from '@/types/domain'

export default function IngredientDetailModal({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{ingredient.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <NutritionCard ingredient={ingredient} grams={100} />
        </div>
      </div>
    </div>
  )
}
