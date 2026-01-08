'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()

  // 1. Busca o usuário e garante que ele existe
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return { error: "Usuário não autenticado" }
  }
  
  // 2. Busca o perfil para obter a organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id) 
    .single()

  if (!profile?.organization_id) {
    return { error: "Perfil sem organização vinculada" }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const document = formData.get('document') as string
  
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const notes = formData.get('notes') as string
  const birth_date = formData.get('birth_date') as string 

  const formattedBirthDate = birth_date ? new Date(birth_date).toISOString() : null

  const { error } = await supabase.from('customers').insert({
    organization_id: profile.organization_id,
    name,
    phone,
    document,
    email: email || null,
    address: address || null,
    notes: notes || null,
    birth_date: formattedBirthDate,
    active: true
  })

  if (error) {
    console.error("Erro ao criar cliente:", error)
    return { error: "Erro ao criar cliente" }
  }

  revalidatePath('/clientes')
  return { success: true }
}