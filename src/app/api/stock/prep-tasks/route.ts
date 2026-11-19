import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreatePrepTaskPayload } from '@/types/stock'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload: CreatePrepTaskPayload = await req.json()
    const { task, inputs, outputs } = payload

    // Crear tarea
    const { data: created, error: taskErr } = await supabase
      .from('prep_tasks')
      .insert({
        user_id:       user.id,
        name:          task.name,
        task_type:     task.task_type,
        notes:         task.notes ?? null,
        scheduled_for: task.scheduled_for ?? null,
        status:        'pending',
      })
      .select()
      .single()

    if (taskErr || !created) {
      return NextResponse.json({ error: taskErr?.message ?? 'Error creando tarea' }, { status: 500 })
    }

    // Inputs
    if (inputs.length > 0) {
      const { error: inErr } = await supabase.from('prep_task_inputs').insert(
        inputs.map(i => ({
          prep_task_id:  created.id,
          stock_item_id: i.stock_item_id,
          quantity:      i.quantity,
          unit:          i.unit,
        }))
      )
      if (inErr) {
        await supabase.from('prep_tasks').delete().eq('id', created.id)
        return NextResponse.json({ error: inErr.message }, { status: 500 })
      }
    }

    // Outputs
    if (outputs.length > 0) {
      const { error: outErr } = await supabase.from('prep_task_outputs').insert(
        outputs.map(o => ({
          prep_task_id:      created.id,
          stock_item_id:     o.stock_item_id,
          quantity_expected: o.quantity_expected,
          unit:              o.unit,
        }))
      )
      if (outErr) {
        await supabase.from('prep_tasks').delete().eq('id', created.id)
        return NextResponse.json({ error: outErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('prep_tasks')
    .select(`*, inputs:prep_task_inputs(*, stock_item:stock_items(name)), outputs:prep_task_outputs(*, stock_item:stock_items(name))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
