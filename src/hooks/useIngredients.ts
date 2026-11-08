'use client'

import { useQuery } from '@tanstack/react-query'
import { getIngredientById, searchIngredients } from '@/lib/api/ingredients'

export function useIngredientSearch(query: string, locale: string) {
  return useQuery({
    queryKey: ['ingredients', 'search', query, locale],
    queryFn: () => searchIngredients(query, locale),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })
}

export function useIngredientById(id: string, locale: string) {
  return useQuery({
    queryKey: ['ingredients', id, locale],
    queryFn: () => getIngredientById(id, locale),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}
