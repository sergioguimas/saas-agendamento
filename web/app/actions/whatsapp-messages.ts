'use server'

import { createClient } from "@/utils/supabase/server"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const DEFAULT_EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://127.0.0.1:8082"
const GLOBAL_API_KEY = process.env.EVOLUTION_API_KEY || "medagenda123"

export async function sendAppointmentConfirmation(appointmentId: string) {
  const supabase = await createClient()

  // 1. Busca os dados COMPLETOS (Join nas tabelas novas)
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers ( name, phone ),
      services ( title, duration_minutes ),
      profiles ( full_name ),
      organizations ( slug, evolution_api_url, evolution_api_key )
    `)
    .eq('id', appointmentId)
    .single() as any

  if (error || !appointment) {
    console.error("❌ Erro ao buscar dados para WhatsApp:", error)
    return { error: "Agendamento não encontrado" }
  }

  // 2. Validações
  if (!appointment.customers?.phone) {
    console.log("⚠️ Cliente sem telefone cadastrado.")
    return { error: "Cliente sem telefone" }
  }
  
  if (!appointment.organizations?.slug) {
    console.log("⚠️ Organização sem slug/instância.")
    return { error: "Organização sem instância WhatsApp" }
  }

  // 3. Configuração da Instância
  const instanceName = appointment.organizations.slug
  const EVOLUTION_URL = appointment.organizations.evolution_api_url || DEFAULT_EVOLUTION_URL
  const API_KEY = appointment.organizations.evolution_api_key || GLOBAL_API_KEY
  
  // 4. Formata Telefone (Garante 55)
  const rawPhone = appointment.customers.phone.replace(/\D/g, "")
  const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`

  // 5. Monta a Mensagem
  const dateObj = new Date(appointment.start_time)
  const dateStr = format(dateObj, "dd/MM 'às' HH:mm", { locale: ptBR })
  const profissional = appointment.profiles?.full_name || 'Clínica'
  const procedimento = appointment.services?.title || 'Consulta'

  const message = `Olá *${appointment.customers.name.split(' ')[0]}*! 👋

  Seu agendamento está confirmado:

  🏥 *Procedimento:* ${procedimento}
  📅 *Data:* ${dateStr}
  👨‍⚕️ *Profissional:* ${profissional}

  📍 _Chegue com 10 minutos de antecedência._
  Responda essa mensagem para confirmar ou remarcar.`

  console.log(`📤 Enviando para ${phone} via ${instanceName}...`)

  // 6. Envia para a API
  try {
    const response = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify({
        number: phone,
        text: message
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ Erro Evolution API:", data)
      return { error: "Falha no envio da mensagem" }
    }

    return { success: true, data }

  } catch (err) {
    console.error("❌ Erro de Conexão (Fetch):", err)
    return { error: "Erro de conexão" }
  }
}