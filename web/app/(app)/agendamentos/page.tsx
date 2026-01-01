import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"

export default async function AgendamentosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Busca perfil e organização
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizations_id')
    .eq('id', user.id)
    .single() as any

  if (!profile?.organizations_id) {
    return (
      <div className="p-8 text-zinc-400">
        Erro: Perfil sem organização vinculada. Por favor, saia e entre novamente.
      </div>
    )
  }

  // 2. Busca Pacientes e Serviços ativos para o Modal
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name')
    .eq('organizations_id', profile.organizations_id)
    .eq('active', true)
    .order('full_name') as any

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration, color')
    .eq('organizations_id', profile.organizations_id)
    .eq('active', true) as any

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-zinc-100">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Agenda Médica</h1>
          <p className="text-zinc-400 text-sm">Gerencie seus horários e atendimentos.</p>
        </div>
        
        <CreateAppointmentDialog 
          customers={customers} 
          services={services} 
          organizations_id={profile.organizations_id} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Lado Esquerdo: Mini Calendário ou Filtros */}
        <div className="lg:col-span-1 space-y-4">
           <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center text-zinc-500">
             Calendário Semanal (Em breve)
           </div>
        </div>

        {/* Lado Direito: Lista de Horários do Dia */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" /> Horários de Hoje
          </h2>
          
          <div className="border-2 border-dashed border-zinc-800 rounded-2xl py-20 text-center">
            <CalendarIcon className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Nenhum agendamento para hoje.</p>
            <Button variant="link" className="text-blue-500 mt-2">Agendar primeiro paciente</Button>
          </div>
        </div>
      </div>
    </div>
  )
}