'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Link, AlertCircle } from "lucide-react"

interface WhatsappSettingsProps {
  organization: any
}

export function WhatsappSettings({ organization }: WhatsappSettingsProps) {
  
  const instanceName = organization?.slug || "Sem instância"
  const isConnected = false // Por enquanto deixamos fixo, depois conectamos com a API real

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <span>Conexão WhatsApp (Evolution API)</span>
            <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
        </CardTitle>
        <CardDescription>
          Configurações da instância <strong>{instanceName}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Evolution API URL</Label>
                <Input 
                    name="evolution_url" 
                    defaultValue={organization?.evolution_api_url || ''} 
                    placeholder="Ex: https://api.meusite.com" 
                />
            </div>
            <div className="space-y-2">
                <Label>API Key (Global)</Label>
                <Input 
                    name="evolution_apikey" 
                    type="password"
                    defaultValue={organization?.evolution_api_key || ''} 
                    placeholder="Sua chave de API" 
                />
            </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-start gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
                <p className="font-bold">Atenção:</p>
                <p>Certifique-se de que a instância <strong>{instanceName}</strong> já foi criada no seu painel da Evolution API.</p>
            </div>
        </div>

        <div className="pt-2 flex gap-2">
            <Button variant="outline" type="button" disabled>
                <QrCode className="mr-2 h-4 w-4" />
                Ler QR Code
            </Button>
            <Button variant="outline" type="button" disabled>
                <Link className="mr-2 h-4 w-4" />
                Testar Conexão
            </Button>
        </div>

      </CardContent>
    </Card>
  )
}