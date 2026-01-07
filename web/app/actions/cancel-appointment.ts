'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { sendAppointmentCancellation } from "./whatsapp-messages"

// CORREÇÃO: Agora aceita string direto, não FormData
export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient()

  // 1. Tenta atualizar no banco
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', appointmentId)

  if (error) {
    console.error("Erro ao cancelar:", error)
    return { error: error.message }
  }

  // 2. Se deu certo, avisa no WhatsApp
  sendAppointmentCancellation(appointmentId).catch(err => 
    console.error("Falha ao enviar aviso de cancelamento:", err)
  )

  revalidatePath('/agendamentos')
  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true }
}