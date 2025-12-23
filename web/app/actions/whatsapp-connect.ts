'use server'

import { createClient } from "@/utils/supabase/server"

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "http://127.0.0.1:8082"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "medagenda123"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function createWhatsappInstance() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: "Clínica não encontrada" }

  const instanceName = profile.tenant_id

  console.log("🚀 Iniciando verificação para:", instanceName)

  try {
    console.log("🔍 Buscando instância...")
    const checkResponse = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
    })
    
    if (checkResponse.status !== 200) {
        console.log("🛠️ Instância não encontrada. Criando...")
        
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
                integration: "WHATSAPP-BAILEYS" 
            })
        })
        
        if (!createResponse.ok) {
             const errorText = await createResponse.text()
             console.error("Erro na criação:", errorText)
        } else {
             console.log("📦 Status Criação: Sucesso (201)")
        }
    } else {
        console.log("✅ Instância já existe. Buscando QR Code...")
    }

    return await connectInstance(instanceName, profile.tenant_id)

  } catch (error) {
    console.error("❌ Erro Fatal:", error)
    return { error: "Falha de comunicação. Verifique se o Docker está rodando na porta 8081." }
  }
}

async function connectInstance(instanceName: string, tenantId: string) {
    let attempts = 0
    const maxAttempts = 30 

    while (attempts < maxAttempts) {
        attempts++
        console.log(`⏳ Aguardando QR Code... (${attempts}/${maxAttempts})`)

        try {
            const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': EVOLUTION_API_KEY }
            })
            
            const data = await response.json()

            if (data.base64) {
                console.log("✅ QR Code CAPTURADO!")
                await saveStatus(instanceName, tenantId, 'qrcode')
                return { success: true, qrcode: data.base64, code: data.code }
            }
            
            if (data.instance?.status === 'open' || data.instance?.state === 'open') {
                console.log("✅ CONECTADO!")
                await saveStatus(instanceName, tenantId, 'connected')
                return { success: true, connected: true }
            }

            if (attempts < maxAttempts) await delay(5000)

        } catch (e) {
            console.error("Erro na busca:", e)
            await delay(5000)
        }
    }

    return { error: "Tempo esgotado. Tente novamente." }
}

async function saveStatus(instance: string, tenant: string, status: string) {
    const supabase = await createClient()
    // @ts-ignore
    await supabase.from('whatsapp_config').upsert(
        { tenant_id: tenant, instance_name: instance, status: status },
        { onConflict: 'tenant_id' }
    )
}