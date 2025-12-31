import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Verifica quem é o usuário
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // 2. Busca os dados do Perfil e da Organização
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organizations:organizations_id (
        name,
        slug
      )
    `)
    .eq('id', user.id)
    .single() as any

  // Para garantir que o TypeScript entenda a estrutura interna:
  const org = profile?.organizations

  // 3. Busca Indicadores (Contagens)
  const [servicesCount, patientsCount, appointmentsToday] = await Promise.all([
    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('organizations_id', profile.organizations_id),
    
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organizations_id', profile.organizations_id),

    supabase
      .from('appointments')
      .select(`
        *,
        customers:customer_id (full_name),
        services:service_id (name)
      `) // Explicita que customer_id é a ponte para a tabela customers
      .eq('organizations_id', profile.organizations_id)
      .gte('start_time', new Date().toISOString().split('T')[0])
      .order('start_time', { ascending: true })
  ]) as any

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {profile?.full_name || user.user_metadata?.full_name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card da Empresa */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-sm max-w-xs">
          <CardContent className="p-4 flex flex-col justify-center min-h-[90px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
              Sua Empresa
            </p>
            <div className="text-lg font-bold text-zinc-100 truncate leading-tight">
              {profile?.organizations?.name || 'Sem Empresa'}
            </div>
          </CardContent>
        </Card>

        {/* Card do Cargo */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-sm max-w-xs">
          <CardContent className="p-4 flex flex-col justify-center min-h-[90px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
              Seu Cargo
            </p>
            <div className="text-lg font-bold capitalize text-zinc-100 leading-tight">
              {profile?.role || 'Admin'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Indicadores */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-400">Procedimentos Ativos</p>
                <h2 className="text-3xl font-bold mt-2">{servicesCount.count || 0}</h2>
                <p className="text-xs text-zinc-500 mt-1">Serviços cadastrados</p>
              </div>
              <div className="text-blue-500"> {/* Ícone aqui */} </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-400">Base de Pacientes</p>
                <h2 className="text-3xl font-bold mt-2">{patientsCount.count || 0}</h2>
                <p className="text-xs text-zinc-500 mt-1">Total de clientes registrados</p>
              </div>
              <div className="text-green-500"> {/* Ícone aqui */} </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-400">Agenda Hoje</p>
                <h2 className="text-3xl font-bold mt-2">{appointmentsToday.data?.length || 0}</h2>
                <p className="text-xs text-zinc-500 mt-1">Consultas marcadas para hoje</p>
              </div>
              <div className="text-purple-500"> {/* Ícone aqui */} </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Próximo Atendimento */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Próximo Atendimento</h3>
        {appointmentsToday.data?.[0] ? (
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                  {appointmentsToday.data[0].customers?.full_name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg">{appointmentsToday.data[0].customers?.full_name}</p>
                  <p className="text-sm text-zinc-400">
                    {appointmentsToday.data[0].services?.name} • {new Date(appointmentsToday.data[0].start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                Confirmado
              </span>
            </div>
          </Card>
        ) : (
          <div className="text-zinc-500 italic p-8 border border-dashed border-zinc-800 rounded-lg text-center">
            Nenhuma consulta agendada para o restante do dia.
          </div>
        )}
      </div>

    </div>
  )
}