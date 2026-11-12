'use client'

import { useEffect } from 'react'
import UserIngredientForm from './UserIngredientForm'
import type { UserIngredient } from '@/types/domain'

interface Props {
  open: boolean
  existing?: UserIngredient   // edit mode
  onClose: () => void
  onSuccess?: (ingredient: UserIngredient) => void
}

export default function UserIngredientModal({ open, existing, onClose, onSuccess }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSuccess(ingredient: UserIngredient) {
    onSuccess?.(ingredient)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            {existing ? 'Editar producto' : 'Agregar producto personal'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <UserIngredientForm
            existing={existing}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
