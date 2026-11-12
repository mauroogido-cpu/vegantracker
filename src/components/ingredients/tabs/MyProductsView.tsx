'use client'

import { useState } from 'react'
import {
  useUserIngredients,
  useDeleteUserIngredient,
  useSubmitForReview,
} from '@/hooks/useUserIngredients'
import UserIngredientModal from '@/components/ingredients/UserIngredientModal'
import type { UserIngredient } from '@/types/domain'

const STATUS_BADGE: Record<UserIngredient['status'], { label: string; cls: string }> = {
  private:        { label: 'Privado',         cls: 'bg-gray-100 text-gray-500' },
  pending_review: { label: 'En revisión',     cls: 'bg-amber-100 text-amber-700' },
  rejected:       { label: 'No aprobado',     cls: 'bg-red-100 text-red-600' },
}

function NullableStat({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      {value === null
        ? <span className="text-xs text-amber-400" title="Dato desconocido">?</span>
        : <span className="text-xs font-medium text-gray-700">{value}{unit}</span>
      }
    </span>
  )
}

export default function MyProductsView() {
  const { data: items, isLoading } = useUserIngredients()
  const deleteMutation = useDeleteUserIngredient()
  const reviewMutation = useSubmitForReview()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserIngredient | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openCreate() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function openEdit(item: UserIngredient) {
    setEditing(item)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
    setConfirmDelete(null)
  }

  async function handleSubmitReview(id: string) {
    await reviewMutation.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items?.length ?? 0} producto{(items?.length ?? 0) !== 1 ? 's' : ''} personales
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          + Agregar producto
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        <strong>?</strong> indica que el dato no figura en la etiqueta del producto.
        Se mostrará como "incompleto" en el resumen diario, no como cero.
      </div>

      {/* Empty state */}
      {(!items || items.length === 0) && (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-gray-400">Todavía no cargaste ningún producto.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 text-sm font-medium text-green-600 hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      )}

      {/* List */}
      {items && items.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status]
            return (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: name + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-800 truncate">
                        {item.name_es ?? item.name_en}
                      </span>
                      {item.brand && (
                        <span className="text-xs text-gray-400">{item.brand}</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    {/* Nutrient summary row */}
                    <div className="mt-1 flex flex-wrap gap-3">
                      <NullableStat label="kcal " value={item.cal}       unit="" />
                      <NullableStat label="P "    value={item.protein_g} unit="g" />
                      <NullableStat label="C "    value={item.carbs_g}   unit="g" />
                      <NullableStat label="G "    value={item.fat_g}     unit="g" />
                      <NullableStat label="B12 "  value={item.vit_b12_mcg} unit="mcg" />
                      <NullableStat label="Fe "   value={item.iron_mg}   unit="mg" />
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Editar
                    </button>

                    {item.status === 'private' && (
                      <button
                        type="button"
                        onClick={() => handleSubmitReview(item.id)}
                        disabled={reviewMutation.isPending}
                        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                        title="Proponer que este producto se agregue al catálogo público"
                      >
                        Proponer al catálogo
                      </button>
                    )}

                    {confirmDelete === item.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">¿Seguro?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(item.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Eliminar
      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal */}
      <UserIngredientModal
        open={modalOpen}
        existing={editing}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
