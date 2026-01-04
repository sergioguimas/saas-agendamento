import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ArrowLeft, Phone, User, Printer, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { EditCustomerDialog } from "@/components/edit-customer-dialog"
import { MedicalRecordForm } from "@/components/medical-record-form"
import { toggleCustomerStatus } from "@/app/actions/toggle-customer-status"
import { MedicalRecordList } from "@/components/medical-record-list"

export default async function PacienteDetalhesPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = await createClient();

  // 1. Busca dados do Cliente
  // Removemos o 'as any' para confiar na tipagem gerada
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !customer) {
    console.error("Erro ao buscar cliente:", error);
    notFound();
  }

  const isActive = (customer as any).active !== false; // Cast seguro para active se não existir na type definition ainda

  // 2. Busca Prontuários (service_notes)
  const { data: notes } = await supabase
    .from('service_notes')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  // 3. Busca Histórico de Agendamentos
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services(title)')
    .eq('customer_id', id)
    .order('start_time', { ascending: false });

  return (
    <div className="p-8 bg-black min-h-screen text-foreground">
      {/* Cabeçalho de Ações */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="bg-background border border-border">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> CPF: {customer.document || 'N/D'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {customer.phone}
              </span>
              {/* Exibe Gênero apenas se existir */}
              {customer.gender && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {customer.gender}
                </span>
              )}
              {!isActive && (
                <span className="ml-3 px-2 py-0.5 text-xs font-medium bg-zinc-800 text-amber-500 border border-amber-500/20 rounded-full">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-background border-border"><Printer className="mr-2 h-4 w-4" /> Histórico</Button>
          
          {/* Passamos o customer. Se der erro de tipo aqui, é porque o componente EditCustomerDialog precisa ser atualizado também */}
          <EditCustomerDialog customer={customer as any} />
          
          <form action={async () => {
            'use server'
            await toggleCustomerStatus(customer.id, isActive)
          }}>
            <Button 
              variant="outline" 
              className={isActive 
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
              }
            >
              {isActive ? "Desativar" : "Reativar"}
            </Button>
          </form>
        </div>
      </div>

      {/* Abas de Navegação */}
      <Tabs defaultValue="prontuario" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-background border border-border h-12">
          <TabsTrigger value="dados" className="data-[state=active]:bg-zinc-800">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="prontuario" className="data-[state=active]:bg-zinc-800">Notas de Serviço</TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-zinc-800">Histórico</TabsTrigger>
        </TabsList>

        {/* Aba: Dados Cadastrais */}
        <TabsContent value="dados" className="space-y-4 outline-none">
          <Card className="bg-background/40 border-border">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-semibold">Nome Completo</p>
                <p className="text-foreground">{customer.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-semibold">WhatsApp / Telefone</p>
                <p className="text-foreground">{customer.phone || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-semibold">Email</p>
                <p className="text-foreground">{customer.email || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-semibold">Documento</p>
                <p className="text-foreground">{customer.document || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-semibold">Gênero</p>
                <p className="text-foreground">{customer.gender || '-'}</p>
              </div>
               <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-semibold">Observações</p>
                <p className="text-foreground">{customer.notes || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Prontuário (Service Notes) */}
        <TabsContent value="prontuario" className="space-y-6 outline-none">
          <Card className="bg-background/40 border-border">
            <CardContent className="p-6">
              <MedicalRecordForm customerId={id} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Histórico de Notas</h3>
            <MedicalRecordList records={notes || []} customerId={id} />
          </div>
        </TabsContent>

        {/* Aba: Histórico de Agendamentos */}
        <TabsContent value="historico" className="outline-none">
          <div className="grid gap-4">
            {appointments && appointments.length > 0 ? (
              appointments.map((app: any) => (
                <Card key={app.id} className="bg-background/40 border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                      <div>
                        <p className="font-bold text-foreground">{app.services?.title || 'Serviço'}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(app.start_time).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 capitalize">
                      {app.status}
                    </span>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-xl text-zinc-600">
                Nenhum agendamento encontrado.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}