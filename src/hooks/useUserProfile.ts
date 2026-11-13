'use client'

/**
 * useUserProfile — load and save the user_profiles row.
 *
 * Returns the current profile (null if not yet created) and
 * a save() function that upserts it. Also exposes isLoading
 * and error states.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'

export interface UserProfile {
  user_id:        string
  sex:            'male' | 'female' | 'other' | null
  age:            number | null
  weight_kg:      number | null
  height_cm:      number | null
  activity_level: ActivityLevel
  pregnant:       boolean
  lactating:      boolean
  locale:         string
  currency:       string
}

type ProfileInput = Omit<UserProfile, 'user_id'>

export function useUserProfile() {
  const [profile,   setProfile]   = useState<UserProfile | null>(null)
  const [isLoading, setLoading]   = useState(true)
  const [isSaving,  setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  const supabase = createClient()

  // Load on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    supabase
      .from('user_profiles')
      .select('*')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setProfile(data as UserProfile | null)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (input: ProfileInput) => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    const row = { user_id: user.id, ...input }

    const { error: err } = await supabase
      .from('user_profiles')
      .upsert(row, { onConflict: 'user_id' })

    if (err) {
      setError(err.message)
    } else {
      setProfile(row as UserProfile)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }, [supabase])

  return { profile, isLoading, isSaving, error, success, save }
}
