'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMinutes } from 'date-fns'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const start_time_raw = formData.get('start_time') as string // "2026-01-01T12:50"
  const organizations_id = formData.get('organizations_id') as string

  const { data: service } = await supabase
    .from('services')
    .select('duration')
    .eq('id', service_id)
    .single()

  const duration = service?.duration || 30
  
  // SOLUÇÃO: Criamos a data e forçamos ela a ser salva exatamente como escrita
  // sem conversão de fuso no momento do insert
  const start_date = new Date(start_time_raw)
  const end_date = addMinutes(start_date, duration)

  const { error } = await supabase
    .from('appointments')
    .insert({
      customer_id,
      service_id,
      // Usamos .toISOString() mas garantimos que o banco trate como timestamp sem timezone se necessário
      start_time: start_date.toISOString(), 
      end_time: end_date.toISOString(),
      organizations_id,
      status: 'scheduled'
    } as any)

  if (error) return { error: error.message }

  revalidatePath('/agendamentos')
  return { success: true }
}