'use client'

import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger, 
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from "@/components/ui/context-menu"
import { toggleAppointmentStatus } from "@/app/actions/toggle-appointment-status"
import { STATUS_CONFIG } from "@/lib/appointment-config"
import { toast } from "sonner"

export function AppointmentContextMenu({ children, appointment, className }: any) {
  
  async function handleStatusChange(newStatus: string) {
    const result = await toggleAppointmentStatus(appointment.id, newStatus)
    if (result.success) {
      toast.success(`Status atualizado para: ${STATUS_CONFIG[newStatus].label}`)
    } else {
      toast.error("Erro ao atualizar status")
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200">
        <ContextMenuSub>
          <ContextMenuSubTrigger>Alterar Status</ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
            {Object.entries(STATUS_CONFIG).map(([key, value]) => (
              <ContextMenuItem 
                key={key} 
                onClick={() => handleStatusChange(key)}
                className="gap-2"
              >
                <value.icon className="h-4 w-4" />
                {value.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator className="bg-zinc-800" />
        <ContextMenuItem className="text-red-400 focus:text-red-400">
          Cancelar Agendamento
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}