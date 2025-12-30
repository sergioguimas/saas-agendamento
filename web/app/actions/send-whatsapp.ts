'use server'

import { createClient } from "@/utils/supabase/server"

const EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://127.0.0.1:8082"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!

export async function sendWhatsappMessage(phone: string, message: string) {
  const supabase = await createClient()

  // 1. Pega a instância da empresa do usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organizations(slug)')
    .eq('id', user.id)
    .single()

  if (!profile?.organizations?.slug) return { error: "Organização sem instância." }
  
  const instanceName = profile.organizations.slug

  // 2. Formata o telefone (Remove caracteres não numéricos)
  // O padrão do Brasil é 55 + DDD + Numero.
  const cleanPhone = phone.replace(/\D/g, "")
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`

  try {
    console.log(`📤 Enviando via [${instanceName}] para [${formattedPhone}]...`)

    // 3. Dispara a requisição para a Evolution API
    const response = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Erro Evolution:", data)
      return { error: "Falha ao enviar mensagem." }
    }

    return { success: true, data }

  } catch (error) {
    console.error("Erro de envio:", error)
    return { error: "Erro de conexão com API WhatsApp." }
  }
}