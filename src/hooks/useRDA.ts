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
 *   const { rda, source, isLoading } = useRDA()
 *   // rda is always a full Record<string, number> — never undefined
 *   // source: 'profile' | 'default'
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RDA as DEFAULT_RDA } from '@/constants/nutrition'

export type RDASource = 'profile' | 'default'

export interface UseRDAResult {
  rda: Record<string, number>
  source: RDASource
  isLoading: boolean
}

export function useRDA(): UseRDAResult {
  const [rda, setRda]         = useState<Record<string, number>>(DEFAULT_RDA)
  const [source, setSource]   = useState<RDASource>('default')
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    Promise.resolve(supabase.rpc('get_rda_for_user'))
      .then(({ data, error }) => {
        if (cancelled) return

        if (!error && data && typeof data === 'object') {
          const { source: src, ...nutrients } = data as Record<string, unknown>
          // Merge with DEFAULT_RDA so any new nutrient keys added later in
          // constants/nutrition.ts are always present (graceful forward-compat).
          setRda({ ...DEFAULT_RDA, ...(nutrients as Record<string, number>) })
          setSource((src as RDASource) ?? 'default')
        }
        // On error or missing data: state stays at DEFAULT_RDA / 'default'
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { rda, source, isLoading }
}
