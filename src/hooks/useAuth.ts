'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types/domain'

function toUser(user: SupabaseUser | null | undefined): User | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    created_at: user.created_at,
  }
}

export function useAuth() {
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const supabase = createClient()

  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    let active = true
    setLoading(true)

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(toUser(data.user))
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(toUser(session?.user))
      setLoading(false)
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase, setUser, setLoading])

  async function signOut() {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  return { user, loading, signOut }
}
