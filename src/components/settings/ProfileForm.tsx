'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserProfile } from '@/hooks/useUserProfile'

const LOCALES  = ['en', 'es'] as const
const CURRENCIES = ['PEN', 'ARS', 'USD', 'EUR', 'INR', 'BRL', 'JPY'] as const

type Sex = 'male' | 'female' | 'other' | ''

export default function ProfileForm() {
  const { profile, isLoading, isSaving, error, success, save } = useUserProfile()
  const router   = useRouter()
  const pathname = usePathname()

  // ── Form state ──────────────────────────────────────────────
  const [sex,       setSex]       = useState<Sex>('')
  const [age,       setAge]       = useState('')
  const [weightKg,  setWeightKg]  = useState('')
  const [pregnant,  setPregnant]  = useState(false)
  const [lactating, setLactating] = useState(false)
  const [locale,    setLocale]    = useState('es')
  const [currency,  setCurrency]  = useState('PEN')

  // ── Populate from loaded profile ────────────────────────────
  useEffect(() => {
    if (!profile) return
    setSex((profile.sex ?? '') as Sex)
    setAge(profile.age?.toString() ?? '')
    setWeightKg(profile.weight_kg?.toString() ?? '')
    setPregnant(profile.pregnant)
    setLactating(profile.lactating)
    setLocale(profile.locale)
    setCurrency(profile.currency)
  }, [profile])

  // ── Switch locale in URL after save ─────────────────────────
  useEffect(() => {
    if (!success) return
    // Replace /[locale]/app/settings → /[newLocale]/app/settings
    const segments = pathname.split('/')
    if (segments[1] !== locale) {
      segments[1] = locale
      router.push(segments.join('/'))
    }
  }, [success, locale, pathname, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await save({
      sex:       (sex || null) as 'male' | 'female' | 'other' | null,
      age:       age       ? Number(age)       : null,
      weight_kg: weightKg  ? Number(weightKg)  : null,
      pregnant,
      lactating,
      locale,
      currency,
    })
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading profile…</p>
  }

  const showBio = sex === 'female'   // show pregnancy/lactation only for female

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Nutritional profile ───────────────────────────── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Nutritional profile
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Used to personalise your daily RDA targets. All fields are optional —
          leave blank to use generic adult reference values.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Sex */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Sex</label>
            <select
              value={sex}
              onChange={(e) => { setSex(e.target.value as Sex); setPregnant(false); setLactating(false) }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">— not specified —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / prefer not to say</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              min={1} max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="years"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Weight</label>
            <div className="relative">
              <input
                type="number"
                min={1} max={500} step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="kg"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="pointer-events-none absolute right-3 top-2 text-xs text-gray-400">kg</span>
            </div>
          </div>
        </div>

        {/* Pregnant / lactating — only for female */}
        {showBio && (
          <div className="mt-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={pregnant}
                onChange={(e) => { setPregnant(e.target.checked); if (e.target.checked) setLactating(false) }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Pregnant
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={lactating}
                onChange={(e) => { setLactating(e.target.checked); if (e.target.checked) setPregnant(false) }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Lactating
            </label>
          </div>
        )}

        {/* Vegan multiplier note */}
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
          🌱 Vegan bioavailability adjustments are applied automatically:
          iron ×1.8 · zinc ×1.5 (Academy of Nutrition and Dietetics, 2016)
        </p>
      </section>

      {/* ── App preferences ──────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          App preferences
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Language */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
            <div className="flex gap-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    locale === loc
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {loc === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Feedback & submit ─────────────────────────────── */}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          ✓ Profile saved. RDA targets updated.
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}
