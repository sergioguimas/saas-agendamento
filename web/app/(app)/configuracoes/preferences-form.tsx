'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare, Clock, Save, Info } from "lucide-react"
import { updatePreferences } from "@/app/actions/update-preferences"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function PreferencesForm({ settings, organizationId }: { settings: any, organizationId: string }) {
  const [isPending, startTransition] = useTransition()

  // Mapeamento dos dias
  const daysMap = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
    { id: 6, label: 'Sábado' },
  ]

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePreferences(formData)
      if (result.success) {
        toast.success("Preferências salvas com sucesso!")
      } else {
        toast.error("Erro ao salvar preferências.")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 animate-in fade-in">
      <input type="hidden" name="organization_id" value={organizationId} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/> Funcionamento</CardTitle>
          <CardDescription>Defina os dias e horários que a clínica está aberta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="open_hours_start">Abertura</Label>
              <Input type="time" id="open_hours_start" name="open_hours_start" defaultValue={settings?.open_hours_start || "08:00"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open_hours_end">Fechamento</Label>
              <Input type="time" id="open_hours_end" name="open_hours_end" defaultValue={settings?.open_hours_end || "18:00"} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duração Padrão do Atendimento (minutos)</Label>
            <Input type="number" name="appointment_duration" defaultValue={settings?.appointment_duration || 60} />
          </div>

          <div className="space-y-3">
            <Label>Dias de Funcionamento</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {daysMap.map((day) => (
                <div key={day.id} className="flex items-center space-x-2 border p-3 rounded-md">
                  <Checkbox 
                    id={`day-${day.id}`} 
                    name="days_of_week" 
                    value={day.id.toString()} 
                    defaultChecked={settings?.days_of_week?.includes(day.id)}
                  />
                  <label htmlFor={`day-${day.id}`} className="text-sm font-medium leading-none cursor-pointer">
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex gap-3 text-sm">
          <Info className="h-5 w-5 shrink-0" />
          <div>
              <p className="font-bold">Variáveis do Robô:</p>
              <p>Use <strong>{'{name}'}</strong> (cliente), <strong>{'{date}'}</strong> (data), <strong>{'{time}'}</strong> (hora) e <strong>{'{service}'}</strong> (serviço).</p>
          </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/> Mensagens Automáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label className="text-base font-semibold text-green-700">1. Ao Agendar (Confirmação)</Label>
            <Textarea 
              name="whatsapp_message_created" 
              defaultValue={settings?.whatsapp_message_created || "Olá {name}, seu agendamento foi confirmado para {date} às {time}."}
              rows={3} 
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-base font-semibold text-blue-700">2. Lembrete (Dia Anterior)</Label>
            <Textarea 
              name="whatsapp_message_reminder" 
              defaultValue={settings?.whatsapp_message_reminder || "Olá {name}, lembrete do seu agendamento amanhã às {time}. Confirma?"}
              rows={3} 
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-base font-semibold text-red-700">3. Ao Cancelar</Label>
            <Textarea 
              name="whatsapp_message_canceled" 
              defaultValue={settings?.whatsapp_message_canceled || "Olá {name}, seu agendamento foi cancelado."} 
              rows={3} 
            />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Salvar Preferências
          </Button>
      </div>
    </form>
  )
}