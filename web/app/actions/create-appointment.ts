'use server'

import { createClient } from "@/utils/supabase/server"
import { sendAppointmentConfirmation } from "./whatsapp-messages"
import { revalidatePath } from "next/cache"

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  // 1. Extração e tratamento dos dados do formulário
  const patientId = formData.get('patientId') as string
  const orgId = formData.get('orgId') as string
  const serviceId = formData.get('serviceId') as string
  const staffId = formData.get('staffId') as string
  const date = formData.get('date') as string // Ex: "2024-10-25"
  const time = formData.get('time') as string // Ex: "14:30"
  const procedureName = formData.get('procedureName') as string || "Consulta"

  // 2. Formatação para ISO Strings (exigido por colunas timestamptz)
  // Assumindo uma duração padrão de 30 minutos para o end_time
  const startDateTime = new Date(`${date}T${time}`)
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000)

  // 3. Inserção no banco de dados com os nomes de colunas corretos
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: patientId,        // Corrigido de patient_id -> client_id
      organization_id: orgId,      // Corrigido de organizations_id -> organization_id
      service_id: serviceId,       // Obrigatório conforme seu schema
      staff_id: staffId,           // Obrigatório conforme seu schema
      start_time: startDateTime.toISOString(), // Obrigatório
      end_time: endDateTime.toISOString(),     // Obrigatório
      status: 'pending',           // Status inicial para o fluxo de WhatsApp
      notes: procedureName         // Usando o campo notes para guardar o nome do procedimento
    })
    .select()
    .single()

  if (error) {
    console.error("❌ Erro ao criar agendamento:", error.message)
    return { error: `Erro no banco: ${error.message}` }
  }

  // 4. Disparo da Automação de WhatsApp
  if (appointment) {
    try {
      // Enviamos a confirmação. O ID agora é garantido pelo .select().single()
      await sendAppointmentConfirmation(appointment.id)
    } catch (wsError) {
      console.error("⚠️ Agendamento criado, mas falha no envio do WhatsApp:", wsError)
      // Não retornamos erro aqui para não confundir o usuário, já que a consulta foi salva
    }
  }

  // Atualiza a interface da agenda
  revalidatePath('/agendamentos')
  revalidatePath('/dashboard')

  return { success: true, data: appointment }
}