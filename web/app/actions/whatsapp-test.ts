'use server'

import { createClient } from "@/utils/supabase/server"

export async function sendTestMessage(phoneNumber: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autorizado" }

    // Busca as credenciais e o slug da clínica
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
        organizations_id,
        organizations:organizations_id (
            slug,
            evolution_url,
            evolution_apikey
        )
        `)
        .eq('id', user.id)
        .single() as any

    const org = profile?.organizations
    if (!org?.slug) return { error: "Instância não configurada." }

    const baseUrl = org.evolution_url || "http://127.0.0.1:8082"
    const url = `${baseUrl}/message/sendText/${org.slug}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': org.evolution_apikey
      },
      body: JSON.stringify({
        number: phoneNumber.replace(/\D/g, ''), // Remove parênteses e traços
        text: "✅ *Teste de Conexão Eliza*\n\nSeu sistema de agendamentos está conectado com sucesso à Evolution API! 🚀",
        linkPreview: false
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Erro no envio")

    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}