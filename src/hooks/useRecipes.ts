'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addRecipeIngredient,
  createRecipe,
  deleteRecipe,
  getRecipeWithIngredients,
  getUserRecipes,
  removeRecipeIngredient,
  updateRecipe,
} from '@/lib/api/recipes'

export function useUserRecipes(userId: string) {
  return useQuery({
    queryKey: ['recipes', userId],
    queryFn: () => getUserRecipes(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useRecipe(recipeId: string, locale: string) {
  return useQuery({
    queryKey: ['recipe', recipeId, locale],
    queryFn: () => getRecipeWithIngredients(recipeId, locale),
    enabled: !!recipeId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof updateRecipe>[1]
    }) => updateRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe'] })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useAddRecipeIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addRecipeIngredient,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipe_id] })
    },
  })
}

export function useRemoveRecipeIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; recipeId: string }) => removeRecipeIngredient(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    },
  })
}
