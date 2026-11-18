'use client'
// Barra de resumen semanal: valor de stock, alertas, compras, consumo
import type { StockSummary } from '@/types/stock'

interface Props {
  summary: StockSummary
  locale: string
}

export default function StockSummaryBar({ summary }: Props) {
  const currency = 'S/'   // TODO: leer de user_profiles.currency

  const tiles = [
    {
      label: 'Valor en stock',
      value: `${currency}${summary.total_value.toFixed(2)}`,
      color: 'bg-green-50 text-green-800 border-green-200',
      icon: '📦',
    },
    {
      label: 'Items en stock',
      value: summary.items_in_stock.toString(),
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: '🗂️',
    },
    {
      label: 'Bajo mínimo',
      value: summary.low_stock_count.toString(),
      color: summary.low_stock_count > 0
        ? 'bg-red-50 text-red-800 border-red-200'
        : 'bg-gray-50 text-gray-600 border-gray-200',
      icon: '⚠️',
    },
    {
      label: 'Tareas pendientes',
      value: summary.pending_tasks.toString(),
      color: summary.pending_tasks > 0
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-gray-50 text-gray-600 border-gray-200',
      icon: '📋',
    },
    {
      label: 'Compras (7 días)',
      value: `${currency}${summary.purchases_7d_cost.toFixed(2)}`,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: '🛒',
    },
    {
      label: 'Consumo (7 días)',
      value: `${currency}${summary.consumed_7d_cost.toFixed(2)}`,
      color: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: '🍽️',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`rounded-lg border p-3 ${tile.color}`}
        >
          <div className="text-lg">{tile.icon}</div>
          <div className="mt-1 text-xl font-bold">{tile.value}</div>
          <div className="text-xs opacity-80">{tile.label}</div>
        </div>
      ))}
    </div>
  )
}
