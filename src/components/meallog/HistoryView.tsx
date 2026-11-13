'use client'
import { Fragment } from 'react'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useMealLogHistory, useDayLogDetail } from '@/hooks/useMealLog'
import type { DayHistorySummary } from '@/types/domain'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useRDA } from '@/hooks/useRDA'
import { nutrientStatus } from '@/lib/nutrition'
import {
  NutrTable,
  type NutrKey,
} from '@/components/meallog/NutrDetailTable'

// NutrKey — subset of nutrient keys used in this component
type LocalNutrKey = NutrKey

// ---------------------------------------------------------------------------
// Nutrient badge config (collapsed summary row)
// ---------------------------------------------------------------------------
const BADGE_COLS: { key: LocalNutrKey; label: string; unit: string }[] = [
  { key: 'protein_g',   label: 'Prot',  unit: 'g'  },
  { key: 'carbs_g',     label: 'Carbs', unit: 'g'  },
  { key: 'fat_g',       label: 'Grasa', unit: 'g'  },
  { key: 'fiber_g',     label: 'Fibra', unit: 'g'  },
]

const MICRO_BADGE_COLS: { key: LocalNutrKey; label: string; unit: string }[] = [
  { key: 'iron_mg',     label: 'Fe',  unit: 'mg' },
  { key: 'calcium_mg',  label: 'Ca',  unit: 'mg' },
  { key: 'zinc_mg',     label: 'Zn',  unit: 'mg' },
  { key: 'vit_b12_mcg', label: 'B12', unit: 'μg' },
  { key: 'vit_c_mg',    label: 'C',   unit: 'mg' },
  { key: 'omega3_g',    label: 'Ω3',  unit: 'g'  },
]

// ---------------------------------------------------------------------------
// Summary badge (collapsed row)
// ---------------------------------------------------------------------------
function NutrientBadge({
  label,
  value,
  nk,
  unit,
  rda,
}: {
  label: string
  value: number | null
  nk:    LocalNutrKey
  unit:  string
  rda:   Record<string, number>
}) {
  const status = nutrientStatus(value ?? 0, rda[nk] ?? 1, nk)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
        <span className="text-xs font-medium text-gray-700">
          {value != null ? `${Math.round(value)}${unit}` : '—'}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DayRow — collapsed summary + expandable detail
// ---------------------------------------------------------------------------
interface DayRowProps {
  day:    DayHistorySummary
  locale: string
  userId: string
}

function DayRow({ day, locale, userId }: DayRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { data: detail, isLoading } = useDayLogDetail(userId, day.logged_at, expanded, locale)
  const units    = usePrefsStore((s) => s.units)
  const { rda }  = useRDA()

  const calStatus = nutrientStatus(day.cal ?? 0, rda['cal'] ?? 1, 'cal')

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Clickable summary header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50 transition-colors"
      >
        {/* Fecha + calorías + chevron */}
        <div className="flex items-center gap-3 min-w-[160px]">
          {/* Chevron */}
          <span className="text-gray-400 flex-shrink-0">
            {expanded ? (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(day.logged_at + 'T00:00:00').toLocaleDateString(locale, {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </p>
            <p className="text-xs text-gray-400">
              {day.entry_count} entr{day.entry_count === 1 ? 'ada' : 'adas'}
            </p>
          </div>
          {/* Calorías */}
          <div className="flex flex-col items-center ml-2">
            <span className="text-[10px] text-gray-400">Cal</span>
            <div className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${calStatus.dot}`} />
              <span className="text-xs font-semibold text-gray-800">
                {day.cal != null ? Math.round(day.cal) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="flex flex-wrap gap-3">
          {BADGE_COLS.map((c) => (
            <NutrientBadge
              key={c.key}
              label={c.label}
              value={day[c.key as keyof DayHistorySummary] as number | null}
              nk={c.key}
              unit={c.unit}
              rda={rda}
            />
          ))}
        </div>

        {/* Micronutrientes */}
        <div className="flex flex-wrap gap-3">
          {MICRO_BADGE_COLS.map((c) => (
            <NutrientBadge
              key={c.key}
              label={c.label}
              value={day[c.key as keyof DayHistorySummary] as number | null}
              nk={c.key}
              unit={c.unit}
              rda={rda}
            />
          ))}
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : (
            <NutrTable entries={detail ?? []} units={units} showMealType />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HistoryView (main export)
// ---------------------------------------------------------------------------
interface HistoryViewProps {
  locale: string
}

export default function HistoryView({ locale }: HistoryViewProps) {
  const t      = useTranslations('meallog')
  const { user } = useAuth()

  const toDate   = new Date().toISOString().slice(0, 10)
  const fromDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: history, isLoading } = useMealLogHistory(fromDate, toDate)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-sm text-gray-500">{t('noHistory')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Leyenda semáforo */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-1">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />≥ 80% RDA
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />50–79%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />&lt; 50%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-400" />Cerca del límite (UL)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />Excede límite seguro
        </span>
      </div>
      {history.map((day) => (
        <DayRow key={day.logged_at} day={day} locale={locale} userId={user?.id ?? ''} />
      ))}
    </div>
  )
}
