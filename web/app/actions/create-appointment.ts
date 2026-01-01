'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const start_time = formData.get('start_time') as string // ISO string
  const organizations_id = formData.get('organizations_id') as string

  const { error } = await supabase
    .from('appointments')
    .insert({
      customer_id,
      service_id,
      start_time,
      organizations_id,
      status: 'scheduled'
    } as any)

  if (error) return { error: error.message }

  revalidatePath('/agendamentos')
  return { success: true }
}