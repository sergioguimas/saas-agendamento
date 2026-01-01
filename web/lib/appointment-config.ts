import { 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  XCircle, 
  PlayCircle 
} from "lucide-react"

export const STATUS_CONFIG: Record<string, { 
  label: string, 
  color: string, 
  icon: any 
}> = {
  scheduled: {
    label: "Agendado",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    icon: Clock
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: UserCheck
  },
  arrived: {
    label: "Chegou",
    color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    icon: PlayCircle
  },
  completed: {
    label: "Finalizado",
    color: "bg-zinc-800 border-zinc-700 text-zinc-400",
    icon: CheckCircle2
  },
  canceled: {
    label: "Cancelado",
    color: "bg-red-500/10 border-red-500/20 text-red-400",
    icon: XCircle
  }
}