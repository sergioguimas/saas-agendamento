'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMinutes } from 'date-fns'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const start_time_raw = formData.get('start_time') as string // Ex: "2024-05-20T11:50"
  const organizations_id = formData.get('organizations_id') as string

  // 1. Busca a duração para calcular o término
  const { data: service } = await supabase
    .from('services')
    .select('duration')
    .eq('id', service_id)
    .single()

  const duration = service?.duration || 30
  
  // 2. CORREÇÃO DEFINITIVA: 
  // O input datetime-local envia "YYYY-MM-DDTHH:mm". 
  // Ao criar o objeto Date diretamente da string, o JS assume o fuso local do sistema.
  const start_date = new Date(start_time_raw)
  const end_date = addMinutes(start_date, duration)

  // 3. Salvando no Banco
  // Importante: O Supabase (Postgres) armazena em UTC. 
  // Ao enviar .toISOString(), o JS converte para UTC. 
  // Ex: 11:50 BRT vira 14:50 UTC. Na volta, 14:50 UTC vira 11:50 BRT.
  const { error } = await supabase
    .from('appointments')
    .insert({
      customer_id,
      service_id,
      start_time: start_date.toISOString(), 
      end_time: end_date.toISOString(),
      organizations_id,
      status: 'scheduled'
    } as any)

  if (error) return { error: error.message }

  revalidatePath('/agendamentos')
  return { success: true }
}