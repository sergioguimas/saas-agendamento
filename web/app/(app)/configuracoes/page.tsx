import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  // 1. Verificar se o usuário está autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // 2. Buscar perfil completo com os dados da organização vinculada
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organizations:organizations_id (*)
    `)
    .eq('id', user.id)
    .single() as any

  // 3. Buscar o status atual da instância de WhatsApp no banco
  const { data: whatsapp } = await supabase
    .from('whatsapp_instances')
    .select('status')
    .eq('organization_id', profile?.organizations_id)
    .single() as any

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie as informações da sua clínica e sua conta profissional.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <SettingsForm 
          profile={profile} 
          whatsappStatus={whatsapp?.status || 'disconnected'} 
        />
      </div>
    </div>
  )
}