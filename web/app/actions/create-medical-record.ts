'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMedicalRecord(formData: FormData) {
  const supabase = await createClient()

  const customerId = formData.get('customerId') as string
  const content = formData.get('content') as string

  if (!content || !customerId) return { error: 'Dados inválidos' }

  // 1. Validar usuário
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  // 2. Pegar Tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Perfil inválido' }

  // 3. Salvar
  const { error } = await supabase.from('medical_records').insert({
    content,
    customer_id: customerId,
    tenant_id: profile.tenant_id,
    doctor_id: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${customerId}`)
  return { success: true }
}