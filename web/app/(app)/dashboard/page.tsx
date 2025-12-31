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

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {profile?.full_name || user.user_metadata?.full_name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card da Empresa - Agora mais compacto */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-0 pt-4"> {/* pb-0 remove o espaço de baixo do título */}
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Sua Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4"> {/* pt-1 deixa o nome logo abaixo do título */}
            <div className="text-xl font-bold text-zinc-100 truncate">
              {profile?.organizations?.name || 'Sem Empresa'}
            </div>
          </CardContent>
        </Card>

        {/* Card do Cargo - Seguindo o mesmo padrão compacto */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-0 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Seu Cargo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-xl font-bold capitalize text-zinc-100">
              {profile?.role || 'Admin'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}