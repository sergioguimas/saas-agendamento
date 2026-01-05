'use client'

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentContextMenu } from "./appointment-context-menu"
import { STATUS_CONFIG } from "@/lib/appointment-config"

// --- FUNÇÃO DE CORREÇÃO DE FUSO ---
// Garante que pegamos a data atual do Brasil, mesmo rodando no servidor UTC da Vercel
function getBrazilDate() {
  const now = new Date()
  // Cria uma data baseada no fuso de São Paulo
  const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  return brazilTime
}

type Appointment = {
  id: string
  start_time: string
  end_time: string
  status: string
  customer: { name: string } | null
  service: { title: string }
  profile: { full_name: string } | null
}

type Props = {
  appointments: Appointment[]
  customers: any[]
  services: any[]
  staff: any[]
  organization_id: string
}

export function CalendarView({ appointments, customers, services, staff, organization_id }: Props) {
  // Inicializa usando a hora do Brasil
  const [date, setDate] = useState<Date | undefined>(getBrazilDate())
  
  // Estado para garantir que a UI só renderize data final no cliente (evita erro de hidratação)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Atualiza para a data do navegador do cliente para ter certeza absoluta
    setDate(new Date())
  }, [])

  // Filtra agendamentos do dia selecionado
  const dailyAppointments = appointments
    .filter(app => {
      if (!date) return false
      // Ajuste: Compara datas locais para evitar confusão de fuso
      const appDate = new Date(app.start_time)
      return isSameDay(appDate, date)
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  // Se ainda não montou no cliente, não renderiza o calendário para evitar glitch visual
  if (!mounted) return null

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Coluna da Esquerda: Calendário */}
      <Card className="w-full md:w-auto h-fit">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Coluna da Direita: Lista de Agendamentos */}
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>
            {date ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
          </CardTitle>
          <CreateAppointmentDialog 
            customers={customers} 
            services={services} 
            staff={staff}
            organization_id={organization_id}
          />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="morning">Manhã</TabsTrigger>
              <TabsTrigger value="afternoon">Tarde</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {dailyAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum agendamento para este dia.
                </p>
              ) : (
                dailyAppointments.map((app) => {
                  const statusColor = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || "bg-gray-500"
                  
                  return (
                    <AppointmentContextMenu key={app.id} appointmentId={app.id}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${statusColor}`} />
                          <div>
                            <p className="font-medium text-lg">
                              {format(new Date(app.start_time), "HH:mm")} - {app.customer?.name || "Cliente sem nome"}
                            </p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>{app.service.title}</span>
                              {app.profile && (
                                <>
                                  <span>•</span>
                                  <span>Dr(a). {app.profile.full_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium capitalize px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                          {app.status === 'confirmed' ? 'Confirmado' : 
                           app.status === 'scheduled' ? 'Agendado' : app.status}
                        </div>
                      </div>
                    </AppointmentContextMenu>
                  )
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}