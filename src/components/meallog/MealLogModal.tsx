'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import MealLogForm from './MealLogForm'

import type { MealLog } from '@/types/domain'

interface MealLogModalProps {
  date: string
  onClose: () => void
  entry?: MealLog   // when provided, opens in edit mode
}

export default function MealLogModal({ date, onClose, entry }: MealLogModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl max-h-[90vh]">
        {/* Header fijo — siempre visible aunque el contenido scrollee */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            {entry ? 'Editar registro' : 'Agregar registro'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-6 py-5">
          <MealLogForm date={date} onSuccess={onClose} initialEntry={entry} />
        </div>
      </div>
    </div>,
    document.body
  )
}
