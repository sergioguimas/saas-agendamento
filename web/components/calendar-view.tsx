'use client'

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isSameDay, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentContextMenu } from "./appointment-context-menu"
import { STATUS_CONFIG } from "@/lib/appointment-config"

type Appointment = {
  id: string
  start_time: string
  end_time: string
  status: string
  customer: { name: string } | null
  service: { title: string } | null // <-- Importante: Pode ser null
  profile: { full_name: string } | null
}

type Props = {
  appointments?: Appointment[]
  customers?: any[]
  services?: any[]
  staff?: any[]
  organization_id: string
}

export function CalendarView({ 
  appointments = [], 
  customers = [], 
  services = [], 
  staff = [], 
  organization_id 
}: Props) {
  const [date, setDate] = useState<Date>(new Date())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Debug: Mostra no console do navegador o que está chegando (Aperte F12 para ver)
    console.log("Agendamentos recebidos:", appointments)
  }, [appointments])

  if (!isMounted) {
    return <div className="p-8 text-center text-muted-foreground">Carregando agenda...</div>
  }

  const safeAppointments = Array.isArray(appointments) ? appointments : []

  const dailyAppointments = safeAppointments
    .filter(app => {
      if (!date || !app.start_time) return false
      const appDate = new Date(app.start_time)
      // Proteção: Só mostra se a data for válida
      return isValid(appDate) && isSameDay(appDate, date)
    })
    .sort((a, b) => {
      const timeA = new Date(a.start_time).getTime() || 0
      const timeB = new Date(b.start_time).getTime() || 0
      return timeA - timeB
    })

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Card className="w-full md:w-auto h-fit">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => day && setDate(day)}
            locale={ptBR}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>
            {isValid(date) ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Data Inválida'}
          </CardTitle>
          <CreateAppointmentDialog 
            customers={Array.isArray(customers) ? customers : []}
            services={Array.isArray(services) ? services : []}
            staff={Array.isArray(staff) ? staff : []}
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
                  // Proteção contra falha no parse da data
                  const startTime = new Date(app.start_time)
                  if (!isValid(startTime)) return null 

                  const statusColor = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || "bg-gray-500"
                  
                  return (
                    <AppointmentContextMenu key={app.id} appointmentId={app.id}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${statusColor}`} />
                          <div>
                            <p className="font-medium text-lg">
                              {format(startTime, "HH:mm")} - {app.customer?.name || "Cliente sem nome"}
                            </p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              {/* Proteção: Usa ?. para não quebrar se o serviço for null */}
                              <span>{app.service?.title || "Serviço Indefinido"}</span>
                              {app.profile && (
                                <>
                                  <span>•</span>
                                  <span>Dr(a). {app.profile?.full_name || ""}</span>
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