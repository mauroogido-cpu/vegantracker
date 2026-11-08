'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import RecipeBuilder from '@/components/recipes/RecipeBuilder'
import RecipeForm from '@/components/recipes/RecipeForm'
import { useAuth } from '@/hooks/useAuth'
import { useDeleteRecipe, useUserRecipes } from '@/hooks/useRecipes'

type View = 'list' | 'create' | 'detail' | 'edit'

export default function RecipesPage() {
  const t = useTranslations('recipe')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const { data: recipes } = useUserRecipes(user?.id ?? '')
  const deleteRecipe = useDeleteRecipe()

  const [view, setView] = useState<View>('list')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  if (!user) return null

  if (view === 'create') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView('list')}
          className="mb-4 rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          {t('back')}
        </button>
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t('newRecipe')}</h1>
        <RecipeForm
          onSuccess={(recipe) => {
            setSelectedRecipeId(recipe.id)
            setView('detail')
          }}
        />
      </div>
    )
  }

  if (view === 'edit' && selectedRecipeId) {
    const recipeToEdit = recipes?.find((r) => r.id === selectedRecipeId)

    if (!recipeToEdit) {
      setView('list')
      return null
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setView('list')
            setSelectedRecipeId(null)
          }}
          className="mb-4 rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          {t('back')}
        </button>
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t('editRecipe')}</h1>
        <RecipeForm existingRecipe={recipeToEdit} onSuccess={() => setView('list')} />
      </div>
    )
  }

  if (view === 'detail' && selectedRecipeId) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setView('list')
            setSelectedRecipeId(null)
          }}
          className="mb-4 rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          {t('back')}
        </button>
        <RecipeBuilder recipeId={selectedRecipeId} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t('myRecipes')}</h1>
        <button
          type="button"
          onClick={() => setView('create')}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          {t('newRecipe')}
        </button>
      </div>

      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto w-full">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('categoryLabel')}</th>
              <th className="px-4 py-3">{t('servings')}</th>
              <th className="px-4 py-3">{t('isPublic')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recipes?.map((recipe) => (
              <tr key={recipe.id}>
                <td className="px-4 py-3 text-gray-900">{recipe.name}</td>
                <td className="px-4 py-3 text-gray-700">{t(`category.${recipe.category}`)}</td>
                <td className="px-4 py-3 text-gray-700">{recipe.servings}</td>
                <td className="px-4 py-3 text-gray-700">{recipe.is_public ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipeId(recipe.id)
                        setView('detail')
                      }}
                      className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                    >
                      {t('open')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipeId(recipe.id)
                        setView('edit')
                      }}
                      className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                    >
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecipe.mutate(recipe.id)}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      {tc('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!recipes || recipes.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
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
