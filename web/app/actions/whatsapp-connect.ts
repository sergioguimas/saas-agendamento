'use server'

import { createClient } from "@/utils/supabase/server"

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "http://127.0.0.1:8082"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "medagenda123"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function createWhatsappInstance() {
  const supabase = await createClient()
  
  // Pegando usuário para garantir segurança, mas usaremos nome fixo para teste
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  // NOME DA INSTÂNCIA FIXO E LIMPO
  const instanceName = "medagenda_v3" 

  console.log("🚀 [Evolution v3] Iniciando:", instanceName)

  try {
    // 1. Tenta criar a instância com CONFIGURAÇÃO ZERO SYNC
    // Não verificamos se existe antes, tentamos criar. Se existir, a API avisa e nós conectamos.
    
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
            
            reject_call: true,
            groupsIgnore: true,
            alwaysOnline: false,
            readMessages: false,
            readStatus: false,
            syncFullHistory: false,
            
            // Navegador Padrão Estável
            browser: ["Ubuntu", "Chrome", "110.0.5481.177"]
        })
    })

    const createData = await createResponse.json()
    
    // Se erro for "já existe", tudo bem. Se for outro erro, loga.
    if (!createResponse.ok && createData?.response?.message?.[0] !== "Instance already exists") {
        console.log("⚠️ Aviso na criação:", createData)
    }

    // 2. Busca o QR Code (Loop de 60 segundos)
    return await fetchQrCodeLoop(instanceName)

  } catch (error) {
    console.error("❌ Erro Crítico:", error)
    return { error: "Erro de conexão com API" }
  }
}

async function fetchQrCodeLoop(instanceName: string) {
    let attempts = 0
    const maxAttempts = 30 

    while (attempts < maxAttempts) {
        attempts++
        try {
            const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': EVOLUTION_API_KEY }
            })
            
            const data = await response.json()

            // QR Code Disponível
            if (data.base64 || (data.code && data.code !== 200)) { 
                console.log("📸 QR Code Recebido!")
                return { success: true, qrcode: data.base64, code: data.code }
            }
            
            // Já Conectado
            if (data.instance?.status === 'open') {
                return { success: true, connected: true }
            }

            console.log(`⏳ Aguardando QR Code... (${attempts}/${maxAttempts})`)
            await delay(3000)

        } catch (e) {
            await delay(3000)
        }
    }
    return { error: "Timeout: O servidor demorou para gerar o QR Code." }
}