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

  try {
    // === CENÁRIO 1: CRIAR NOVA CLÍNICA (Primeiro Acesso) ===
    const orgName = formData.get('name') as string
    
    if (!orgId && orgName) {
      const { data: newId, error: rpcError } = await supabase.rpc('create_new_organization' as any, {
        org_name: orgName,
        org_document: formData.get('document') as string,
        org_phone: formData.get('phone') as string,
        org_email: formData.get('email') as string,
        org_address: formData.get('address') as string,
        org_evolution_url: formData.get('evolution_url') as string,
        org_evolution_key: formData.get('evolution_apikey') as string
      })

      if (rpcError) {
        console.error('Erro RPC Create:', rpcError)
        return { error: 'Erro ao criar organização: ' + rpcError.message }
      }
      orgId = newId
    } 
    
    // === CENÁRIO 2: ATUALIZAR CLÍNICA EXISTENTE (Proteção contra Abas Ocultas) ===
    else if (orgId) {
      // Criamos um objeto dinâmico apenas com os campos que NÃO são nulos
      const orgUpdates: any = {onboarding_completed: true}
      
      const addIfPresent = (key: string, formKey: string) => {
        const value = formData.get(formKey)
        // Se value for null, o input não estava na tela. Se for string vazia '', o usuário limpou.
        if (value !== null) orgUpdates[key] = value
      }

      addIfPresent('name', 'name')
      addIfPresent('document', 'document')
      addIfPresent('phone', 'phone')
      addIfPresent('email', 'email')
      addIfPresent('address', 'address')
      addIfPresent('evolution_api_url', 'evolution_url')
      addIfPresent('evolution_api_key', 'evolution_apikey')

      // Só roda o update se tivermos algum campo para atualizar
      if (Object.keys(orgUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update(orgUpdates)
          .eq('id', orgId)

        if (updateError) {
          console.error('Erro Update Org:', updateError)
          return { error: 'Erro ao atualizar dados da clínica: ' + updateError.message }
        }
      }
    }

    // === ATUALIZAR DADOS PESSOAIS (MÉDICO) ===
    const profileUpdates: any = {}
    
    const addProfileField = (key: string) => {
        const val = formData.get(key)
        if (val !== null) profileUpdates[key] = val
    }

    addProfileField('full_name')
    addProfileField('crm')

    if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)

        if (profileError) {
        console.error('Erro Update Profile:', profileError)
        return { error: 'Erro ao atualizar seu perfil.' }
        }
    }

    revalidatePath('/configuracoes')
    revalidatePath('/setup')
    return { success: true }

  } catch (error: any) {
    console.error('Erro Geral:', error)
    return { error: error.message }
  }
}