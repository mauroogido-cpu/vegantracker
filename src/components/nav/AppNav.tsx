'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import UserMenu from './UserMenu'

export default function AppNav({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const base = `/${locale}/app`

  const links = [
    { path: `${base}/dashboard`,   key: 'dashboard'    },
    { path: `${base}/meallog`,     key: 'meallog'      },
    { path: `${base}/recipes`,     key: 'recipes'      },
    { path: `${base}/ingredients`, key: 'ingredients'  },
    { path: `${base}/costs`,       key: 'costs'        },
    { path: `${base}/settings`,    key: 'settings'     },
  ] as const

  function isActive(path: string) {
    return pathname?.includes(path) ?? false
  }

  function linkClass(active: boolean) {
    return active
      ? 'bg-green-900 rounded px-2 py-1'
      : 'rounded px-2 py-1 hover:bg-green-600'
  }

  return (
    <nav className="w-full bg-green-700 px-4 py-3 text-white">
      <div className="flex items-center justify-between">
        <Link href={`${base}/dashboard`} className="text-lg font-semibold">
          🌱 Vegan Tracker
        </Link>

        {/* Desktop links + UserMenu */}
        <div className="hidden items-center gap-3 md:flex">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-sm ${linkClass(isActive(link.path))}`}
            >
              {t(link.key)}
            </Link>
          ))}
          <UserMenu locale={locale} />
        </div>

        {/* Mobile: hamburger + UserMenu */}
        <div className="flex items-center gap-2 md:hidden">
          <UserMenu locale={locale} />
          <button
            type="button"
            aria-label={t('menu')}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile dropdown links */}
      {open && (
        <div className="mt-2 flex flex-col gap-1 border-t border-green-600 pt-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setOpen(false)}
              className={`text-sm ${linkClass(isActive(link.path))}`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
