'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { createCustomer } from "@/app/actions/create-customer"
import { toast } from "sonner"

export function CreateCustomerDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCustomer(formData)
      if (result.success) {
        toast.success("Cliente cadastrado com sucesso!")
        setOpen(false)
      } else {
        toast.error("Erro ao cadastrar cliente.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados completos para o prontuário.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" name="name" required placeholder="Ex: Maria Silva" />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input id="phone" name="phone" required placeholder="Ex: 11999999999" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" name="birth_date" type="date" />
            </div>

            <div className="space-y-2 col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="cliente@email.com" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="document">CPF</Label>
                <Input id="document" name="document" placeholder="000.000.000-00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea id="address" name="address" placeholder="Rua, Número, Bairro, Cidade..." rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações Internas</Label>
            <Textarea id="notes" name="notes" placeholder="Alergias, preferências, histórico..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}