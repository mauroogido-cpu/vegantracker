'use client'

import { useState, useMemo, use } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMealLogHistory, useDayLogDetail } from '@/hooks/useMealLog'
import { useRDA } from '@/hooks/useRDA'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { nutrientStatus } from '@/lib/nutrition'
import {
  NutrTable,
  NUTR_COLS,
  ZERO_NUTR,
  sumNutr,
  type NutrKey,
  type NutrValues,
} from '@/components/meallog/NutrDetailTable'
import type { DayHistorySummary } from '@/types/domain'

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  return toISO(new Date(Date.now() - n * 24 * 60 * 60 * 1000))
}

const RANGE_OPTIONS = [
  { label: '7 días',  days: 7  },
  { label: '14 días', days: 14 },
  { label: '30 días', days: 30 },
]

// ── Average helpers ───────────────────────────────────────────────────────────

function buildAverage(days: DayHistorySummary[]): NutrValues {
  if (days.length === 0) return { ...ZERO_NUTR }
  const keys = Object.keys(ZERO_NUTR) as NutrKey[]
  const sum = { ...ZERO_NUTR }
  for (const d of days) {
    for (const k of keys) {
      sum[k] += (d as unknown as Record<string, number | null>)[k] ?? 0
    }
  }
  const avg = { ...sum }
  for (const k of keys) avg[k] /= days.length
  return avg
}

// ── RDA progress bar ──────────────────────────────────────────────────────────

function RdaBar({ nk, value, rda }: { nk: NutrKey; value: number; rda: Record<string, number> }) {
  const rdaVal = rda[nk]
  if (!rdaVal) return null
  const pct = Math.min((value / rdaVal) * 100, 150)
  const { dot } = nutrientStatus(value, rdaVal, nk)
  const barColor =
    dot === 'bg-green-500'  ? 'bg-green-500'  :
    dot === 'bg-yellow-400' ? 'bg-yellow-400' :
    dot === 'bg-red-400'    ? 'bg-red-400'    :
    dot === 'bg-orange-400' ? 'bg-orange-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-gray-200">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500">{Math.round(pct)}%</span>
    </div>
  )
}

// ── Period summary ────────────────────────────────────────────────────────────

function PeriodSummary({ days, rda }: { days: DayHistorySummary[]; rda: Record<string, number> }) {
  const avg = buildAverage(days)

  const deficits = NUTR_COLS.filter((c) => {
    const rdaVal = rda[c.key]
    if (!rdaVal) return false
    return avg[c.key] / rdaVal < 0.5
  })

  return (
    <section className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm print:shadow-none">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Promedio diario — {days.length} día{days.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {deficits.length > 0 && (
        <div className="border-b border-gray-100 bg-red-50 px-5 py-3">
          <p className="mb-1.5 text-xs font-semibold text-red-700">
            ⚠ Déficit recurrente (&lt; 50% RDA en promedio)
          </p>
          <div className="flex flex-wrap gap-2">
            {deficits.map((c) => (
              <span key={c.key} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {c.label} {c.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {NUTR_COLS.map((c) => (
          <div key={c.key} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {c.label} {c.unit}
            </span>
            <span className="text-sm font-semibold text-gray-800 tabular-nums">
              {avg[c.key].toFixed(c.dec)}
            </span>
            <RdaBar nk={c.key} value={avg[c.key]} rda={rda} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Single day section ────────────────────────────────────────────────────────

function ReportDaySection({ day, locale, userId }: { day: DayHistorySummary; locale: string; userId: string }) {
  const { data: detail, isLoading } = useDayLogDetail(userId, day.logged_at, true, locale)
  const units = usePrefsStore((s) => s.units)

  const dateStr = new Date(day.logged_at + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <section className="mb-8 print:break-inside-avoid">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize text-gray-800">{dateStr}</h3>
        <span className="text-xs text-gray-400">
          {day.entry_count} entrada{day.entry_count !== 1 ? 's' : ''} · {Math.round(day.cal ?? 0)} kcal
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />)}
        </div>
      ) : (
        <NutrTable entries={detail ?? []} units={units} showMealType showGroups />
      )}
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { user } = useAuth()
  const { rda }  = useRDA()
  const [rangeDays, setRangeDays] = useState(7)

  const toDate   = useMemo(() => toISO(new Date()), [])
  const fromDate = useMemo(() => daysAgo(rangeDays - 1), [rangeDays])

  const { data: history, isLoading } = useMealLogHistory(fromDate, toDate)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Toolbar */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Reporte nutricional</h1>
            <p className="text-sm text-gray-500">{fromDate} → {toDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 text-sm">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setRangeDays(opt.days)}
                  className={`px-3 py-1.5 transition-colors ${
                    rangeDays === opt.days
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold text-gray-900">Reporte nutricional</h1>
          <p className="text-sm text-gray-500">{fromDate} → {toDate}</p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
            <p className="text-sm text-gray-500">Sin registros en el período seleccionado.</p>
          </div>
        )}

        {!isLoading && history && history.length > 0 && (
          <>
            <PeriodSummary days={history} rda={rda} />

            <div className="no-print mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />≥ 80% RDA</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" />50–79%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />&lt; 50%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />Cerca del límite (UL)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Excede límite seguro</span>
            </div>

            {history.map((day) => (
              <ReportDaySection
                key={day.logged_at}
                day={day}
                locale={locale}
                userId={user?.id ?? ''}
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}
