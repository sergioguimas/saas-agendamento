'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Smartphone, Loader2, CheckCircle2, RefreshCw } from "lucide-react"
import { createWhatsappInstance, deleteWhatsappInstance } from "@/app/actions/whatsapp-connect"
import { toast } from "sonner"

export function WhatsappSettings({ initialStatus }: { initialStatus?: string | null }) {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(initialStatus === 'connected')

  // Função para limpar tudo (Reset Nuclear)
  async function handleReset() {
    // Confirmação simples antes de resetar
    if(!confirm("Tem certeza? Isso irá desconectar o WhatsApp da clínica.")) return;
    
    setLoading(true)
    try {
        await deleteWhatsappInstance()
        setQrCode(null)
        setIsConnected(false)
        toast.success("Conexão resetada com sucesso.")
    } catch (e) {
        toast.error("Erro ao resetar.")
    } finally {
        setLoading(false)
    }
  }

  async function handleConnect() {
    setLoading(true)
    setQrCode(null) 
    
    try {
      // --- CORREÇÃO AQUI: Adicionamos 'as any' para evitar o erro de TypeScript ---
      const result = await createWhatsappInstance() as any

      if (result.error) {
        toast.error(result.error)
        return
      }

      // Agora o TS aceita acessar .connected e .qrcode
      if (result.connected) {
        setIsConnected(true)
        setQrCode(null)
        toast.success("WhatsApp conectado e sincronizado!")
      } 
      else if (result.qrcode) {
        setQrCode(result.qrcode)
        setIsConnected(false)
        toast.info("Aponte a câmera do celular para conectar.")
      }

    } catch (error) {
      toast.error("Erro inesperado.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-3">
           <div className="p-2 bg-green-900/20 rounded-lg">
              <Smartphone className="h-6 w-6 text-green-500" />
           </div>
           <div>
              <CardTitle className="text-zinc-100">Integração WhatsApp</CardTitle>
              <CardDescription className="text-zinc-400">
                Conecte o WhatsApp da clínica para enviar confirmações automáticas.
              </CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
          
          {/* ESTADO: CONECTADO */}
          {isConnected ? (
              <div className="bg-green-950/30 border border-green-900/50 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in duration-300">
                  <div className="bg-green-500/10 p-3 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-green-400">WhatsApp Conectado!</h3>
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto mt-1">
                        Sua clínica está pronta para enviar mensagens.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="border-zinc-700 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-900 mt-2"
                  >
                      Desconectar
                  </Button>
              </div>
          ) : (
              /* ESTADO: DESCONECTADO */
              <div className="flex flex-col items-center justify-center space-y-6 py-4">
                  {!qrCode ? (
                      <div className="text-center space-y-4 flex flex-col items-center">
                          <p className="text-sm text-zinc-400 max-w-md mx-auto">
                              O sistema irá gerar uma instância exclusiva para sua clínica.
                          </p>
                          <Button 
                              onClick={handleConnect} 
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] shadow-lg shadow-green-900/20 transition-all"
                          >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Conectando...
                                </>
                              ) : (
                                <>
                                  <QrCode className="mr-2 h-4 w-4" />
                                  Gerar QR Code
                                </>
                              )}
                          </Button>
                          
                          {/* Link discreto para resetar em caso de erro */}
                          <button 
                            onClick={handleReset}
                            className="text-xs text-zinc-700 hover:text-zinc-500 mt-2 underline"
                          >
                            Resetar conexão travada
                          </button>
                      </div>
                  ) : (
                      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="bg-white p-4 rounded-xl inline-block shadow-xl shadow-green-900/10 border-4 border-white">
                              <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
                           </div>
                           <div className="flex gap-3 justify-center pt-2">
                             <Button variant="ghost" onClick={() => setQrCode(null)}>Cancelar</Button>
                             <Button variant="secondary" onClick={handleConnect}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Atualizar
                             </Button>
                           </div>
                      </div>
                  )}
              </div>
          )}
      </CardContent>
    </Card>
  )
}