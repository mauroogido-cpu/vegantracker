'use client'

/**
 * useRDA — personalised Recommended Daily Allowances
 *
 * Fetches the user's RDA from the Supabase RPC get_rda_for_user().
 * Falls back to the hardcoded generic adult values in
 * src/constants/nutrition.ts when:
 *   • the user has no profile row
 *   • the profile is missing sex / age
 *   • the RPC call fails (network error, offline, etc.)
 *
 * Usage:
 *   const { rda, rdaMeta, source, isLoading } = useRDA()
 *
 * rdaMeta fields (null when source === 'default'):
 *   tdee         → calculated TDEE in kcal (null if not Mifflin-derived)
 *   weightKg     → user weight used for protein calculation
 *   calSource    → 'calculated' | 'table' | 'default'
 *   macrosSource → 'derived' | 'table' | 'default'
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RDA as DEFAULT_RDA } from '@/constants/nutrition'

export type RDASource = 'profile' | 'default'

export interface RDAMeta {
  tdee:         number | null
  weightKg:     number | null
  calSource:    'calculated' | 'table' | 'default'
  macrosSource: 'derived' | 'table' | 'default'
}

const DEFAULT_META: RDAMeta = {
  tdee:         null,
  weightKg:     null,
  calSource:    'default',
  macrosSource: 'default',
}

export interface UseRDAResult {
  rda:      Record<string, number>
  rdaMeta:  RDAMeta
  source:   RDASource
  isLoading: boolean
}

export function useRDA(): UseRDAResult {
  const [rda,     setRda]     = useState<Record<string, number>>(DEFAULT_RDA)
  const [rdaMeta, setRdaMeta] = useState<RDAMeta>(DEFAULT_META)
  const [source,  setSource]  = useState<RDASource>('default')
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    Promise.resolve(supabase.rpc('get_rda_for_user'))
      .then(({ data, error }) => {
        if (cancelled) return

        if (!error && data && typeof data === 'object') {
          const raw = data as Record<string, unknown>
          const { source: src, cal_source, macros_source,
                  tdee, weight_kg, ...nutrients } = raw

          setRda({ ...DEFAULT_RDA, ...(nutrients as Record<string, number>) })
          setSource((src as RDASource) ?? 'default')
          setRdaMeta({
            tdee:         (tdee as number | null) ?? null,
            weightKg:     (weight_kg as number | null) ?? null,
            calSource:    (cal_source  as RDAMeta['calSource'])  ?? 'default',
            macrosSource: (macros_source as RDAMeta['macrosSource']) ?? 'default',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { rda, rdaMeta, source, isLoading }
}
