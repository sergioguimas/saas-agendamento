'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'

// Definimos o tipo exato que o Supabase espera para o status
type AppointmentStatus = Database['public']['Enums']['appointment_status']

export async function updateAppointmentStatus(appointmentId: string, newStatus: AppointmentStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ status: newStatus }) // Agora o TS sabe que newStatus é válido
    .eq('id', appointmentId)

  if (error) {
    console.error('Erro ao atualizar status:', error)
    return { error: 'Não foi possível atualizar o status.' }
  }

  revalidatePath('/agendamentos')
  revalidatePath('/')
  return { success: true }
}