'use client'

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, MessageSquare, Save, Loader2 } from "lucide-react"
import { updatePreferences } from "@/app/actions/update-preferences"
import { toast } from "sonner"

export function PreferencesForm({ settings, organizationId }: { settings: any, organizationId: string }) {
  const [isPending, startTransition] = useTransition()

  const daysMap = [
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' },
  ]

  // Handler Genérico: Funciona para ambas as abas pois envia organizationId
  async function handleSave(formData: FormData) {
    startTransition(async () => {
      // Garante que o ID da organização vai junto
      formData.append('organizationId', organizationId)
      
      const result = await updatePreferences(formData)
      
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Configurações salvas com sucesso!")
      }
    })
  }

  return (
    <Tabs defaultValue="hours" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
        <TabsTrigger value="hours" className="py-2 gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Horários</span>
        </TabsTrigger>
        <TabsTrigger value="messages" className="py-2 gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Mensagens do Bot</span>
        </TabsTrigger>
      </TabsList>

      {/* SUB-ABA 1: HORÁRIOS */}
      <TabsContent value="hours">
        <form action={handleSave}>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Jornada de Trabalho</CardTitle>
              <CardDescription>Defina quando o sistema aceita agendamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Abertura</Label>
                  <Input type="time" name="open_hours_start" defaultValue={settings?.open_hours_start || "08:00"} />
                </div>
                <div className="space-y-2">
                  <Label>Fechamento</Label>
                  <Input type="time" name="open_hours_end" defaultValue={settings?.open_hours_end || "18:00"} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duração Padrão (Minutos)</Label>
                <Input type="number" name="appointment_duration" defaultValue={settings?.appointment_duration || 30} />
              </div>

              <div className="space-y-3">
                <Label>Dias de Funcionamento</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {daysMap.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day.id}`} 
                        name="days_of_week" 
                        value={day.id.toString()}
                        defaultChecked={settings?.days_of_week?.includes(day.id)}
                      />
                      <label htmlFor={`day-${day.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end p-6 pt-0 border-t mt-4 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Horários
              </Button>
            </div>
          </Card>
        </form>
      </TabsContent>

      {/* SUB-ABA 2: MENSAGENS */}
      <TabsContent value="messages">
        <form action={handleSave}>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Personalização do Bot</CardTitle>
              <CardDescription>Edite as mensagens automáticas enviadas pelo WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-green-600">Ao Agendar (Confirmação)</Label>
                <Textarea 
                  name="whatsapp_message_created" 
                  defaultValue={settings?.whatsapp_message_created || "Olá {name}, seu agendamento foi confirmado para {date} às {time}."}
                  rows={3} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-blue-600">Lembrete (Dia Anterior)</Label>
                <Textarea 
                  name="whatsapp_message_reminder" 
                  defaultValue={settings?.whatsapp_message_reminder || "Olá {name}, lembrete do seu agendamento amanhã às {time}. Confirma?"}
                  rows={3} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-red-600">Ao Cancelar</Label>
                <Textarea 
                  name="whatsapp_message_canceled" 
                  defaultValue={settings?.whatsapp_message_canceled || "Olá {name}, seu agendamento foi cancelado."} 
                  rows={3} 
                />
              </div>
              
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                 <strong>Variáveis disponíveis:</strong> {'{name}'} (Nome do Paciente), {'{date}'} (Data), {'{time}'} (Horário), {'{service}'} (Nome do Serviço).
              </div>
            </CardContent>
            <div className="flex justify-end p-6 pt-0 border-t mt-4 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Mensagens
              </Button>
            </div>
          </Card>
        </form>
      </TabsContent>

    </Tabs>
  )
}