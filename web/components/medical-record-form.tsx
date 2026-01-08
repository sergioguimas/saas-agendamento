'use client'

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveDraft, signRecord, deleteRecord } from "@/app/actions/medical-records"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, Save, CheckCircle, Printer, Trash2, Lock, FileText, CalendarClock } from "lucide-react"

interface MedicalRecordFormProps {
  customer_id: string
  record?: any
  professionalName?: string
}

export function MedicalRecordForm({ customer_id, record, professionalName }: MedicalRecordFormProps) {
  const [content, setContent] = useState(record?.content || "")
  const [isPending, startTransition] = useTransition()
  
  const isNew = !record?.id
  const isSigned = record?.status === 'signed'

  const handleSaveDraft = () => {
    if (!content.trim()) return toast.error("O campo está vazio.")

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('customer_id', customer_id)
        formData.append('content', content)
        if (record?.id) formData.append('id', record.id)

        await saveDraft(formData)
        toast.success("Rascunho salvo com sucesso!")
        if(isNew) setContent("") 
      } catch (error) {
        toast.error("Erro ao salvar.")
      }
    })
  }

  const handleSign = () => {
    if (!record?.id) return toast.error("Salve o rascunho antes de finalizar.")
    if(!confirm("Ao finalizar, este registro não poderá mais ser editado. Confirmar?")) return

    startTransition(async () => {
      try {
        await signRecord(record.id, customer_id)
        toast.success("Registro finalizado!")
      } catch (error) {
        toast.error("Erro ao finalizar.")
      }
    })
  }

  const handleDelete = () => {
    if(!confirm("Tem certeza que deseja excluir este item?")) return
    startTransition(async () => {
      await deleteRecord(record.id, customer_id)
      toast.success("Item excluído.")
    })
  }

  const handlePrint = () => {
    window.open(`/print/record/${record.id}`, '_blank')
  }

  // Define a cor da borda lateral: Verde se assinado, Laranja se Rascunho, Azul se Novo
  const borderClass = isNew ? 'border-l-blue-500' : (isSigned ? 'border-l-green-500' : 'border-l-orange-400')

  return (
    <Card className={`mb-3 border-l-4 shadow-sm ${borderClass}`}>
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
            {isSigned ? (
                <Lock className="h-3.5 w-3.5 text-green-600" />
            ) : (
                isNew ? <FileText className="h-3.5 w-3.5 text-blue-500"/> : <FileText className="h-3.5 w-3.5 text-orange-400"/>
            )}
            
            <CardTitle className="text-sm font-semibold text-foreground">
                {isNew ? "Novo Registro / Anotação" : 
                `Registro de ${format(new Date(record.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}`
                }
            </CardTitle>
        </div>

        {isSigned && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handlePrint}>
              <Printer className="h-3 w-3 mr-1.5" />
              Imprimir
            </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {isSigned ? (
          <div className="prose prose-sm max-w-none text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap text-foreground leading-relaxed">
            {record.content}
          </div>
        ) : (
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreva os detalhes do atendimento, serviços realizados ou observações..."
            className="min-h-[80px] text-sm bg-background resize-y" // Altura reduzida para 80px
          />
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        {isSigned ? (
          <div className="text-[10px] text-muted-foreground w-full text-right flex items-center justify-end gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Finalizado por <strong>{professionalName || "Profissional"}</strong> em {format(new Date(record.signed_at), "dd/MM/yy HH:mm")}
          </div>
        ) : (
          <>
             {/* Botão de Excluir */}
             {!isNew ? (
                <Button variant="ghost" size="sm" onClick={handleDelete} className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3 w-3 mr-1" /> Excluir
                </Button>
             ) : <div />}

             <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isPending} className="h-7 px-3 text-xs">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                  Salvar Rascunho
                </Button>
                
                {!isNew && (
                  <Button size="sm" onClick={handleSign} disabled={isPending} className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Finalizar
                  </Button>
                )}
             </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}