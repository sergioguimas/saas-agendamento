import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const CONFIRMATION_KEYWORDS = ['sim', 'confirmar', 'confirmo', 'vou', 'comparecer', 'ok', '👍']

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const eventType = payload.event
    
    // 1. CORREÇÃO: Aceita tanto mensagem nova (UPSERT) quanto voto em enquete (UPDATE)
    if (eventType !== 'messages.upsert' && eventType !== 'messages.update') {
      return NextResponse.json({ message: 'Ignored event' }, { status: 200 })
    }

    const data = payload.data
    // Em eventos UPDATE, as vezes o payload muda ligeiramente, garantimos pegar o objeto certo
    const messageData = data.message || data 

    if (!messageData) return NextResponse.json({ message: 'No message content' }, { status: 200 })
    
    // Ignora atualizações que nós mesmos fizemos (ex: respondendo alguém)
    if (data.key?.fromMe || messageData.key?.fromMe) {
        return NextResponse.json({ message: 'Ignored sent message' }, { status: 200 })
    }

    // --- LÓGICA DE LEITURA (TEXTO OU VOTO) ---
    let userResponse = ''

    // Caso A: Texto Simples
    if (messageData.conversation || messageData.extendedTextMessage?.text) {
      userResponse = messageData.conversation || messageData.extendedTextMessage?.text
    }
    // Caso B: Voto em Enquete (Poll Update)
    else if (messageData.pollUpdates) {
       // Estrutura comum em eventos de UPDATE
       const votes = messageData.pollUpdates
       if (votes && votes.length > 0) {
           const vote = votes[0].vote
           if (vote && vote.selectedOptions && vote.selectedOptions.length > 0) {
               userResponse = vote.selectedOptions[0].name
           }
       }
    }
    // Caso C: Voto em Enquete (Estrutura alternativa/Upsert)
    else if (messageData.pollUpdateMessage) {
        const vote = messageData.pollUpdateMessage.vote
        if (vote && vote.selectedOptions && vote.selectedOptions.length > 0) {
            userResponse = vote.selectedOptions[0].name
        }
    }

    if (!userResponse) return NextResponse.json({ message: 'No readable content' }, { status: 200 })

    // 2. Verifica se é confirmação
    const lowerText = userResponse.toLowerCase().trim()
    const isConfirmation = CONFIRMATION_KEYWORDS.some(keyword => lowerText.includes(keyword))

    if (!isConfirmation) {
      console.log(`📝 Resposta recebida: "${userResponse}" (Não é confirmação)`)
      return NextResponse.json({ message: 'Not a confirmation' }, { status: 200 })
    }

    // 3. Extrai telefone (Tenta pegar do key.remoteJid que está na raiz ou dentro da message)
    const remoteJid = data.key?.remoteJid || messageData.key?.remoteJid
    if (!remoteJid) return NextResponse.json({ message: 'No remoteJid found' }, { status: 200 })
    
    const rawPhone = remoteJid.split('@')[0] 
    const phoneDigits = rawPhone.replace(/\D/g, '')

    console.log(`📥 Confirmação detectada de: ${phoneDigits} (Opção: ${userResponse})`)

    // 4. Atualiza no Banco (Igual ao anterior)
    const supabase = createAdminClient()
    const searchPhone = phoneDigits.slice(-8) // Busca pelos últimos 8 dígitos para ser mais flexível com DDD
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .ilike('phone', `%${searchPhone}%`) 
      .single()

    if (customerError || !customer) {
      console.log("❌ Cliente não encontrado. Buscado por:", searchPhone)
      return NextResponse.json({ message: 'Customer not found' }, { status: 200 })
    }

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
      console.log("❌ Nenhum agendamento futuro pendente para:", customer.name)
      return NextResponse.json({ message: 'No pending appointment' }, { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointment.id)

    if (updateError) {
      console.error("Erro no Update:", updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    console.log(`✅ SUCESSO! Agendamento de ${customer.name} confirmado.`)
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}