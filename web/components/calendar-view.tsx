'use client'

import { useState } from "react"
import { 
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, addDays, subDays, 
  isToday, parseISO, startOfDay, addWeeks, subWeeks, getHours
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentContextMenu } from "./appointment-context-menu"

type Appointment = {
  id: string
  start_time: string
  end_time: string
  status: string
  customers: { name: string } | null
  services: { name: string; color?: string } | null
}

type Props = {
  appointments: Appointment[]
  customers: { id: string; name: string }[]
  services: { id: string; name: string; price: number | null }[]
  organizations_id: string
}

export function CalendarView({ appointments, customers, services, organizations_id }: Props) {
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'day'>('day')

  const next = () => setDate(view === 'month' ? addMonths(date, 1) : addDays(date, 1))
  const prev = () => setDate(view === 'month' ? subMonths(date, 1) : subDays(date, 1))

  // Renderização da visualização por Mês
  const renderDays = () => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const days = eachDayOfInterval({ 
      start: startOfWeek(start, { locale: ptBR }), 
      end: endOfWeek(end, { locale: ptBR }) 
    })

    return (
      <div className="grid grid-cols-7 gap-px bg-zinc-800">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="bg-zinc-950 p-2 text-center text-xs font-medium text-zinc-500 uppercase">{d}</div>
        ))}
        {days.map(day => {
          const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.start_time), day))
          return (
            <div key={day.toString()} className={cn(
              "bg-zinc-950 min-h-[120px] p-2 transition-colors hover:bg-zinc-900/50",
              !isSameMonth(day, date) && "opacity-30"
            )}>
              <span className={cn("text-sm font-medium", isToday(day) && "text-blue-500")}>
                {format(day, 'd')}
              </span>
              <div className="mt-2 space-y-1">
                {dayAppointments.map(a => (
                  <AppointmentContextMenu 
                    key={a.id} 
                    appointment={a} 
                    customers={customers} 
                    services={services}
                  >
                    <div className="text-[10px] p-1 rounded bg-zinc-900 border border-zinc-800 truncate cursor-pointer hover:border-zinc-700 transition-colors text-zinc-300">
                      {format(parseISO(a.start_time), 'HH:mm')} - {a.customers?.name}
                    </div>
                  </AppointmentContextMenu>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Renderização da visualização por Dia
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.start_time), date))

    return (
      <div className="flex flex-col bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
        {hours.map(hour => (
          <div key={hour} className="group flex border-b border-zinc-900 last:border-0 min-h-[80px]">
            <div className="w-20 p-4 text-xs text-zinc-500 border-r border-zinc-900 bg-zinc-950/50">
              {format(new Date().setHours(hour, 0), 'HH:mm')}
            </div>
            <div className="flex-1 p-2 relative bg-zinc-900/20 group-hover:bg-zinc-900/30 transition-colors">
              {dayAppointments
                .filter(a => getHours(parseISO(a.start_time)) === hour)
                .map(a => (
                  <AppointmentContextMenu 
                    key={a.id} 
                    appointment={a} 
                    customers={customers} 
                    services={services}
                  >
                    <div className="mb-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm cursor-pointer hover:border-zinc-600 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-zinc-100">{a.customers?.name}</span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(a.start_time), 'HH:mm')} - {format(parseISO(a.end_time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">{a.services?.name}</div>
                    </div>
                  </AppointmentContextMenu>
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800 p-1">
            <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} className="text-xs font-medium px-3 text-zinc-400 hover:text-zinc-100">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 capitalize min-w-[200px]">
            {view === 'day' 
              ? format(date, "d 'de' MMMM", { locale: ptBR }) 
              : format(date, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-950">
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="day">Dia</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="h-6 w-px bg-zinc-800 mx-2 hidden md:block" />
          
          {/* Único botão de Novo Agendamento funcional */}
          <CreateAppointmentDialog customers={customers} services={services} organizations_id={organizations_id}/>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden shadow-2xl">
        {view === 'month' ? renderDays() : renderDayView()}
      </div>
    </div>
  )
}