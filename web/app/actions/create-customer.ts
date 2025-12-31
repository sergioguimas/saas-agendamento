'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertCustomer(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string // Se tiver ID, é edição
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const document = formData.get('document') as string
  const organizations_id = formData.get('organizations_id') as string

  const customerData = {
    full_name,
    phone,
    document,
    organizations_id
  }

  try {
    const { error } = id 
      ? await supabase.from('customers').update(customerData as any).eq('id', id)
      : await supabase.from('customers').insert(customerData as any)

    if (error) throw error

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}