'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function cancelAppointment(formData: FormData) {
  const appointmentId = formData.get('appointmentId') as string
  
  const supabase = await createClient() as any

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', appointmentId)

  if (error) {
    console.error("Erro ao cancelar:", error)
    return { error: error.message }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}