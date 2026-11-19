import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { PurchaseWithItems } from '@/types/stock'

export default async function ComprasPage() {
  const supabase = await createClient()
  const locale   = await getLocale()
  const t        = await getTranslations('stock')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers ( name ),
      items:purchase_items (
        id, quantity_gross, yield_pct_snap, quantity_net, price_paid,
        stock_item:stock_items ( name, unit )
      )
    `)
    .eq('user_id', user.id)
    .order('purchased_at', { ascending: false })
    .limit(50)

  const purchases = (data ?? []) as PurchaseWithItems[]

  const fmt = (n: number, currency: string = 'PEN') =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(n)

  const tabs = [
    { href: `/${locale}/app/despensa`,            label: t('tabs.stock')      },
    { href: `/${locale}/app/despensa/compras`,     label: t('tabs.purchases')  },
    { href: `/${locale}/app/despensa/tareas`,      label: t('tabs.prepTasks')  },
    { href: `/${locale}/app/despensa/proveedores`, label: t('tabs.suppliers')  },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛒 {t('purchases.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('purchases.subtitle')}</p>
        </div>
        <Link
          href={`/${locale}/app/despensa/compras/nueva`}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + {t('newPurchase')}
        </Link>
      </div>

      {/* sub-nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ href, label }) => (
          <Link key={href} href={href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-green-500 -mb-px">
            {label}
          </Link>
        ))}
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-gray-500 font-medium">{t('purchases.emptyTitle')}</p>
          <Link href={`/${locale}/app/despensa/compras/nueva`}
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            {t('purchases.emptyAction')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => {
            const lineCount = p.items?.length ?? 0
            const total = p.total_paid ?? p.items?.reduce((s, i) => s + (i.price_paid ?? 0), 0) ?? 0
            return (
              <div key={p.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div>
                    <span className="font-medium text-gray-900">
                      {new Date(p.purchased_at).toLocaleDateString('es-PE', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                    {p.supplier && (
                      <span className="ml-2 text-sm text-gray-500">· {(p.supplier as any).name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-green-700">{fmt(total, p.currency ?? 'PEN')}</p>
                      <p className="text-xs text-gray-400">{t('purchases.items', { n: lineCount })}</p>
                    </div>
                    <Link
                      href={`/${locale}/app/despensa/compras/${p.id}/editar`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                  </div>
                </div>
                {p.items && p.items.length > 0 && (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {p.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {(item.stock_item as any)?.name ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-gray-500 tabular-nums">
                            {item.quantity_gross}g bruto
                            {item.yield_pct_snap < 100 && (
                              <span className="text-gray-400 text-xs ml-1">
                                → {item.quantity_net}g neto ({item.yield_pct_snap}% rend.)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                            {fmt(item.price_paid ?? 0, p.currency ?? 'PEN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {p.notes && (
                  <p className="px-4 py-2 text-xs text-gray-400 italic border-t border-gray-50">{p.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
