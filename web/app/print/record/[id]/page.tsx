import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PrintButton } from "@/components/print-button"

export default async function PrintRecordPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Buscar o Prontuário e os dados do Paciente
  const { data: record } = await supabase
    .from('medical_records')
    .select(`
      *,
      customers (name, birth_date, gender)
    `)
    .eq('id', id)
    .single()

  if (!record) return notFound()

  // 2. Buscar dados do Médico e da Clínica (Quem está imprimindo)
  // Como o prontuário tem o doctor_id, buscamos o perfil dele
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select(`
      full_name, 
      crm, 
      specialty,
      tenants (name, document, phone, email, address)
    `)
    .eq('id', record.doctor_id)
    .single()
    
  // @ts-ignore
  const clinic = doctorProfile?.tenants
  const doctor = doctorProfile

  if (!clinic || !doctor) return <div>Erro: Dados da clínica incompletos.</div>

  return (
    <div className="min-h-screen bg-white text-black p-0 md:p-8 flex justify-center">
      {/* Botão Flutuante de Imprimir (Só aparece na tela, some no papel) */}
      <div className="fixed top-4 right-4 print:hidden z-50">
        <PrintButton />
      </div>

      {/* A Folha A4 */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white md:shadow-xl p-[20mm] relative flex flex-col justify-between print:shadow-none print:p-0">
        
        {/* --- CABEÇALHO --- */}
        <header className="border-b-2 border-gray-800 pb-6 mb-8 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
            {clinic.name}
          </h1>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            {clinic.document && <p>CNPJ/CPF: {clinic.document}</p>}
            {clinic.address && <p>{clinic.address}</p>}
            <p>
              {clinic.phone && <span>Tel: {clinic.phone}</span>}
              {clinic.phone && clinic.email && <span> • </span>}
              {clinic.email && <span>{clinic.email}</span>}
            </p>
          </div>
        </header>

        {/* --- DADOS DO PACIENTE --- */}
        <section className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200 print:border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-bold text-gray-700">Paciente:</span>
              <span className="block text-lg">{record.customers.name}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-700">Data do Atendimento:</span>
              <span className="block text-lg">
                {format(new Date(record.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </section>

        {/* --- CONTEÚDO DO PRONTUÁRIO --- */}
        <main className="flex-1">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b border-gray-200">
            Descrição do Atendimento
          </h2>
          
          {/* Renderiza o texto respeitando as quebras de linha */}
          <div className="text-gray-900 leading-relaxed whitespace-pre-wrap text-justify font-serif text-lg">
            {record.content}
          </div>
        </main>

        {/* --- RODAPÉ / ASSINATURA --- */}
        <footer className="mt-16 pt-8 text-center break-inside-avoid">
          <div className="inline-block px-12 border-t border-gray-800 pt-2">
            <p className="font-bold text-gray-900 text-lg">
              {doctor.full_name || "Dr. Médico Responsável"}
            </p>
            <p className="text-gray-600">
              {doctor.specialty && <span>{doctor.specialty} • </span>}
              CRM: {doctor.crm || "00000"}
            </p>
          </div>
          
          <div className="mt-8 text-[10px] text-gray-400">
            Documento gerado eletronicamente pelo sistema MedAgenda em {format(new Date(), "dd/MM/yyyy HH:mm")}
          </div>
        </footer>

      </div>
      
      {/* Script global para ajustar estilos de impressão */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 20mm !important; } /* Margem física do papel */
        }
      `}</style>
    </div>
  )
}