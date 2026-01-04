import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Palavras-chave que consideramos como confirmação (Tanto texto quanto opção da enquete)
const CONFIRMATION_KEYWORDS = ['sim', 'confirmar', 'confirmo', 'vou', 'comparecer', 'ok', '👍']

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    // 1. Log para debug (ajuda a ver o que está chegando)
    // console.log("Webhook payload:", JSON.stringify(payload, null, 2))

    const eventType = payload.event
    if (eventType !== 'messages.upsert') {
      return NextResponse.json({ message: 'Ignored event' }, { status: 200 })
    }

    const data = payload.data
    const messageData = data.message

    if (!messageData) return NextResponse.json({ message: 'No message content' }, { status: 200 })
    if (data.key.fromMe) return NextResponse.json({ message: 'Ignored sent message' }, { status: 200 })

    // --- LÓGICA HÍBRIDA (TEXTO OU ENQUETE) ---
    let userResponse = ''

    // Caso A: Texto Simples (Conversation ou ExtendedText)
    if (messageData.conversation || messageData.extendedTextMessage?.text) {
      userResponse = messageData.conversation || messageData.extendedTextMessage?.text
    }
    
    // Caso B: Resposta de Enquete (Poll Update)
    // A Evolution v2 geralmente entrega isso dentro de 'pollUpdateMessage' -> 'vote'
    else if (messageData.pollUpdateMessage) {
        const vote = messageData.pollUpdateMessage.vote
        if (vote && vote.selectedOptions && vote.selectedOptions.length > 0) {
            // Pega o texto da opção que o usuário clicou (Ex: "Sim, confirmo")
            userResponse = vote.selectedOptions[0].name
        }
    }

    if (!userResponse) return NextResponse.json({ message: 'No readable content' }, { status: 200 })

    // 2. Verifica se a resposta contém confirmação
    const lowerText = userResponse.toLowerCase().trim()
    const isConfirmation = CONFIRMATION_KEYWORDS.some(keyword => lowerText.includes(keyword))

    if (!isConfirmation) {
      console.log(`Resposta recebida ("${userResponse}"), mas não é confirmação.`)
      return NextResponse.json({ message: 'Not a confirmation' }, { status: 200 })
    }

    // 3. Extrai o telefone do remetente
    const remoteJid = data.key.remoteJid // ex: 5511999998888@s.whatsapp.net
    const rawPhone = remoteJid.split('@')[0] 
    const phoneDigits = rawPhone.replace(/\D/g, '') // Remove caracteres não numéricos

    console.log(`📥 Recebido confirmação de: ${phoneDigits} (Resp: ${userResponse})`)

    // 4. Busca Agendamento e Atualiza (Igual ao anterior)
    const supabase = createAdminClient()
    const searchPhone = phoneDigits.slice(-10) // DDD + Numero
    
    // Busca cliente
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .ilike('phone', `%${searchPhone}%`) 
      .single()

    if (customerError || !customer) {
      console.log("Cliente não encontrado para o telefone:", searchPhone)
      return NextResponse.json({ message: 'Customer not found' }, { status: 200 })
    }

    // Busca agendamento
    const now = new Date().toISOString()
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select('id, start_time')
      .eq('customer_id', customer.id)
      .eq('status', 'scheduled')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(1)
      .single()

    if (appError || !appointment) {
      console.log("Nenhum agendamento pendente futuro para:", customer.name)
      return NextResponse.json({ message: 'No pending appointment' }, { status: 200 })
    }

    // Atualiza status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointment.id)

    if (updateError) {
      console.error("Erro ao confirmar:", updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    console.log(`✅ Agendamento confirmado para ${customer.name}!`)
    
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}