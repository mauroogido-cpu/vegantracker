'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCost, getUserCosts, upsertCost } from '@/lib/api/costs'

export function useUserCosts(userId: string) {
  return useQuery({
    queryKey: ['costs', userId],
    queryFn: () => getUserCosts(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useUpsertCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] })
    },
  })
}

export function useDeleteCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] })
    },
  })
}
