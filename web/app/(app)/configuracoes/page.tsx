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
  // O 'as any' aqui já estava salvando o perfil de erros de tipagem
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organizations:organizations_id (*)
    `)
    .eq('id', user.id)
    .single() as any

  // 3. Buscar o status atual da instância de WhatsApp no banco
  // CORREÇÃO: Adicionamos 'as any' aqui para evitar o erro "type never" no Vercel
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
        {/* 4. Passamos o perfil e o status do WhatsApp para o Formulário */}
        <SettingsForm 
          profile={profile} 
          whatsappStatus={whatsapp?.status || 'disconnected'} 
        />
      </div>
    </div>
  )
}