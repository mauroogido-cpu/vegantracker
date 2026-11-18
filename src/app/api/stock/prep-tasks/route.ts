import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreatePrepTaskPayload } from '@/types/stock'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload: CreatePrepTaskPayload = await req.json()

    // Crear tarea
    const { data: task, error: taskErr } = await supabase
      .from('prep_tasks')
      .insert({
        user_id:       user.id,
        name:          payload.name,
        task_type:     payload.task_type,
        notes:         payload.notes ?? null,
        scheduled_for: payload.scheduled_for ?? null,
        status:        'pending',
      })
      .select()
      .single()

    if (taskErr || !task) {
      return NextResponse.json({ error: taskErr?.message ?? 'Error creando tarea' }, { status: 500 })
    }

    // Inputs
    if (payload.inputs.length > 0) {
      const { error: inErr } = await supabase.from('prep_task_inputs').insert(
        payload.inputs.map(i => ({
          prep_task_id:  task.id,
          stock_item_id: i.stock_item_id,
          quantity:      i.quantity,
          unit:          i.unit,
        }))
      )
      if (inErr) {
        await supabase.from('prep_tasks').delete().eq('id', task.id)
        return NextResponse.json({ error: inErr.message }, { status: 500 })
      }
    }

    // Outputs
    if (payload.outputs.length > 0) {
      const { error: outErr } = await supabase.from('prep_task_outputs').insert(
        payload.outputs.map(o => ({
          prep_task_id:      task.id,
          stock_item_id:     o.stock_item_id,
          quantity_expected: o.quantity_expected,
          unit:              o.unit,
        }))
      )
      if (outErr) {
        await supabase.from('prep_tasks').delete().eq('id', task.id)
        return NextResponse.json({ error: outErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ id: task.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
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
