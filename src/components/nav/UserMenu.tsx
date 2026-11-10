'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type { UnitSystem } from '@/stores/usePrefsStore'
import { locales, type Locale } from '@/i18n'

const LOCALE_LABELS: Record<Locale, string> = {
  en: '🇺🇸 EN',
  es: '🇪🇸 ES',
}

const UNIT_LABELS: Record<UnitSystem, string> = {
  g: 'g (grams)',
  oz: 'oz (ounces)',
}

interface UserMenuProps {
  locale: string
}

export default function UserMenu({ locale }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { units, setUnits } = usePrefsStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function switchLocale(next: Locale) {
    if (next === locale) return
    // Replace the locale segment in the URL: /en/app/... → /es/app/...
    const newPath = pathname.replace(new RegExp(`^/${locale}`), `/${next}`)
    router.push(newPath)
    setOpen(false)
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-800 text-xs font-bold text-white hover:bg-green-900 transition-colors"
        aria-label="User settings"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg text-gray-800">
          {/* Email */}
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="truncate text-sm font-medium text-gray-900">{user?.email}</p>
          </div>

          {/* Language */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Language</p>
            <div className="flex gap-2">
              {locales.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => switchLocale(loc as Locale)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    loc === locale
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {LOCALE_LABELS[loc as Locale]}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Weight units</p>
            <div className="flex gap-2">
              {(Object.keys(UNIT_LABELS) as UnitSystem[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnits(u)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    u === units
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {u === 'g' ? '⚖️ g' : '🔢 oz'}
                </button>
              ))}
            </div>
            {units === 'oz' && (
              <p className="mt-1.5 text-[11px] text-gray-400">1 oz = 28.35 g</p>
            )}
          </div>

          {/* Sign out */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => { void signOut(); setOpen(false) }}
              className="w-full rounded-lg bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
