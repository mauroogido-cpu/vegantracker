import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import AppNav from '@/components/nav/AppNav'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav locale={locale} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
