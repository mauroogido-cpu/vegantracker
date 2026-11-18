'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Supplier } from '@/types/stock'

const DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

// Supabase puede devolver arrays de texto como string "{Lun,Mar}" — normalizamos
function toDays(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string') {
    // formato Postgres: {Lun,Mar,Mié}
    return v.replace(/^{|}$/g, '').split(',').filter(Boolean)
  }
  return []
}

interface Props {
  suppliers: Supplier[]
  locale: string
}

interface FormState {
  name: string
  location: string
  visit_days: string[]
  notes: string
}

const empty: FormState = { name: '', location: '', visit_days: [], notes: '' }

export default function SupplierList({ suppliers: initial, locale }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [suppliers, setSuppliers] = useState<Supplier[]>(initial)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Supplier | null>(null)
  const [form, setForm]           = useState<FormState>(empty)
  const [error, setError]         = useState('')
  const [deleting, setDeleting]   = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(empty)
    setError('')
    setShowForm(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name:       s.name,
      location:   s.location ?? '',
      visit_days: toDays(s.visit_days),
      notes:      s.notes ?? '',
    })
    setError('')
    setShowForm(true)
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      visit_days: f.visit_days.includes(day)
        ? f.visit_days.filter(d => d !== day)
        : [...f.visit_days, day],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('El nombre es requerido'); return }

    const body = {
      name:       form.name.trim(),
      location:   form.location.trim() || null,
      visit_days: form.visit_days.length > 0 ? form.visit_days : null,
      notes:      form.notes.trim() || null,
    }

    startTransition(async () => {
      try {
        const url    = editing ? `/api/stock/suppliers/${editing.id}` : '/api/stock/suppliers'
        const method = editing ? 'PATCH' : 'POST'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Error al guardar')
          return
        }
        const saved: Supplier = await res.json()
        if (editing) {
          setSuppliers(ss => ss.map(s => s.id === saved.id ? saved : s))
        } else {
          setSuppliers(ss => [...ss, saved].sort((a, b) => a.name.localeCompare(b.name)))
        }
        setShowForm(false)
        setEditing(null)
        setForm(empty)
        router.refresh()
      } catch {
        setError('Error de red. Intentá de nuevo.')
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/stock/suppliers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuppliers(ss => ss.filter(s => s.id !== id))
        router.refresh()
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          + Nuevo proveedor
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <form onSubmit={handleSave}
          className="rounded-lg border-2 border-green-200 bg-green-50 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">
            {editing ? '✏️ Editar proveedor' : '🏪 Nuevo proveedor'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Feria de Surquillo, Orgánica Market"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required autoFocus
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input type="text" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Ej: Surquillo, Lima"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de visita
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button key={day} type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                    form.visit_days.includes(day)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <input type="text" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Horario, productos especiales, contacto..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {suppliers.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">🏪</p>
          <p className="text-gray-500 font-medium">Sin proveedores todavía</p>
          <p className="text-gray-400 text-sm mt-1">
            Agregá ferias, almacenes o tiendas para vincularlos a tus compras
          </p>
          <button onClick={openNew}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            + Nuevo proveedor
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          {suppliers.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                  {s.location && <span>📍 {s.location}</span>}
                  {toDays(s.visit_days).length > 0 && (
                    <span>📅 {toDays(s.visit_days).join(', ')}</span>
                  )}
                  {s.notes && <span>💬 {s.notes}</span>}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => openEdit(s)}
                  className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                  Editar
                </button>
                <button onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50">
                  {deleting === s.id ? '…' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
