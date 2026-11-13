'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMealLog, getDayLog, getDayLogDetail, getMealLogHistory, logMeal, updateMealLog } from '@/lib/api/meallog'
import type { LogMealPayload } from '@/lib/api/meallog'

export function useDayLog(userId: string, date: string) {
  return useQuery({
    queryKey: ['meallog', userId, date],
    queryFn: () => getDayLog(userId, date),
    enabled: !!userId && !!date,
    staleTime: 1000 * 60,
  })
}

export function useDayLogDetail(userId: string, date: string, enabled: boolean, locale: string) {
  return useQuery({
    queryKey: ['meallog', 'detail', userId, date, locale],
    queryFn: () => getDayLogDetail(userId, date, locale),
    enabled: !!userId && !!date && enabled,
    staleTime: 1000 * 60 * 5,
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

export function useMealLogHistory(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['meallog', 'history', fromDate, toDate],
    queryFn: () => getMealLogHistory(fromDate, toDate),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateMealLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LogMealPayload }) =>
      updateMealLog(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meallog'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
