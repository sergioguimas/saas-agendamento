'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Opção A: Apenas muda o status (Paciente desistiu)
export async function cancelAppointment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', id)

  if (error) return { error: "Erro ao cancelar." }

  revalidatePath('/')
  revalidatePath('/agendamentos')
  return { success: true }
}

// Opção B: Apaga do banco (Erro de digitação)
export async function deleteAppointment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) return { error: "Erro ao excluir." }

  revalidatePath('/')
  revalidatePath('/agendamentos')
  return { success: true }
}