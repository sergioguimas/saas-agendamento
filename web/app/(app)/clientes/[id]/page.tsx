import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, FileText, User, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EditCustomerDialog } from "@/components/edit-customer-dialog"
import { MedicalRecordForm } from "@/components/medical-record-form"
import { Separator } from "@/components/ui/separator"

export default async function ClienteDetalhesPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const id = resolvedParams.id
  const supabase = await createClient()

  // 1. Busca dados do Cliente
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !customer) {
    notFound()
  }

  // 2. Busca Agendamentos
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services(title)')
    .eq('customer_id', id)
    .order('start_time', { ascending: false })

  // 3. Busca Histórico (CORRIGIDO: Usando Alias para evitar ambiguidade)
  const { data: records } = await supabase
    .from('medical_records')
    .select('*, professional:profiles!professional_id(full_name)')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  // Cast para any para facilitar o acesso à propriedade 'professional' no map abaixo
  const safeRecords = records as any[] || []

  const isActive = customer.active !== false // Default true se for null

  // Helper para iniciais
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/clientes">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-dashed">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{customer.name}</h1>
                <Badge variant={isActive ? "default" : "destructive"} className="rounded-full px-3">
                  {isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone || "Sem telefone"}
                </span>
                {customer.email && (
                   <span className="flex items-center gap-1.5 hidden sm:flex">
                    <Mail className="h-3.5 w-3.5" /> {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <EditCustomerDialog customer={customer} />
      </div>

      <Separator />

      {/* --- CONTEÚDO --- */}
      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-8">
          <TabsTrigger value="historico">Atendimentos</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="dados">Perfil</TabsTrigger>
        </TabsList>

        {/* ABA 1: HISTÓRICO */}
        <TabsContent value="historico" className="space-y-8">
            <div className="bg-muted/30 p-6 rounded-xl border border-dashed">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Novo Registro
              </h2>
              <MedicalRecordForm customer_id={id} />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground pl-1">
                Linha do Tempo
              </h2>
              
              {safeRecords.length > 0 ? (
                safeRecords.map((rec) => (
                  <MedicalRecordForm 
                    key={rec.id} 
                    customer_id={id} 
                    record={rec} 
                    // CORRIGIDO: Acessando via 'professional' definido no alias
                    professionalName={rec.professional?.full_name || ""}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/10">
                  <div className="bg-muted p-3 rounded-full mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    Use o formulário acima para criar a primeira anotação ou evolução deste cliente.
                  </p>
                </div>
              )}
            </div>
        </TabsContent>

        {/* ABA 2: AGENDAMENTOS */}
        <TabsContent value="agendamentos" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {appointments && appointments.length > 0 ? (
              appointments.map((app) => (
                <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4" style={{ borderLeftColor: getStatusColorHex(app.status) }}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted p-2.5 rounded-lg">
                        <Calendar className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{app.services?.title || 'Serviço Personalizado'}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(app.start_time).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(app.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`capitalize px-3 py-1 ${getStatusBadgeStyle(app.status)}`}>
                      {translateStatus(app.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/10 col-span-full">
                <div className="bg-muted p-3 rounded-full mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Sem agendamentos</h3>
                <p className="text-sm text-muted-foreground">Este cliente ainda não possui horários marcados.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ABA 3: PERFIL */}
        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> 
                Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 p-4 rounded-lg bg-muted/20 border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </p>
                  <p className="font-medium">{customer.email || "—"}</p>
                </div>
                
                <div className="space-y-2 p-4 rounded-lg bg-muted/20 border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> Telefone
                  </p>
                  <p className="font-medium">{customer.phone || "—"}</p>
                </div>

                <div className="space-y-2 p-4 rounded-lg bg-muted/20 border">
                   <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Documento (CPF/CNPJ)</p>
                   <p className="font-medium">{customer.document || "—"}</p>
                </div>

                 <div className="space-y-2 p-4 rounded-lg bg-muted/20 border">
                   <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data de Nascimento</p>
                   <p className="font-medium">
                    {customer.birth_date 
                      ? new Date(customer.birth_date).toLocaleDateString('pt-BR') 
                      : "—"}
                   </p>
                </div>
                
                <div className="space-y-2 md:col-span-2 p-4 rounded-lg bg-muted/20 border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Endereço Completo
                  </p>
                  <p className="font-medium">{customer.address || "Endereço não cadastrado"}</p>
                </div>

                <div className="space-y-2 md:col-span-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                   <p className="text-xs font-medium text-yellow-600 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5" /> Observações Internas
                   </p>
                   <p className="text-sm text-yellow-700 mt-1">
                      {customer.notes || "Nenhuma observação interna."}
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

// --- Helpers Visuais ---

function getStatusColorHex(status: string | null) {
  if (!status) return '#94a3b8' // Slate 400
  switch (status) {
    case 'confirmed': return '#22c55e' // Green 500
    case 'canceled': return '#ef4444' // Red 500
    case 'completed': return '#3b82f6' // Blue 500
    case 'arrived': return '#6366f1' // Indigo 500
    default: return '#eab308' // Yellow 500
  }
}

function getStatusBadgeStyle(status: string | null) {
  if (!status) return 'bg-slate-100 text-slate-700'
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'canceled': return 'bg-red-100 text-red-700 hover:bg-red-100'
    case 'completed': return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    case 'arrived': return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
    default: return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
  }
}

function translateStatus(status: string | null) {
  if (!status) return 'Pendente'
  const map: Record<string, string> = {
    'scheduled': 'Agendado',
    'confirmed': 'Confirmado',
    'canceled': 'Cancelado',
    'completed': 'Concluído',
    'arrived': 'Em Atendimento'
  }
  return map[status] || status
}