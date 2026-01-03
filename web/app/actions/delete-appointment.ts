'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendWhatsappMessage } from './send-whatsapp'

// === OPÇÃO A: CANCELAR (Mantém registro, avisa cliente) ===
export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient()

  // 1. Buscar dados para a mensagem antes de atualizar
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      services ( title )
    `)
    .eq('id', appointmentId)
    .single() as any // 'as any' ajuda aqui pois o join retorna array/objeto complexo

  if (!appointment) return { error: "Agendamento não encontrado" }

  // 2. Atualizar Status para 'canceled'
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', appointmentId)

  if (error) return { error: 'Erro ao cancelar agendamento' }

  // 3. Enviar WhatsApp de Cancelamento 🚀
  if (appointment.customer_id) {
    const { data: client } = await supabase
      .from('customers')
      .select('name, phone')
      .eq('id', appointment.customer_id)
      .single()

    if (client?.phone) {
        try {
            const nomeServico = appointment.services?.title || "atendimento"
            const dataOriginal = new Date(appointment.start_time)
            
            // Formatação de data/hora para o Brasil
            const dia = dataOriginal.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            const hora = dataOriginal.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })

            const message = `Olá ${client.name}, seu agendamento de *${nomeServico}* para o dia ${dia} às ${hora} foi *cancelado*.`
            
            await sendWhatsappMessage(client.phone, message)
            console.log("✅ Aviso de cancelamento enviado!")
        } catch (err) {
            console.error("Erro zap cancel:", err)
        }
    }
  }

  revalidatePath('/')
  revalidatePath('/agendamentos')
  return { success: true }
}

// === OPÇÃO B: EXCLUIR (Apaga do banco, avisa cliente) ===
export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient()

  // 1. Buscar dados antes de deletar (para conseguir avisar)
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      services ( title )
    `)
    .eq('id', appointmentId)
    .single() as any

  // 2. Deletar o agendamento
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)

  if (error) return { error: 'Erro ao excluir agendamento' }

  // 3. Enviar WhatsApp (Opcional na exclusão, mas bom para garantir) 🚀
  if (appointment?.customer_id) {
    const { data: client } = await supabase
      .from('customers')
      .select('name, phone')
      .eq('id', appointment.customer_id)
      .single()

    if (client?.phone) {
        try {
            const nomeServico = appointment.services?.title || "atendimento"
            const dataOriginal = new Date(appointment.start_time)
            const dia = dataOriginal.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            
            // Mensagem sutilmente diferente para exclusão
            const message = `Olá ${client.name}, informamos que seu agendamento de *${nomeServico}* no dia ${dia} foi removido da nossa agenda.`
            
            await sendWhatsappMessage(client.phone, message)
        } catch (err) {
            console.error("Erro zap delete:", err)
        }
    }
  }

  revalidatePath('/')
  revalidatePath('/agendamentos')
  return { success: true }
}