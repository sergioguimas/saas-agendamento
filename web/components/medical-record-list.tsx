'use client'

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, PenSquare, FileSignature, ShieldCheck } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { signMedicalRecord } from "@/app/actions/sign-medical-record"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Definindo o tipo manualmente para facilitar
type MedicalRecord = {
  id: string
  content: string
  created_at: string | null
  status: 'draft' | 'signed' | string | null
  signed_at: string | null
}

export function MedicalRecordList({ records, customerId }: { records: any[], customerId: string }) {
  
  async function handleSign(recordId: string) {
    const confirm = window.confirm("Atenção: Ao finalizar, este documento será travado permanentemente. Deseja continuar?")
    if (!confirm) return

    const result = await signMedicalRecord(recordId, customerId)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Prontuário assinado e travado com sucesso!")
    }
  }

  if (!records?.length) {
    return (
      <div className="text-center py-8 border border-zinc-800 border-dashed rounded-lg">
        <p className="text-zinc-500 text-sm">Nenhuma anotação registrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record: MedicalRecord) => (
        <Card key={record.id} className={`bg-zinc-900 border-zinc-800 ${record.status === 'signed' ? 'border-l-emerald-500 border-l-4' : 'border-l-yellow-500 border-l-4'}`}>
          <CardHeader className="py-3 px-4 border-b border-zinc-800/50 bg-zinc-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-blue-900 text-blue-200">DR</AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-zinc-300">Dr. Padrão</span>
                
                {/* Badge de Status */}
                {record.status === 'signed' ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] h-5 gap-1">
                    <Lock className="w-3 h-3" /> Assinado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-[10px] h-5 gap-1">
                    <PenSquare className="w-3 h-3" /> Rascunho
                  </Badge>
                )}
              </div>
              
              <span className="text-xs text-zinc-500">
                {record.created_at && format(parseISO(record.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {record.content}
          </CardContent>

          {/* Rodapé com Botões */}
          <CardFooter className="py-2 px-4 bg-zinc-950/50 flex justify-end gap-2">
            
            {record.status !== 'signed' ? (
              <>
                {/* Botão Fake da ICP-Brasil (Marketing) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-500 hover:text-zinc-300 gap-1 opacity-50 cursor-not-allowed">
                        <ShieldCheck className="w-3 h-3" /> Assinar ICP-Brasil
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
                      <p>Integração com Certificado A1/A3 (Em breve no plano Enterprise)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Botão Real de Finalizar */}
                <Button onClick={() => handleSign(record.id)} size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  <FileSignature className="w-3 h-3" /> Finalizar
                </Button>
              </>
            ) : (
              <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                Assinado eletronicamente em {record.signed_at && format(parseISO(record.signed_at), "dd/MM/yyyy HH:mm")}
              </span>
            )}

          </CardFooter>
        </Card>
      ))}
    </div>
  )
}