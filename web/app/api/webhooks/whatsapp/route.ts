import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const CONFIRMATION_KEYWORDS = ['sim', 'confirmar', 'confirmo', 'vou', 'comparecer', 'ok', '👍', 'diga']

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const eventType = payload.event
    const data = payload.data
    
    if (eventType !== 'messages.upsert' && eventType !== 'messages.update') {
      return NextResponse.json({ message: 'Ignored event type' }, { status: 200 })
    }

    const messageData = data.message || data
    const key = data.key || messageData.key || {}
    const rawRemoteJid = key.remoteJidAlt || key.remoteJid || data.remoteJid || ''
    
    if (rawRemoteJid.includes('@g.us') || key.fromMe) {
        return NextResponse.json({ message: 'Ignored group/self' }, { status: 200 })
    }

    const phoneDigits = rawRemoteJid.replace(/\D/g, '')
    const searchPhone = phoneDigits.slice(-8)

    let content = ''
    if (messageData.conversation) {
        content = messageData.conversation
    } else if (messageData.extendedTextMessage?.text) {
        content = messageData.extendedTextMessage.text
    }
    else if (messageData.pollUpdates && messageData.pollUpdates.length > 0) {
        const vote = messageData.pollUpdates[0].vote
        if (vote?.selectedOptions?.length > 0) {
            content = vote.selectedOptions[0].name
        }
    }

    console.log(`📩 Webhook processando: "${content}" de final ...${searchPhone}`)

    if (!content) return NextResponse.json({ message: 'No content' }, { status: 200 })

    const lowerContent = content.toLowerCase().trim()
    const isConfirmation = CONFIRMATION_KEYWORDS.some(word => lowerContent.includes(word))

    if (!isConfirmation) {
        console.log(`Ignorado: "${content}" não é confirmação.`)
        return NextResponse.json({ message: 'Not a confirmation' }, { status: 200 })
    }

    const supabase = createAdminClient()

    const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .ilike('phone', `%${searchPhone}%`) 
        .limit(1)
        .single()

    if (!customer) {
        console.log(`❌ Cliente final ...${searchPhone} não encontrado.`)
        return NextResponse.json({ message: 'Customer not found' }, { status: 200 })
    }

    // --- CORREÇÃO AQUI ---
    // Em vez de pegar 'now', pegamos as últimas 24 horas.
    // Isso permite confirmar agendamentos de hoje mesmo que já tenham "começado" no sistema
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)
    const searchStart = yesterday.toISOString()

    const { data: appointment } = await supabase
        .from('appointments')
        .select('id, start_time')
        .eq('customer_id', customer.id)
        .in('status', ['scheduled', 'arrived']) 
        .gte('start_time', searchStart) // Busca a partir de ontem
        .order('start_time', { ascending: true }) // Pega o mais próximo
        .limit(1)
        .single()

    if (!appointment) {
        console.log(`❌ ${customer.name} não tem agendamento pendente recente.`)
        return NextResponse.json({ message: 'No appointment found' }, { status: 200 })
    }

    await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id)

    console.log(`✅ SUCESSO! Agendamento de ${customer.name} (${appointment.start_time}) CONFIRMADO.`)
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("❌ Erro Interno:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}