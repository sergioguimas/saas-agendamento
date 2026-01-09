import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "../configuracoes/settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SetupPage() {
  const supabase = await createClient()

  // 1. Busca Usuário
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  // 2. Busca Perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Busca Organização (se existir)
  let organization = null
  if (profile?.organization_id) {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()
    organization = data
  }
  
  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuração Inicial</h1>
        <p className="text-muted-foreground">
          Complete os dados da sua clínica para começar a usar o sistema.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Passamos apenas profile e organization. O form já sabe lidar sem templates. */}
        <SettingsForm profile={profile} organization={organization} />
      </div>
    </div>
  )
}