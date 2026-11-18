import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { PrepTaskDetail } from '@/types/stock'

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done:        'bg-green-100 text-green-800',
  cancelled:   'bg-gray-100 text-gray-500',
}

const TYPE_ICONS: Record<string, string> = {
  prep:      '🔪',
  transform: '🔄',
  cook:      '🍳',
  blend:     '🥤',
  ferment:   '🫙',
  dehy:      '☀️',
  sprout:    '🌱',
  other:     '🔧',
}

export default async function TareasPage() {
  const supabase = await createClient()
  const locale   = await getLocale()
  const t        = await getTranslations('stock')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data } = await supabase
    .from('prep_tasks')
    .select(`
      *,
      recipe:recipes(name),
      inputs:prep_task_inputs(
        id, quantity, unit,
        stock_item:stock_items(name)
      ),
      outputs:prep_task_outputs(
        id, quantity_expected, quantity_actual, unit,
        stock_item:stock_items(name)
      )
    `)
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const tasks = (data ?? []) as PrepTaskDetail[]

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
          <h1 className="text-2xl font-bold text-gray-900">🔪 {t('prepTasks.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('prepTasks.subtitle')}</p>
        </div>
        <Link href={`/${locale}/app/despensa/tareas/nueva`}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          + {t('newTask')}
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

      {tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🔪</p>
          <p className="text-gray-500 font-medium">{t('prepTasks.emptyTitle')}</p>
          <Link href={`/${locale}/app/despensa/tareas/nueva`}
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            {t('prepTasks.emptyAction')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusColor = STATUS_COLORS[task.status] ?? 'bg-gray-100 text-gray-700'
            const icon = TYPE_ICONS[task.task_type] ?? '📋'
            return (
              <div key={task.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <span className="font-medium text-gray-900">{task.name}</span>
                      {task.scheduled_for && (
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(task.scheduled_for).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                      {t(`prepTasks.status.${task.status}` as any)}
                    </span>
                    {task.status === 'pending' && (
                      <Link
                        href={`/${locale}/app/despensa/tareas/${task.id}/completar`}
                        className="rounded-md border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        {t('prepTasks.complete')} →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                  {task.inputs && task.inputs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t('prepTasks.inputs')}</p>
                      <ul className="space-y-0.5">
                        {task.inputs.map(inp => (
                          <li key={inp.id} className="text-gray-700">
                            {(inp.stock_item as any)?.name} — {inp.quantity}{inp.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {task.outputs && task.outputs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t('prepTasks.outputs')}</p>
                      <ul className="space-y-0.5">
                        {task.outputs.map(out => (
                          <li key={out.id} className="text-gray-700">
                            {(out.stock_item as any)?.name} —{' '}
                            {out.quantity_actual ?? t('prepTasks.expected', { n: out.quantity_expected })}
                            {out.unit}
                            {out.quantity_actual !== null && out.quantity_actual !== out.quantity_expected && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({t('prepTasks.expected', { n: out.quantity_expected })})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {task.notes && (
                  <p className="px-4 pb-3 text-xs text-gray-400 italic">{task.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
