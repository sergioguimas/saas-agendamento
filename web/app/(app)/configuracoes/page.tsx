import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organizations:organizations_id (*)
    `)
    .eq('id', user.id)
    .single() as any

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-zinc-100">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-zinc-400 text-sm">
          {profile?.organizations_id 
            ? "Gerencie as informações da sua clínica." 
            : "Complete seu cadastro para começar."}
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Passamos o perfil, mesmo que a organização dentro dele seja nula */}
        <SettingsForm profile={profile} />
      </div>
    </div>
  )
}