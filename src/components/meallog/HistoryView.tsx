'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useMealLogHistory } from '@/hooks/useMealLog'
import type { DayHistorySummary } from '@/types/domain'

// RDAs de referencia (adulto)
const RDA = {
  cal: 2000,
  protein_g: 50,
  carbs_g: 275,
  fat_g: 78,
  fiber_g: 28,
  iron_mg: 18,
  calcium_mg: 1000,
  zinc_mg: 11,
  vit_b12_mcg: 2.4,
  vit_d_mcg: 15,
  vit_c_mg: 90,
  omega3_g: 1.6,
}

type NutrientKey = keyof typeof RDA

function pct(value: number | null, key: NutrientKey): number {
  if (value == null) return 0
  return Math.round((value / RDA[key]) * 100)
}

// Semáforo: verde ≥80%, amarillo 50-79%, rojo <50%
function trafficLight(p: number): string {
  if (p >= 80) return 'bg-green-500'
  if (p >= 50) return 'bg-yellow-400'
  return 'bg-red-400'
}

interface NutrientBadgeProps {
  label: string
  value: number | null
  nutrientKey: NutrientKey
  unit: string
}

function NutrientBadge({ label, value, nutrientKey, unit }: NutrientBadgeProps) {
  const p = pct(value, nutrientKey)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${trafficLight(p)}`} />
        <span className="text-xs font-medium text-gray-700">
          {value != null ? `${Math.round(value)}${unit}` : '—'}
        </span>
      </div>
    </div>
  )
}

interface DayRowProps {
  day: DayHistorySummary
  locale: string
}

function DayRow({ day, locale }: DayRowProps) {
  const calP = pct(day.cal, 'cal')

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Fecha + calorías */}
      <div className="flex items-center gap-4 min-w-[160px]">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(day.logged_at + 'T00:00:00').toLocaleDateString(locale, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <p className="text-xs text-gray-400">{day.entry_count} entr{day.entry_count === 1 ? 'ada' : 'adas'}</p>
        </div>
        {/* Barra de calorías */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400">Cal</span>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${trafficLight(calP)}`} />
            <span className="text-xs font-semibold text-gray-800">
              {day.cal != null ? Math.round(day.cal) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="flex flex-wrap gap-3">
        <NutrientBadge label="Prot" value={day.protein_g} nutrientKey="protein_g" unit="g" />
        <NutrientBadge label="Carbs" value={day.carbs_g} nutrientKey="carbs_g" unit="g" />
        <NutrientBadge label="Grasa" value={day.fat_g} nutrientKey="fat_g" unit="g" />
        <NutrientBadge label="Fibra" value={day.fiber_g} nutrientKey="fiber_g" unit="g" />
      </div>

      {/* Micronutrientes clave */}
      <div className="flex flex-wrap gap-3">
        <NutrientBadge label="Fe" value={day.iron_mg} nutrientKey="iron_mg" unit="mg" />
        <NutrientBadge label="Ca" value={day.calcium_mg} nutrientKey="calcium_mg" unit="mg" />
        <NutrientBadge label="Zn" value={day.zinc_mg} nutrientKey="zinc_mg" unit="mg" />
        <NutrientBadge label="B12" value={day.vit_b12_mcg} nutrientKey="vit_b12_mcg" unit="μg" />
        <NutrientBadge label="D" value={day.vit_d_mcg} nutrientKey="vit_d_mcg" unit="μg" />
        <NutrientBadge label="C" value={day.vit_c_mg} nutrientKey="vit_c_mg" unit="mg" />
        <NutrientBadge label="Ω3" value={day.omega3_g} nutrientKey="omega3_g" unit="g" />
      </div>
    </div>
  )
}

interface HistoryViewProps {
  locale: string
}

export default function HistoryView({ locale }: HistoryViewProps) {
  const t = useTranslations('meallog')
  const { user } = useAuth()

  // Últimos 30 días
  const toDate = new Date().toISOString().slice(0, 10)
  const fromDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: history, isLoading } = useMealLogHistory(user?.id ?? '', fromDate, toDate)

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
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />≥ 80% RDA</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" />50–79%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />&lt; 50%</span>
      </div>
      {history.map((day) => (
        <DayRow key={day.logged_at} day={day} locale={locale} />
      ))}
    </div>
  )
}
