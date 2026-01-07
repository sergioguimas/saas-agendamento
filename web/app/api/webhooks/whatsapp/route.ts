import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Palavras que o robô entende como confirmação
const CONFIRMATION_KEYWORDS = ['sim', 'confirmar', 'confirmo', 'vou', 'comparecer', 'ok', '👍', 'diga']

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const eventType = payload.event
    const data = payload.data
    
    // 1. Filtro Básico: Só aceita mensagem nova (texto) ou atualização (enquete)
    if (eventType !== 'messages.upsert' && eventType !== 'messages.update') {
      return NextResponse.json({ message: 'Ignored event type' }, { status: 200 })
    }

    // 2. Descobrir quem mandou (Extrair Telefone)
    // A Evolution manda os dados em lugares diferentes dependendo se é Texto ou Enquete
    const messageData = data.message || data
    const key = data.key || messageData.key || {}
    
    // Tenta pegar o número de várias formas possíveis para não falhar
    const rawRemoteJid = key.remoteJidAlt || key.remoteJid || data.remoteJid || ''
    
    // Se for grupo (@g.us) ou mensagem enviada por mim (fromMe), tchau!
    if (rawRemoteJid.includes('@g.us') || key.fromMe) {
        return NextResponse.json({ message: 'Ignored group/self' }, { status: 200 })
    }

    // LIMPEZA DO NÚMERO: Pega apenas os números e extrai os últimos 8 dígitos
    // Ex: "5533988961853" -> "88961853"
    // Isso garante que achamos o cliente mesmo se tiver 9º dígito ou DDI diferente
    const phoneDigits = rawRemoteJid.replace(/\D/g, '')
    const searchPhone = phoneDigits.slice(-8)

    // 3. Ler o Conteúdo (O que a pessoa disse?)
    let content = ''

    // Caso A: Texto Simples (conversation ou extendedTextMessage)
    if (messageData.conversation) {
        content = messageData.conversation
    } else if (messageData.extendedTextMessage?.text) {
        content = messageData.extendedTextMessage.text
    }
    // Caso B: Voto na Enquete (pollUpdates)
    else if (messageData.pollUpdates && messageData.pollUpdates.length > 0) {
        const vote = messageData.pollUpdates[0].vote
        if (vote?.selectedOptions?.length > 0) {
            content = vote.selectedOptions[0].name
        }
    }

    console.log(`📩 Webhook processando: "${content}" de final ...${searchPhone}`)

    if (!content) {
        return NextResponse.json({ message: 'No content found' }, { status: 200 })
    }

    // 4. Verificar se é SIM
    const lowerContent = content.toLowerCase().trim()
    const isConfirmation = CONFIRMATION_KEYWORDS.some(word => lowerContent.includes(word))

    if (!isConfirmation) {
        console.log(`Ignorado: "${content}" não é uma confirmação.`)
        return NextResponse.json({ message: 'Not a confirmation' }, { status: 200 })
    }

    // 5. Atualizar o Supabase
    const supabase = createAdminClient()

    // Busca Cliente pelos ultimos 8 digitos (infalível)
    const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .ilike('phone', `%${searchPhone}%`) 
        .limit(1)
        .single()

    if (!customer) {
        console.log(`❌ Cliente final ...${searchPhone} não encontrado no banco.`)
        return NextResponse.json({ message: 'Customer not found' }, { status: 200 })
    }

    // Busca o Agendamento Futuro
    const now = new Date().toISOString()
    const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('customer_id', customer.id)
        .in('status', ['scheduled', 'arrived']) // Aceita agendado ou recepcionado
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(1)
        .single()

    if (!appointment) {
        console.log(`❌ ${customer.name} não tem agendamento futuro.`)
        return NextResponse.json({ message: 'No appointment found' }, { status: 200 })
    }

    // CONFIRMA! 🟢
    await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id)

    console.log(`✅ SUCESSO! Agendamento de ${customer.name} virou CONFIRMED.`)
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("❌ Erro Interno:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}