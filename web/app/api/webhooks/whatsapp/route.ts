import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const CONFIRMATION_KEYWORDS = ['sim', 'confirmar', 'confirmo', 'vou', 'comparecer', 'ok', '👍']

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    // LOG DE DEBUG: Removemos isso depois, mas agora é crucial para ver o formato do voto
    // console.log("🔍 Payload Recebido:", JSON.stringify(payload, null, 2))

    const eventType = payload.event
    
    // 1. Filtro de Eventos
    if (eventType !== 'messages.upsert' && eventType !== 'messages.update') {
      return NextResponse.json({ message: 'Ignored event type' }, { status: 200 })
    }

    const data = payload.data
    const messageData = data.message || data 

    // 2. Filtro de Grupos (NOVO)
    // Se o remoteJid terminar em @g.us, é grupo. Ignoramos.
    const remoteJid = data.key?.remoteJid || messageData.key?.remoteJid || ''
    if (remoteJid.includes('@g.us')) {
        return NextResponse.json({ message: 'Ignored group message' }, { status: 200 })
    }
    
    // Ignora mensagens enviadas por nós mesmos
    if (data.key?.fromMe || messageData.key?.fromMe) {
        return NextResponse.json({ message: 'Ignored sent message' }, { status: 200 })
    }

    // --- LÓGICA DE LEITURA ---
    let userResponse = ''

    // Caso A: Texto Simples
    if (messageData.conversation || messageData.extendedTextMessage?.text) {
      userResponse = messageData.conversation || messageData.extendedTextMessage?.text
    }
    // Caso B: Voto em Enquete (Poll Update) - Padrão Evolution v2
    else if (messageData.pollUpdates) {
       const votes = messageData.pollUpdates
       if (votes && votes.length > 0) {
           const vote = votes[0].vote
           if (vote && vote.selectedOptions && vote.selectedOptions.length > 0) {
               userResponse = vote.selectedOptions[0].name
           }
       }
    }
    // Caso C: Voto em Enquete (Estrutura alternativa)
    else if (messageData.pollUpdateMessage) {
        const vote = messageData.pollUpdateMessage.vote
        if (vote && vote.selectedOptions && vote.selectedOptions.length > 0) {
            userResponse = vote.selectedOptions[0].name
        }
    }

    if (!userResponse) return NextResponse.json({ message: 'No readable content' }, { status: 200 })

    console.log(`📩 Processando resposta: "${userResponse}" de ${remoteJid}`)

    // 3. Verifica Palavras-Chave
    const lowerText = userResponse.toLowerCase().trim()
    const isConfirmation = CONFIRMATION_KEYWORDS.some(keyword => lowerText.includes(keyword))

    if (!isConfirmation) {
      return NextResponse.json({ message: 'Not a confirmation' }, { status: 200 })
    }

    // 4. Busca e Atualiza
    const rawPhone = remoteJid.split('@')[0] 
    const phoneDigits = rawPhone.replace(/\D/g, '')

    const supabase = createAdminClient()
    const searchPhone = phoneDigits.slice(-8) // Últimos 8 dígitos
    
    // Busca Cliente
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name')
      .ilike('phone', `%${searchPhone}%`) 
      .single()

    if (!customer) {
      console.log(`❌ Cliente não encontrado (Phone: ${searchPhone})`)
      return NextResponse.json({ message: 'Customer not found' }, { status: 200 })
    }

    // Busca Agendamento
    const now = new Date().toISOString()
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'scheduled')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(1)
      .single()

    if (!appointment) {
      console.log(`❌ Sem agendamento futuro para ${customer.name}`)
      return NextResponse.json({ message: 'No pending appointment' }, { status: 200 })
    }

    // Atualiza
    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointment.id)

    console.log(`✅ Agendamento de ${customer.name} CONFIRMADO!`)
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}