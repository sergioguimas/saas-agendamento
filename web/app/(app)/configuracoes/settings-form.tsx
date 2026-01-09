'use client'

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateSettings } from "@/app/actions/update-settings"
// Mantemos apenas o WhatsappSettings se ele ainda existir, senão remova também
import { WhatsappSettings } from "./whatsapp-settings" 
import { toast } from "sonner"
import { Loader2, Save, Building2, User, Share2 } from "lucide-react"

export function SettingsForm({ profile, organization, templates }: any) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      // Adiciona o ID da organização manualmente se não vier do form
      if (organization?.id) {
        formData.append('org_id', organization.id)
      }
      
      const result = await updateSettings(formData)
      
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Configurações salvas com sucesso!")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clinic"><Building2 className="mr-2 h-4 w-4"/> Clínica</TabsTrigger>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/> Seu Perfil</TabsTrigger>
          <TabsTrigger value="whatsapp"><Share2 className="mr-2 h-4 w-4"/> Conexão</TabsTrigger>
        </TabsList>

        {/* ABA CLÍNICA */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Clínica</CardTitle>
              <CardDescription>Informações que aparecerão nos agendamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Clínica</Label>
                  <Input name="name" defaultValue={organization?.name || ''} placeholder="Ex: Clínica Saúde" required />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ / CPF</Label>
                  <Input name="document" defaultValue={organization?.document || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input name="phone" defaultValue={organization?.phone || ''} placeholder="Ex: 11999999999" />
                </div>
                <div className="space-y-2">
                  <Label>Email Profissional</Label>
                  <Input name="email" defaultValue={organization?.email || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Textarea name="address" defaultValue={organization?.address || ''} rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PERFIL */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Seu Perfil</CardTitle>
              <CardDescription>Dados do profissional responsável.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input name="full_name" defaultValue={profile?.full_name || ''} />
              </div>
              <div className="space-y-2">
                <Label>Registro Profissional (CRM/CRP/etc)</Label>
                <Input name="crm" defaultValue={profile?.crm || ''} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA WHATSAPP (EVOLUTION) */}
        <TabsContent value="whatsapp">
           <WhatsappSettings organization={organization || ''} />
        </TabsContent>


      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Tudo
        </Button>
      </div>
    </form>
  )
}