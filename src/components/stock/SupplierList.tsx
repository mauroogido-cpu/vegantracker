'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Supplier } from '@/types/stock'

interface Props {
  suppliers: Supplier[]
}

const EMPTY_FORM = { name: '', location: '', visit_days: '', notes: '' }

export default function SupplierList({ suppliers: initial }: Props) {
  const t = useTranslations('stock.suppliers')
  const supabase = createClient()

  const [suppliers, setSuppliers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name: s.name,
      location: s.location ?? '',
      visit_days: s.visit_days ?? '',
      notes: s.notes ?? '',
    })
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      name: form.name,
      location: form.location || null,
      visit_days: form.visit_days || null,
      notes: form.notes || null,
    }
    if (editing) {
      const { data, error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single()
      if (!error && data) {
        setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? (data as Supplier) : s)))
      }
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(payload)
        .select()
        .single()
      if (!error && data) {
        setSuppliers((prev) => [...prev, data as Supplier])
      }
    }
    setSubmitting(false)
    cancel()
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (!error) setSuppliers((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          {t('newButton')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4"
        >
          <h3 className="font-semibold text-gray-800">
            {editing ? t('formEdit') : t('formNew')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('name')}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('namePlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('location')}</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder={t('locationPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('visitDays')}</label>
              <input
                type="text"
                value={form.visit_days}
                onChange={(e) => setForm((f) => ({ ...f, visit_days: e.target.value }))}
                placeholder="Lun, Mié, Vie"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('notes')}</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={t('notesPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting
                ? t('submitting')
                : editing
                  ? t('saveEdit')
                  : t('saveNew')}
            </button>
          </div>
        </form>
      )}

      {suppliers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🏪</p>
          <p className="text-gray-500 font-medium">{t('emptyTitle')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('emptySubtitle')}</p>
          <button
            onClick={openNew}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            {t('emptyAction')}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {suppliers.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                  {s.location && <span>📍 {s.location}</span>}
                  {s.visit_days && <span>📅 {s.visit_days}</span>}
                  {s.notes && <span>📝 {s.notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(s)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {t('delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
