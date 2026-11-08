'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMealLog, getDayLog, logMeal } from '@/lib/api/meallog'

export function useDayLog(userId: string, date: string) {
  return useQuery({
    queryKey: ['meallog', userId, date],
    queryFn: () => getDayLog(userId, date),
    enabled: !!userId && !!date,
    staleTime: 1000 * 60,
  })
}

export function useLogMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meallog'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteMealLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMealLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meallog'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
