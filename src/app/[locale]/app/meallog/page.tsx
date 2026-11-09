'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import DayView from '@/components/meallog/DayView'
import HistoryView from '@/components/meallog/HistoryView'
import { useAuth } from '@/hooks/useAuth'

type Tab = 'today' | 'history'

const getLocalDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MealLogPage() {
  const t = useTranslations('meallog')
  const { locale } = useParams<{ locale: string }>()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    setTodayDate(getLocalDateString())
  }, [])

  if (!user || !todayDate) return null

  return (
    <div>
      {/* Título + tabs */}
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">{t('title')}</h1>

        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          <TabButton active={activeTab === 'today'} onClick={() => setActiveTab('today')}>
            {t('today')}
          </TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            {t('historyTab')}
          </TabButton>
        </div>
      </div>

      {activeTab === 'today' ? (
        <DayView date={todayDate} locale={locale} />
      ) : (
        <HistoryView locale={locale} />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
