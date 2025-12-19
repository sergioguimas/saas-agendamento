'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createMedicalRecord } from "@/app/actions/create-medical-record"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

export function MedicalRecordForm({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const form = event.currentTarget
    const formData = new FormData(form)
    
    // Adiciona o ID do cliente escondido no envio
    formData.append('customerId', customerId)

    const result = await createMedicalRecord(formData)

    setLoading(false)

    if (result?.error) {
      toast.error("Erro ao salvar anotação.")
    } else {
      toast.success("Evolução registrada!")
      form.reset() // Limpa o campo de texto
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
      <Textarea 
        name="content" 
        placeholder="Descreva a evolução clínica do paciente..." 
        className="bg-zinc-950 border-zinc-800 focus:ring-blue-600 min-h-[120px] resize-none"
        required
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Salvar Evolução
        </Button>
      </div>
    </form>
  )
}