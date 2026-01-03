import { Metadata } from "next"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { 
  Users, Search, Phone, 
  ChevronRight, FileText 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CreateCustomerDialog } from "@/components/create-customer-dialog"

export const metadata: Metadata = {
  title: "Pacientes | Eliza",
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const query = searchParams?.q || ""

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // CORREÇÃO 1: organization_id (singular)
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single() as any

  if (!profile?.organization_id) redirect('/configuracoes')

  // Busca pacientes filtrando pela organização
  // CORREÇÃO 2: organization_id (singular)
  let customerQuery = supabase
    .from('customers')
    .select('*')
    .eq('organization_id', profile.organization_id) 
    .order('active', { ascending: false })
    .order('name', { ascending: true })

  if (query) {
    customerQuery = customerQuery.ilike('name', `%${query}%`)
  }

  const { data: customers } = await customerQuery as any;

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-zinc-400 text-sm">
            Gerencie o cadastro e histórico clínico dos seus pacientes.
          </p>
        </div>
        {/* CORREÇÃO 5: Passando a prop com nome atualizado. 
            ATENÇÃO: Você precisará atualizar o arquivo do Dialog também! */}
        <CreateCustomerDialog organization_id={profile.organization_id} />
      </div>

      {/* Barra de Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <form method="GET">
          <Input 
            name="q"
            placeholder="Buscar por nome..." 
            defaultValue={query}
            className="pl-10 bg-zinc-900/50 border-zinc-800 focus:ring-blue-500"
          />
        </form>
      </div>

      <div className="grid gap-4">
        {customers?.map((customer: any) => {
          const isActive = customer.active !== false;

          return (
            <Link 
              key={customer.id} 
              href={`/clientes/${customer.id}`} 
              prefetch={false}
              className="block group"
            >
              <Card className={cn(
                "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 transition-all cursor-pointer relative overflow-hidden",
                !isActive && "opacity-75 border-amber-900/20"
              )}>
                
                {!isActive && (
                  <div className="absolute top-0 right-0 bg-amber-500/10 border-l border-b border-amber-500/20 px-3 py-1">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Inativo</span>
                  </div>
                )}

                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center border transition-colors",
                      isActive 
                        ? "bg-blue-500/10 border-blue-500/20" 
                        : "bg-zinc-800/50 border-zinc-700/50"
                    )}>
                      <span className={cn(
                        "font-bold text-lg",
                        isActive ? "text-blue-500" : "text-zinc-600"
                      )}>
                        {customer.name?.charAt(0).toUpperCase() || "P"}
                      </span>
                    </div>

                    <div>
                      <h3 className={cn(
                        "font-bold transition-colors",
                        isActive 
                          ? "text-zinc-100 group-hover:text-blue-400" 
                          : "text-zinc-500"
                      )}>
                        {customer.name}
                      </h3>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {customer.phone || 'Sem telefone'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {customer.document || 'Sem CPF'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end text-xs text-zinc-600">
                      <span>Paciente desde</span>
                      <span>{customer.created_at ? new Date(customer.created_at).toLocaleDateString('pt-BR') : 'N/D'}</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-zinc-700 group-hover:text-zinc-400" : "text-zinc-800"
                    )} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {customers?.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl">
            <Users className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Nenhum paciente encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}