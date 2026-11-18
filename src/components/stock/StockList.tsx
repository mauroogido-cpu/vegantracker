'use client'
// Lista de stock items con filtros por kind/storage y búsqueda
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { StockItemWithIngredient, StockItemKind, StorageType } from '@/types/stock'

interface Props {
  items: StockItemWithIngredient[]
  locale: string
}

const STORAGE_COLORS: Record<StorageType, string> = {
  pantry:  'bg-amber-100 text-amber-800',
  fridge:  'bg-blue-100 text-blue-800',
  freezer: 'bg-cyan-100 text-cyan-800',
}

const KIND_COLORS: Record<StockItemKind, string> = {
  ingredient: 'bg-green-100 text-green-800',
  prep:       'bg-purple-100 text-purple-800',
  product:    'bg-orange-100 text-orange-800',
}

export default function StockList({ items, locale }: Props) {
  const t = useTranslations('stock.stockList')
  const [search, setSearch]           = useState('')
  const [filterKind, setFilterKind]   = useState<StockItemKind | 'all'>('all')
  const [filterStorage, setFilterStorage] = useState<StorageType | 'all'>('all')
  const [showZero, setShowZero]       = useState(false)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!showZero && item.current_stock_g <= 0) return false
      if (filterKind !== 'all' && item.kind !== filterKind) return false
      if (filterStorage !== 'all' && item.storage_type !== filterStorage) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          item.name.toLowerCase().includes(q) ||
          (item.ingredient?.name_en ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [items, search, filterKind, filterStorage, showZero])

  const currency = 'S/'

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-500 font-medium">{t('emptyTitle')}</p>
        <p className="text-gray-400 text-sm mt-1">{t('emptySubtitle')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value as StockItemKind | 'all')}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
        >
          <option value="all">{t('allTypes')}</option>
          <option value="ingredient">{t('kinds.ingredient')}</option>
          <option value="prep">{t('kinds.prep')}</option>
          <option value="product">{t('kinds.product')}</option>
        </select>

        <select
          value={filterStorage}
          onChange={(e) => setFilterStorage(e.target.value as StorageType | 'all')}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
        >
          <option value="all">{t('allStorage')}</option>
          <option value="pantry">🏠 {t('storage.pantry')}</option>
          <option value="fridge">❄️ {t('storage.fridge')}</option>
          <option value="freezer">🧊 {t('storage.freezer')}</option>
        </select>

        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showZero}
            onChange={(e) => setShowZero(e.target.checked)}
            className="rounded"
          />
          {t('showEmpty')}
        </label>

        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} {t('ofItems', { total: items.length })}
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t('cols.name')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t('cols.type')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t('cols.storage')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">{t('cols.balance')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">{t('cols.wac')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">{t('cols.value')}</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">{t('cols.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {t('noResults')}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.reorder_point_g > 0 && item.current_stock_g <= item.reorder_point_g
                const isOut = item.current_stock_g <= 0
                const valor = item.current_stock_g * item.wac

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${isOut ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.kind === 'ingredient' && item.ingredient && (
                        <div className="text-xs text-gray-400">{item.ingredient.category}</div>
                      )}
                      {item.yield_pct < 100 && (
                        <div className="text-xs text-gray-400">
                          {t('yield', { pct: item.yield_pct })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${KIND_COLORS[item.kind]}`}>
                        {t(`kinds.${item.kind}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STORAGE_COLORS[item.storage_type]}`}>
                        {t(`storage.${item.storage_type}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {item.current_stock_g.toFixed(0)}
                      <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {item.wac > 0
                        ? `${currency}${(item.wac * 100).toFixed(3)}`
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {item.wac > 0 && item.current_stock_g > 0
                        ? `${currency}${valor.toFixed(2)}`
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isOut ? (
                        <span className="text-xs text-red-500 font-medium">{t('status.out')}</span>
                      ) : isLow ? (
                        <span className="text-xs text-amber-600 font-medium">{t('status.low')}</span>
                      ) : (
                        <span className="text-xs text-green-600">{t('status.ok')}</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
