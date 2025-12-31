'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2, Clock, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { createService } from "@/app/actions/create-service"

type Props = {
  organizations_id: string
}

export function CreateServiceDialog({ organizations_id }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    formData.append('organizations_id', organizations_id)

    const result = await createService(formData)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success("Procedimento cadastrado!")
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Novo Procedimento
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Procedimento</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Adicione um novo serviço ao seu catálogo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Serviço</Label>
            <Input id="name" name="name" placeholder="Ex: Consulta Pediátrica" required className="bg-zinc-950 border-zinc-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input id="duration" name="duration" type="number" placeholder="30" required className="bg-zinc-950 border-zinc-800 pl-9" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input id="price" name="price" type="number" step="0.01" placeholder="150,00" required className="bg-zinc-950 border-zinc-800 pl-9" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full mt-2">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Procedimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}