'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMinutes } from 'date-fns'
import { sendAppointmentConfirmation } from "./whatsapp-messages"
import { SupabaseClient } from '@supabase/supabase-js'

// --- DEFINIÇÃO LOCAL PARA FORÇAR O TYPE ---
// Isso garante que o TS aceite suas colunas independente do database.types.ts global
type LocalAppointmentInsert = {
  patient_id: string
  organizations_id: string
  service_id: string
  profile_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes?: string
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient() as unknown as SupabaseClient<any>

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const profile_id = formData.get('profile_id') as string
  const start_time_raw = formData.get('start_time') as string 
  const organizations_id = formData.get('organizations_id') as string 

  // Validação
  if (!customer_id || !service_id || !start_time_raw || !organizations_id) {
    console.error("Campos faltando:", { customer_id, service_id, start_time_raw, organizations_id })
    return { error: "Campos obrigatórios faltando." }
  }

  // Busca duração do serviço
  const { data: service } = await supabase
    .from('services')
    .select('duration')
    .eq('id', service_id)
    .single()

  const duration = service?.duration || 30
  const start_date = new Date(start_time_raw)
  const end_date = addMinutes(start_date, duration)

  // Monta o objeto de inserção explicitamente
  const newAppointment: LocalAppointmentInsert = {
    patient_id: customer_id,
    organizations_id: organizations_id,
    service_id: service_id,
    profile_id: profile_id,
    start_time: start_date.toISOString(),
    end_time: end_date.toISOString(),
    status: 'pending',
    notes: 'Agendamento via Sistema'
  }

  // INSERT
  const { data: appointment, error: insertError } = await supabase
    .from('appointments') 
    .insert(newAppointment)
    .select()
    .single()

  if (insertError) {
    console.error("Erro REAL do Banco de Dados:", insertError.message)
    return { error: `Erro ao salvar: ${insertError.message}` }
  }

  // Disparo do WhatsApp
  if (appointment) {
    try {
      await sendAppointmentConfirmation(appointment.id)
    } catch (err) {
      console.error("Erro ao enviar WhatsApp:", err)
    }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}