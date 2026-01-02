'use server'

import { createClient } from "@/utils/supabase/server"

const EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://127.0.0.1:8082"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function createWhatsappInstance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organizations_id, organizations:organizations_id(slug, evolution_url, evolution_apikey)')
    .eq('id', user.id)
    .single() as any

  if (!profile?.organizations_id || !profile?.organizations?.slug) {
    return { error: "Organização não encontrada ou Slug vazio." }
  }

  // Declaração correta das variáveis antes do uso
  const instanceName = profile.organizations.slug
  const organizationId = profile.organizations_id
  const EVOLUTION_URL = profile.organizations.evolution_url || "http://127.0.0.1:8082"
  const EVOLUTION_API_KEY = profile.organizations.evolution_apikey || "medagenda123"
  const webhookUrl = "https://heterodoxly-unchastened-nichole.ngrok-free.dev/api/webhooks/whatsapp"

  try {
    const createResponse = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
            instanceName: instanceName,
            token: instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
            webhook: webhookUrl, // Automação do Webhook
            webhook_by_events: true,
            events: ["CONNECTION_UPDATE"],
            reject_call: true,
            groupsIgnore: true,
            alwaysOnline: false,
            readMessages: false,
            readStatus: false,
            syncFullHistory: false
        })
    })

    // Remove registro antigo para evitar duplicidade
    await supabase.from('whatsapp_instances')
        .delete()
        .eq('organization_id', organizationId)

    const result = await fetchQrCodeLoop(instanceName)

    if (result.qrcode || result.connected) {
      await updateInstanceSettings(instanceName)
      await supabase.from('whatsapp_instances').insert({
        organization_id: organizationId as string,
        name: instanceName,
        status: result.connected ? 'connected' : 'pending',
        qr_code: result.qrcode || null
      })
    }

    return result

  } catch (error) { // Aqui resolve o erro "'catch' expected"
    console.error("❌ Erro Crítico:", error)
    return { error: "Erro de conexão com API" }
  }
}

async function fetchQrCodeLoop(instanceName: string) {
    let attempts = 0
    const maxAttempts = 20 

    while (attempts < maxAttempts) {
        attempts++
        try {
            const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': EVOLUTION_API_KEY }
            })
            
            const data = await response.json()

            if (data.base64) { 
                return { success: true, qrcode: data.base64 }
            }
            
            if (data.instance?.status === 'open' || data.instance?.state === 'open') {
                return { success: true, connected: true }
            }
            
            await delay(3000)
        } catch (e) {
            await delay(3000)
        }
    }
    return { error: "Tempo esgotado. Tente novamente." }
}

export async function deleteWhatsappInstance() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Auth required" }
    
    const { data: profile } = await supabase.from('profiles').select('organizations(slug)').eq('id', user.id).single()
    const instanceName = profile?.organizations?.slug
    
    if(instanceName) {
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY }
        })
        await supabase.from('whatsapp_instances').delete().eq('name', instanceName)
    }
    return { success: true }
}

// Função para forçar as configurações de ignorar após conectar
async function updateInstanceSettings(instanceName: string) {
    try {
        await fetch(`${EVOLUTION_URL}/instance/settings/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            },
            body: JSON.stringify({
                "reject_call": true,
                "groupsIgnore": true,
                "alwaysOnline": false,
                "readMessages": false,
                "readStatus": false,
                "syncFullHistory": false
            })
        })
        console.log("⚙️ Configurações de ignorar reforçadas com sucesso!")
    } catch (error) {
        console.error("Erro ao atualizar settings:", error)
    }
}