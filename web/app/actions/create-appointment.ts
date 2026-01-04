'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
// IMPORTANTE: Adicione este import. Confirme se o nome da função é este mesmo no seu arquivo.
import { sendAppointmentConfirmation } from "./whatsapp-messages"

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const organization_id = formData.get('organization_id') as string
  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const start_time_raw = formData.get('start_time') as string
  const staff_id = formData.get('staff_id') as string | null

  if (!organization_id || !customer_id || !service_id || !start_time_raw) {
    return { error: "Dados incompletos" }
  }

  // 1. Calcular horário de fim
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, price')
    .eq('id', service_id)
    .single()

  if (!service) return { error: "Serviço não encontrado" }

  const startTime = new Date(start_time_raw)
  const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000)

  // 2. VERIFICAÇÃO DE CONFLITO (Ignora Cancelados)
  const query = supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', organization_id)
    .neq('status', 'canceled') // <--- Ignora cancelados na verificação
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString())

  if (staff_id) {
    query.eq('profile_id', staff_id)
  }

  const { data: conflicts, error: conflictError } = await query

  if (conflictError) {
    console.error(conflictError)
    return { error: "Erro ao verificar disponibilidade" }
  }

  if (conflicts && conflicts.length > 0) {
    return { error: "Já existe um agendamento neste horário (conflito)." }
  }

  // 3. Criar o agendamento E RECUPERAR O DADO (.select().single())
  const { data: newAppointment, error } = await supabase
    .from('appointments')
    .insert({
      organization_id,
      customer_id,
      service_id,
      profile_id: staff_id || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      price: service.price,
      status: 'scheduled'
    })
    .select() // <--- CRUCIAL: Precisamos disso para pegar o ID gerado
    .single()

  if (error || !newAppointment) {
    console.error(error)
    return { error: "Erro ao criar agendamento" }
  }

  // 4. Enviar WhatsApp
  // Usamos o ID que acabamos de recuperar no passo 3
  if (newAppointment?.id) {
    sendAppointmentConfirmation(newAppointment.id).catch(err => 
      console.error("Falha ao enviar confirmação de agendamento:", err)
    )
  }

  revalidatePath('/agendamentos')
  revalidatePath('/dashboard')
  
  return { success: true }
}