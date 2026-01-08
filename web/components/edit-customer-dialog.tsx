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
import { Switch } from "@/components/ui/switch"
import { Pencil, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { updateCustomer } from "@/app/actions/update-customer"
import { toast } from "sonner"

export function EditCustomerDialog({ customer }: { customer: any }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Controle local do switch para feedback visual imediato
  const [isActive, setIsActive] = useState(customer.active !== false)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCustomer(formData)
      if (result.success) {
        toast.success("Dados atualizados!")
        setOpen(false)
      } else {
        toast.error("Erro ao atualizar.")
      }
    })
  }

  // Formata a data para o input date (YYYY-MM-DD)
  const birthDateValue = customer.birth_date ? new Date(customer.birth_date).toISOString().split('T')[0] : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Editar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
          <DialogDescription>
            Atualize as informações cadastrais.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 py-4">
          <input type="hidden" name="id" value={customer.id} />
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
                <Label className="text-base">Cadastro Ativo</Label>
                <p className="text-xs text-muted-foreground">Desative para ocultar de novos agendamentos.</p>
            </div>
            <Switch 
                name="active" 
                checked={isActive} 
                onCheckedChange={setIsActive} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" name="name" defaultValue={customer.name} required />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input id="phone" name="phone" defaultValue={customer.phone} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" name="birth_date" type="date" defaultValue={birthDateValue} />
            </div>

            <div className="space-y-2 col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={customer.email} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="document">CPF</Label>
                <Input id="document" name="document" defaultValue={customer.document} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea id="address" name="address" defaultValue={customer.address} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações Internas</Label>
            <Textarea id="notes" name="notes" defaultValue={customer.notes} rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}