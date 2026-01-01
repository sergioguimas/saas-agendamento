'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleCustomerStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({ active: !currentStatus } as any)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}