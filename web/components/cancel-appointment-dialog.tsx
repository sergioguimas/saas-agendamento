'use client'

import { useState } from "react"
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, XCircle, Loader2 } from "lucide-react"
import { cancelAppointment, deleteAppointment } from "@/app/actions/delete-appointment"
import { toast } from "sonner"

interface CancelAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
}

export function CancelAppointmentDialog({ 
  open, 
  onOpenChange, 
  appointmentId 
}: CancelAppointmentDialogProps) {
  const [loading, setLoading] = useState<'cancel' | 'delete' | null>(null)

  async function handleCancel() {
    setLoading('cancel')
    const result = await cancelAppointment(appointmentId)
    setLoading(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.info("Agendamento marcado como cancelado.")
      onOpenChange(false)
    }
  }

  async function handleDelete() {
    setLoading('delete')
    const result = await deleteAppointment(appointmentId)
    setLoading(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Agendamento excluído permanentemente.")
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            O que deseja fazer?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 space-y-3 pt-2">
            <p>
              Você está removendo um agendamento. Escolha a opção adequada:
            </p>
            
            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-sm">
              <strong className="text-zinc-200 block mb-1">Cancelar Atendimento:</strong>
              O paciente avisou que não vem. O registro é mantido no histórico como "Cancelado".
            </div>

            <div className="bg-red-950/20 p-3 rounded border border-red-900/30 text-sm">
              <strong className="text-red-400 block mb-1">Excluir Registro:</strong>
              Foi um erro de agendamento ou teste. O registro será apagado permanentemente do banco de dados.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-4 flex flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            Voltar
          </AlertDialogCancel>
          
          <Button 
            variant="secondary"
            onClick={handleCancel}
            disabled={!!loading}
            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
          >
            {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
            Cancelar (Manter)
          </Button>

          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={!!loading}
            className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-800"
          >
            {loading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trash2 className="h-4 w-4 mr-2"/>}
            Excluir (Apagar)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}