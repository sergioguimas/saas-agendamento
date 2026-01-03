'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  // Sanitização do ID da Org
  let orgId = formData.get('org_id') as string
  if (orgId === 'undefined' || orgId === 'null') orgId = ''

  // Dados capturados
  const orgData = {
    name: formData.get('name') as string,
    document: formData.get('document') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    address: formData.get('address') as string,
    evolution_api_url: formData.get('evolution_url') as string,
    evolution_api_key: formData.get('evolution_apikey') as string,
  }

  const profileData = {
    full_name: formData.get('full_name') as string,
    crm: formData.get('crm') as string,
  }

  try {
    // === CENÁRIO 1: CRIAR NOVA CLÍNICA (Primeiro Acesso) ===
    if (!orgId && orgData.name) {
      // Chamamos a função SQL "Super Poderosa" que criamos
      const { data: newId, error: rpcError } = await supabase.rpc('create_new_organization' as any, {
        org_name: orgData.name,
        org_document: orgData.document,
        org_phone: orgData.phone,
        org_email: orgData.email,
        org_address: orgData.address,
        org_evolution_url: orgData.evolution_api_url,
        org_evolution_key: orgData.evolution_api_key
      })

      if (rpcError) {
        console.error('Erro RPC Create:', rpcError)
        return { error: 'Erro ao criar organização: ' + rpcError.message }
      }
      
      // O ID já vem vinculado do banco
      orgId = newId
    } 
    // === CENÁRIO 2: ATUALIZAR CLÍNICA EXISTENTE ===
    else if (orgId) {
      const { error: updateError } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', orgId)

      if (updateError) {
        console.error('Erro Update Org:', updateError)
        return { error: 'Erro ao atualizar dados da clínica.' }
      }
    }

    // === ATUALIZAR DADOS PESSOAIS (MÉDICO) ===
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)

    if (profileError) {
      console.error('Erro Update Profile:', profileError)
      return { error: 'Erro ao atualizar seu perfil.' }
    }

    revalidatePath('/configuracoes')
    revalidatePath('/setup')
    return { success: true }

  } catch (error: any) {
    console.error('Erro Geral:', error)
    return { error: error.message }
  }
}