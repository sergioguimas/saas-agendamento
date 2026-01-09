'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Link, LogOut, Loader2, Smartphone } from "lucide-react"
import { toast } from "sonner"
// Importamos as funções do SEU arquivo
import { createWhatsappInstance, deleteWhatsappInstance, getWhatsappStatus } from "@/app/actions/whatsapp-connect"

export function WhatsappSettings() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Checa status ao abrir a tela
  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
      const result = await getWhatsappStatus()
      if (result.status === 'connected') {
          setStatus('connected')
          setQrCode(null)
      } else {
          setStatus('disconnected')
      }
  }

  // BOTÃO: CONECTAR (Gera QR Code)
  async function handleConnect() {
    setIsLoading(true)
    setQrCode(null) // Limpa anterior

    const result = await createWhatsappInstance()
    
    setIsLoading(false)

    if (result.error) {
        toast.error(result.error)
        return
    }

    if (result.connected) {
        setStatus('connected')
        toast.success("WhatsApp já conectado!")
    } else if (result.qrcode) {
        setQrCode(result.qrcode)
        toast.success("QR Code gerado com sucesso!")
    }
  }

  // BOTÃO: DESCONECTAR
  async function handleLogout() {
    if(!confirm("Deseja desconectar o WhatsApp?")) return
    
    setIsLoading(true)
    await deleteWhatsappInstance()
    
    // Aguarda um pouquinho para a API processar
    setTimeout(() => {
        setIsLoading(false)
        setStatus('disconnected')
        setQrCode(null)
        toast.success("Desconectado.")
    }, 2000)
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-slate-500" />
                <span>Conexão WhatsApp</span>
            </div>
            {status === 'connected' && <Badge className="bg-green-600">Online</Badge>}
            {status === 'disconnected' && <Badge variant="outline" className="text-slate-500">Offline</Badge>}
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code para conectar o robô de agendamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
            
            {/* CASO 1: LOADING GERAL */}
            {status === 'loading' && (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            )}

            {/* CASO 2: CONECTADO */}
            {status === 'connected' && (
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Link className="h-10 w-10" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">WhatsApp Conectado!</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Seu sistema já está pronto para enviar lembretes e responder clientes.
                        </p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={handleLogout} disabled={isLoading}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Desconectar
                    </Button>
                </div>
            )}

            {/* CASO 3: MOSTRANDO QR CODE */}
            {status === 'disconnected' && qrCode && (
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-4 rounded-xl shadow-md border inline-block">
                        <img src={qrCode} alt="QR Code" className="h-64 w-64 object-contain" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium animate-pulse">
                        Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                         <Button variant="ghost" onClick={() => setQrCode(null)}>Cancelar</Button>
                         <Button onClick={checkStatus}>Já escaneei</Button>
                    </div>
                </div>
            )}

            {/* CASO 4: DESCONECTADO (Estado Inicial) */}
            {status === 'disconnected' && !qrCode && (
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="h-20 w-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                            <QrCode className="h-10 w-10 text-slate-500" />
                        </div>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-lg text-slate-700">Conectar Novo Número</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                            Clique no botão abaixo para gerar um QR Code e vincular o WhatsApp da clínica.
                        </p>
                    </div>

                    <Button size="lg" onClick={handleConnect} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? "Gerando QR Code..." : "Gerar QR Code"}
                    </Button>
                </div>
            )}

        </div>
      </CardContent>
    </Card>
  )
}