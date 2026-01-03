'use server'

import { createClient } from "@/utils/supabase/server"

export async function sendAppointmentConfirmation(appointmentId: string) {
  const supabase = await createClient()

  // 1. Procura os dados da consulta, do cliente (paciente) e da organização
  // Ajustado para 'organization_id' (singular) e 'client_id' conforme o seu esquema real
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patient_id(name, phone),
      organization:organization_id(slug, evolution_url, evolution_apikey)
    `)
    .eq('id', appointmentId)
    .single() as any

  if (error || !appointment) {
    console.error("❌ Erro ao procurar agendamento para WhatsApp:", error)
    return { error: "Agendamento não encontrado." }
  }

  const org = appointment.organization
  const patient = appointment.patient
  
  // Tratamento da data: como o banco usa 'start_time' (timestamp), extraímos a data e hora
  const startDate = new Date(appointment.start_time)
  const dateStr = startDate.toLocaleDateString('pt-BR')
  const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  
  // O nome do procedimento agora é extraído do campo 'notes' ou 'service_id' conforme o seu schema
  const procedure = appointment.notes || "Consulta"

  // 2. Configuração da URL da Evolution API
  const url = `${org.evolution_url}/message/sendButtons/${org.slug}`

  const body = {
    number: patient.phone.replace(/\D/g, ''), // Garante apenas números para o WhatsApp
    buttonText: "Confirmar agora",
    description: `Olá ${patient.name}, a sua consulta para *${procedure}* foi marcada!\n\n📅 Data: ${dateStr}\n⏰ Horário: ${timeStr}\n\nPodemos confirmar a sua presença?`,
    title: "Confirmação de Agendamento",
    footer: "Assistente Eliza",
    buttons: [
      {
        buttonId: `confirm_${appointmentId}`,
        buttonText: { displayText: "✅ Confirmar" },
        type: 1
      },
      {
        buttonId: `reschedule_${appointmentId}`,
        buttonText: { displayText: "⏳ Reagendar" },
        type: 1
      }
    ]
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': org.evolution_apikey
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`API Evolution erro: ${errorData}`)
    }
    
    return { success: true }
  } catch (err: any) {
    console.error("❌ Erro no disparo do WhatsApp:", err.message)
    return { error: "Erro ao conectar com a API de WhatsApp" }
  }
}