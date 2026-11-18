import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import SupplierList from '@/components/stock/SupplierList'
import type { Supplier } from '@/types/stock'

export default async function ProveedoresPage() {
  const supabase = await createClient()
  const locale   = await getLocale()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 Proveedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ferias, almacenes y comercios donde comprás</p>
        </div>
      </div>

      {/* sub-nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { href: `/${locale}/app/despensa`,              label: 'Stock'          },
          { href: `/${locale}/app/despensa/compras`,       label: 'Compras'        },
          { href: `/${locale}/app/despensa/tareas`,        label: 'Pre-producción' },
          { href: `/${locale}/app/despensa/proveedores`,   label: 'Proveedores'    },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-green-500 -mb-px">
            {label}
          </Link>
        ))}
      </div>

      <SupplierList suppliers={(data ?? []) as Supplier[]} locale={locale} />
    </div>
  )
}
