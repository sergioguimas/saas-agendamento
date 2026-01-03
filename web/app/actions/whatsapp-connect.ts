'use server'

import { createClient } from "@/utils/supabase/server"

// Configurações Padrão
const DEFAULT_EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "http://127.0.0.1:8082"
const GLOBAL_API_KEY = process.env.EVOLUTION_API_KEY || "medagenda123"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function createWhatsappInstance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  // 1. Busca dados da Organização
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organizations:organization_id(slug, evolution_api_url, evolution_api_key)')
    .eq('id', user.id)
    .single() as any

  if (!profile?.organization_id || !profile?.organizations?.slug) {
    return { error: "Organização não encontrada ou Slug vazio." }
  }

  const instanceName = profile.organizations.slug
  const organizationId = profile.organization_id
  
  const EVOLUTION_URL = profile.organizations.evolution_api_url || DEFAULT_EVOLUTION_URL
  const API_KEY = profile.organizations.evolution_api_key || GLOBAL_API_KEY
  
  console.log(`🔌 Verificando instância: ${instanceName} em ${EVOLUTION_URL}`)

  try {
    // 2. Tenta CRIAR a instância
    const createResponse = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        },
        body: JSON.stringify({
            instanceName: instanceName,
            token: instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        })
    })

    const createData = await createResponse.json()
    
    // === CORREÇÃO AQUI: Detecção robusta de "Já Existe" ===
    let isAlreadyExists = false
    
    // Verifica se a mensagem de erro contém "already in use" ou "already exists"
    // Funciona para texto simples OU array de mensagens
    const msg = JSON.stringify(createData).toLowerCase()
    if (msg.includes("already in use") || msg.includes("already exists")) {
      isAlreadyExists = true
    }

    // Se deu erro E NÃO É porque já existe, aí sim paramos
    if (!createResponse.ok && !isAlreadyExists) {
        console.error("Erro Evolution:", createData)
        return { error: `Erro na API: ${JSON.stringify(createData.response || createData)}` }
    }
    // =======================================================

    // 3. Limpa referência antiga no banco (se houver duplicidade local)
    await supabase.from('whatsapp_instances')
        .delete()
        .eq('organization_id', organizationId)

    // 4. Se já existia, garante que as configurações estão certas
    if (isAlreadyExists) {
       await updateInstanceSettings(instanceName, EVOLUTION_URL, API_KEY)
    }

    // 5. Busca Status / QR Code
    // Se já estiver conectado, essa função vai detectar e retornar connected: true
    const result = await fetchQrCodeLoop(instanceName, EVOLUTION_URL, API_KEY)

    // 6. Atualiza o Banco de Dados com o Status Real
    if (result.qrcode || result.connected) {
      const { error: dbError } = await supabase.from('whatsapp_instances').insert({
        organization_id: organizationId,
        name: instanceName,
        status: result.connected ? 'connected' : 'pending',
        qr_code: result.qrcode || null,
        updated_at: new Date().toISOString()
      })
      
      if (dbError) console.error("Erro ao salvar no banco:", dbError)
    }

    return result

  } catch (error: any) {
    console.error("❌ Erro Crítico de Conexão:", error)
    return { error: `Falha de conexão: ${error.message}` }
  }
}

async function fetchQrCodeLoop(instanceName: string, url: string, apiKey: string) {
    let attempts = 0
    const maxAttempts = 5 

    while (attempts < maxAttempts) {
        attempts++
        try {
            const response = await fetch(`${url}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': apiKey }
            })
            
            const data = await response.json()

            // Caso 1: Retorna QR Code
            if (data.base64 || data.qrcode?.base64) { 
                return { success: true, qrcode: data.base64 || data.qrcode?.base64 }
            }
            
            // Caso 2: Já conectado (Evolution retorna isso de várias formas dependendo da versão)
            const state = data.instance?.state || data.instance?.status
            if (state === 'open' || state === 'connected') {
                return { success: true, connected: true }
            }
            
            await delay(1000)
        } catch (e) {
            await delay(1000)
        }
    }
    return { error: "Não foi possível obter o status. Tente atualizar a página." }
}

async function updateInstanceSettings(instanceName: string, url: string, apiKey: string) {
    try {
        await fetch(`${url}/instance/settings/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                "reject_call": true,
                "groupsIgnore": true,
                "alwaysOnline": true, 
                "readMessages": false,
                "readStatus": false
            })
        })
    } catch (error) {
        // Ignora erro de settings, não é crítico
    }
}

export async function deleteWhatsappInstance() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Auth required" }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations:organization_id(slug, evolution_api_url, evolution_api_key)')
        .eq('id', user.id)
        .single() as any
        
    const instanceName = profile?.organizations?.slug
    const EVOLUTION_URL = profile?.organizations?.evolution_api_url || DEFAULT_EVOLUTION_URL
    const API_KEY = profile?.organizations?.evolution_api_key || GLOBAL_API_KEY
    
    if(instanceName) {
        try {
            await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
                method: 'DELETE', headers: { 'apikey': API_KEY }
            })
            await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE', headers: { 'apikey': API_KEY }
            })
        } catch (e) { console.error("Erro ao deletar na API") }

        await supabase.from('whatsapp_instances').delete().eq('name', instanceName)
    }
    return { success: true }
}