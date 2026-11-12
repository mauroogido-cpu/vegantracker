'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUserIngredient,
  deleteUserIngredient,
  getUserIngredients,
  searchUserIngredients,
  submitForReview,
  updateUserIngredient,
} from '@/lib/api/userIngredients'
import type { UserIngredientInput } from '@/types/domain'

const QUERY_KEY = ['user_ingredients'] as const

/** All user ingredients (sorted by name) */
export function useUserIngredients() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getUserIngredients,
    staleTime: 1000 * 60 * 5,
  })
}

/** Search within the user's own ingredient list */
export function useUserIngredientSearch(query: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'search', query],
    queryFn: () => searchUserIngredients(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 2,
  })
}

/** Create */
export function useCreateUserIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UserIngredientInput) => createUserIngredient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Update */
export function useUpdateUserIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UserIngredientInput> }) =>
      updateUserIngredient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Delete */
export function useDeleteUserIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUserIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Submit for promotion to public catalog */
export function useSubmitForReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
