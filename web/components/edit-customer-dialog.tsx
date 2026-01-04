'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Loader2 } from "lucide-react"
import { upsertCustomer } from "@/app/actions/create-customer"
import { toast } from "sonner"

export function EditCustomerDialog({ customer }: { customer: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    formData.append('id', customer.id)
    formData.append('organization_id', customer.organization_id)

    const result = await upsertCustomer(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Dados atualizados!")
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background border-border">
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-border text-white">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Nome Completo</Label>
            <Input name="name" defaultValue={customer.name} required className="bg-zinc-950 border-border" />
          </div>
          <div className="grid gap-2">
            <Label>Telefone</Label>
            <Input name="phone" defaultValue={customer.phone} className="bg-zinc-950 border-border" />
          </div>
          <div className="grid gap-2">
            <Label>Documento (CPF)</Label>
            <Input name="document" defaultValue={customer.document} className="bg-zinc-950 border-border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}