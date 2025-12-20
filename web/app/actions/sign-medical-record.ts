'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signMedicalRecord(recordId: string, customerId: string) {
  const supabase = await createClient()

  // Atualiza para assinado e grava a data/hora atual
  const { error } = await supabase
    .from('medical_records')
    .update({ 
      status: 'signed',
      signed_at: new Date().toISOString()
    })
    .eq('id', recordId)
    .eq('status', 'draft') // Segurança extra: só assina se for rascunho

  if (error) {
    return { error: 'Erro ao assinar: O prontuário já foi finalizado ou você não tem permissão.' }
  }

  revalidatePath(`/clientes/${customerId}`)
  return { success: true }
}