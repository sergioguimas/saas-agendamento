'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMinutes } from 'date-fns'
import { sendAppointmentConfirmation } from "./whatsapp-messages"

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const staff_id_raw = formData.get('staff_id') as string
  const start_time_raw = formData.get('start_time') as string 
  const organization_id = formData.get('organization_id') as string 

  if (!customer_id || !service_id || !start_time_raw || !organization_id) {
    return { error: "Campos obrigatórios faltando." }
  }

  // Tratamento do Staff ID (Se vier vazio, vira null para não dar erro de UUID)
  const profile_id = staff_id_raw && staff_id_raw !== 'undefined' ? staff_id_raw : null

  // Busca duração do serviço
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', service_id)
    .single()

  const duration = service?.duration_minutes || 30
  const start_date = new Date(start_time_raw)
  const end_date = addMinutes(start_date, duration)

  const newAppointment = {
    customer_id,
    organization_id,
    service_id,
    profile_id, // Pode ser null
    start_time: start_date.toISOString(),
    end_time: end_date.toISOString(),
    status: 'scheduled', // Status inicial correto
    notes: 'Agendamento via Sistema'
  } as const

  // INSERT
  const { data: appointment, error: insertError } = await supabase
    .from('appointments') 
    .insert(newAppointment as any)
    .select()
    .single()

  if (insertError) {
    console.error("Erro Banco:", insertError)

    // === CORREÇÃO DO ERRO DE CONFLITO ===
    if (insertError.message.includes('conflicting key value') || insertError.code === '23P01') {
        return { error: "Horário indisponível! Já existe um agendamento neste intervalo." }
    }
    
    return { error: `Erro ao salvar: ${insertError.message}` }
  }

  // Disparo do WhatsApp (Com Logs)
  if (appointment) {
    console.log("📝 Agendamento criado. Iniciando envio de WhatsApp...")
    try {
      const zapResult = await sendAppointmentConfirmation(appointment.id)
      if (zapResult?.error) {
        console.error("⚠️ Falha no envio do WhatsApp:", zapResult.error)
      } else {
        console.log("✅ WhatsApp enviado com sucesso!")
      }
    } catch (err) {
      console.error("❌ Erro crítico no envio do WhatsApp:", err)
    }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}