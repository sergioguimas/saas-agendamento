import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { TenantForm } from "@/components/tenant-form"

export default async function NovoClientePage() {
  // 1. VERIFICAÇÃO DE SEGURANÇA (SERVER SIDE)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const MY_EMAIL = 'adm@adm.com' // Seu email de admin

  if (!user || user.email !== MY_EMAIL) {
    return redirect('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg bg-card shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Painel God Mode ⚡</h1>
        <p className="text-sm text-muted-foreground">Criação de novos tenants (Clínicas)</p>
      </div>
      
      <TenantForm />
    </div>
  )
}