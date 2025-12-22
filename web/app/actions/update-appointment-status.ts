'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateAppointmentStatus(appointmentId: string, newStatus: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)

  if (error) {
    console.error("❌ Erro ao atualizar status:", error.message, error.details) 
    return { error: `Erro: ${error.message}` }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}