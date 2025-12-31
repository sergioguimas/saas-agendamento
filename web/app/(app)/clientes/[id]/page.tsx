import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Phone, User, Calendar, FileText, Printer, Pencil, Trash2, Send } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { EditCustomerDialog } from "@/components/edit-customer-dialog"

export default async function PacienteDetalhesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // 1. Busca os dados do paciente
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single() as any

  if (!customer) notFound()

  // 2. Busca o histórico de agendamentos deste paciente
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services(name, color)')
    .eq('customer_id', params.id)
    .order('start_time', { ascending: false }) as any

  return (
    <div className="p-8 bg-black min-h-screen text-zinc-100">
      {/* Cabeçalho de Ações */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="bg-zinc-900 border border-zinc-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{customer.full_name}</h1>
            <div className="flex gap-4 mt-1 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> Gênero: {customer.gender || 'N/D'}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-zinc-900 border-zinc-800"><Printer className="mr-2 h-4 w-4" /> Histórico</Button>
          <EditCustomerDialog customer={customer} />
          <Button variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      {/* Abas de Navegação */}
      <Tabs defaultValue="prontuario" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="dados" className="flex-1 md:flex-none">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="prontuario" className="flex-1 md:flex-none">Prontuário</TabsTrigger>
          <TabsTrigger value="historico" className="flex-1 md:flex-none">Histórico de Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="prontuario" className="space-y-4">
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <Textarea 
                placeholder="Descreva a evolução clínica do paciente..." 
                className="min-h-[200px] bg-zinc-950 border-zinc-800 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Send className="mr-2 h-4 w-4" /> Salvar Evolução
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600">
             Nenhuma anotação registrada anteriormente.
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <div className="grid gap-4">
            {appointments?.map((app: any) => (
              <Card key={app.id} className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: app.services?.color }} />
                    <div>
                      <p className="font-bold">{app.services?.name}</p>
                      <p className="text-xs text-zinc-500">{new Date(app.start_time).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 capitalize">{app.status}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}