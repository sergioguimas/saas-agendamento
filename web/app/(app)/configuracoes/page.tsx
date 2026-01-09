import { createClient } from "@/utils/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsForm } from "./settings-form"
import { PreferencesForm } from "./preferences-form"
import { Building2, CalendarClock } from "lucide-react"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  
  // 1. Busca Usuário e Perfil
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) return <div>Não autorizado</div>

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  
  // 2. Busca Organização
  let organization = null
  if (profile?.organization_id) {
    const { data } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single()
    organization = data
  }

  // 3. Busca Configurações Operacionais (Settings)
  // Nota: Se não existir, retornará null, o form deve lidar com isso ou criar default
  const { data: settings } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', profile?.organization_id || "")
    .single()

  return (
    <div className="container max-w-4xl py-8 space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie os dados da clínica, conexão e automações.</p>
      </div>

      {/* MACRO-ESTRUTURA: 2 ABAS PRINCIPAIS */}
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="geral" className="text-base gap-2">
            <Building2 className="h-4 w-4"/> 
            Dados & Conexão
          </TabsTrigger>
          <TabsTrigger value="agenda" className="text-base gap-2">
            <CalendarClock className="h-4 w-4"/> 
            Agenda & Bot
          </TabsTrigger>
        </TabsList>

        {/* CONTEÚDO DA ABA 1: Passamos perfil e organização */}
        <TabsContent value="geral" className="mt-0">
          <SettingsForm 
             profile={profile} 
             organization={organization} 
          />
        </TabsContent>

        {/* CONTEÚDO DA ABA 2: Passamos settings e o ID da organização */}
        <TabsContent value="agenda" className="mt-0">
          <PreferencesForm 
            settings={settings} 
            organizationId={profile?.organization_id || ""}
          />
        </TabsContent>
        
      </Tabs>
    </div>
  )
}