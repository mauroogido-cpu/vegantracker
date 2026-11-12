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
  const [selectedDate, setSelectedDate] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const d = getLocalDateString()
    setTodayDate(d)
    setSelectedDate(d)
  }, [])

  // Reset edit mode when switching tabs
  useEffect(() => {
    if (activeTab !== 'today') setIsEditing(false)
  }, [activeTab])

  if (!user || !todayDate) return null

  const isToday = selectedDate === todayDate

  return (
    <div>
      {/* Título + tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>

          {activeTab === 'today' && (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                isEditing
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isEditing ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  {t('done')}
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" />
                  {t('edit')}
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            <TabButton active={activeTab === 'today'} onClick={() => setActiveTab('today')}>
              {t('today')}
            </TabButton>
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
              {t('historyTab')}
            </TabButton>
          </div>

          {activeTab === 'today' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                max={todayDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayDate)}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
                >
                  {t('today')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'today' ? (
        <DayView date={selectedDate} locale={locale} isEditing={isEditing} />
      ) : (
        <HistoryView locale={locale} />
      )}
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  )
}

// ── TabButton ─────────────────────────────────────────────────────────────────
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
