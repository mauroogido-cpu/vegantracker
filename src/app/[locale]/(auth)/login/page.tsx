'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(6),
})

type FieldErrors = Partial<Record<'email' | 'password', string[]>>

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors)
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    setSubmitting(false)

    if (error) {
      setFormError(error.message)
      return
    }

    router.push(`/${locale}/app/dashboard`)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t('loginTitle')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {t('login')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href={`/${locale}/signup`} className="font-medium text-primary-600 hover:underline">
          {t('signup')}
        </Link>
      </p>
    </div>
  )
}
