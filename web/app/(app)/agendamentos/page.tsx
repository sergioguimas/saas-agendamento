import { createClient } from "@/utils/supabase/server"
import { CalendarView } from "@/components/calendar-view"
import { redirect } from "next/navigation"

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  // 1. Buscar Pacientes (RLS filtra automaticamente)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .order('name')

  // 2. Buscar Serviços (RLS filtra automaticamente)
  const { data: services } = await supabase
    .from('services')
    .select('id, title, price')
    .eq('is_active', true)
    .order('title')

  // 3. Buscar Agendamentos
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status, 
      customers (name),
      services (title, color)
    `)
    .order('start_time', { ascending: true })

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-100">Agenda Médica</h1>
        <p className="text-zinc-400">Visualize e gerencie seus atendimentos.</p>
      </div>

      <CalendarView 
        // @ts-ignore
        appointments={appointments || []} 
        // @ts-ignore
        customers={customers || []} 
        // @ts-ignore
        services={services || []} 
      />
    </div>
  )
}