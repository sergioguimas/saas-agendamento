import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PrintButton } from "@/components/print-button"
import { PrintStyles } from "@/components/print-styles"

export default async function PrintHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Buscar Dados do Paciente e da Clínica
  const { data: customer } = await supabase
    .from('customers')
    .select(`
      *,
      tenants (name, document, phone, email, address)
    `)
    .eq('id', id)
    .single()

  if (!customer) return notFound()

  // @ts-ignore
  const clinic = customer.tenants

  // 2. Buscar TODOS os prontuários (Histórico)
  const { data: records } = await supabase
    .from('medical_records')
    .select(`
      *,
      profiles (full_name, crm, specialty)
    `)
    .eq('customer_id', id)
    .order('created_at', { ascending: false }) // Mais recente primeiro

  return (
    <div className="min-h-screen bg-gray-700 text-black p-0 md:p-8 flex justify-center">
      <PrintStyles />

      <div className="fixed top-4 right-4 print:hidden z-50">
        <PrintButton />
      </div>

      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white md:shadow-xl p-[20mm] relative flex flex-col print:shadow-none print:p-0">
        
        {/* CABEÇALHO */}
        <header className="border-b-2 border-gray-800 pb-6 mb-8 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
            {clinic?.name || "Clínica Médica"}
          </h1>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            {clinic?.document && <p>CNPJ/CPF: {clinic.document}</p>}
            {clinic?.address && <p>{clinic.address}</p>}
            <p>
              {clinic?.phone && <span>Tel: {clinic.phone}</span>}
              {clinic?.email && <span> • {clinic.email}</span>}
            </p>
          </div>
        </header>

        {/* DADOS DO PACIENTE */}
        <section className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200 print:border-gray-300">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-2">Histórico Completo</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-bold text-gray-700 block">Nome:</span>
              <span className="text-lg">{customer.name}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700 block">Data de Emissão:</span>
              <span>{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>
        </section>

        {/* LISTA DE EVOLUÇÕES */}
        <main className="flex-1 space-y-8">
          {!records?.length ? (
            <p className="text-center text-gray-500 italic py-12">Nenhum registro clínico encontrado.</p>
          ) : (
            records.map((record) => (
              <div key={record.id} className="break-inside-avoid border-l-4 border-gray-200 pl-4 py-1">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-bold text-gray-900">
                    {format(new Date(record.created_at!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                  <span className="text-xs text-gray-500">
                    às {format(new Date(record.created_at!), "HH:mm")}
                  </span>
                </div>

                <div className="text-gray-800 whitespace-pre-wrap text-justify leading-relaxed text-sm mb-3">
                  {record.content}
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1">
                   Assinado por: 
                   <span className="font-medium text-gray-700">
                     {/* @ts-ignore */}
                     {record.profiles?.full_name || "Médico Responsável"}
                   </span>
                </div>
              </div>
            ))
          )}
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
            Fim do Relatório • Página 1 de 1
        </footer>
      </div>
    </div>
  )
}