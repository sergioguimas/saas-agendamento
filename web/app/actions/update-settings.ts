'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '')       // Remove caracteres especiais
    .replace(/\s+/g, '-')           // Substitui espaços por hífen
    .trim();
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Usuário não autenticado." }
  }

  // 2. Coletar dados do formulário
  const name = formData.get("name") as string
  const full_name = formData.get("full_name") as string // Nome do médico

  if (!name) return { error: "O nome da clínica é obrigatório." }

  const orgData = {
    name: name,
    slug: generateSlug(name), // Gera slug automaticamente se estiver vazio
    crm: formData.get("crm") as string,
    document: formData.get("document") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    address: formData.get("address") as string,
    evolution_url: formData.get("evolution_url") as string,
    evolution_apikey: formData.get("evolution_apikey") as string,
  }

  // 3. Verificar vínculo atual do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizations_id')
    .eq('id', user.id)
    .single() as any

  try {
    let currentOrgId = profile?.organizations_id

    if (!currentOrgId) {
      // --- FLUXO DE CRIAÇÃO (Setup Inicial) ---
      
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert([{ ...orgData, owner_id: user.id }])
        .select()
        .single()

      if (orgError) throw orgError
      currentOrgId = newOrg.id

      // Vincula a organização ao perfil e atualiza o nome do médico
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          organizations_id: currentOrgId,
          full_name: full_name 
        } as any)
        .eq('id', user.id)

      if (profileUpdateError) throw profileUpdateError

    } else {
      // --- FLUXO DE ATUALIZAÇÃO (Página de Configurações) ---
      
      // Atualiza a Organização
      const { error: updateError } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', currentOrgId)

      if (updateError) throw updateError

      // Atualiza o Perfil do Médico
      const { error: profError } = await supabase
        .from('profiles')
        .update({ full_name: full_name } as any)
        .eq('id', user.id)

      if (profError) throw profError
    }

    // 4. Limpar caches para refletir as mudanças
    revalidatePath('/', 'layout')
    revalidatePath('/dashboard')
    revalidatePath('/configuracoes')
    
  } catch (error: any) {
    console.error("Erro ao salvar configurações:", error)
    return { error: error.message || "Ocorreu um erro ao salvar os dados." }
  }

  // Redireciona apenas se for o setup inicial
  if (!profile?.organizations_id) {
    redirect('/dashboard')
  }

  return { success: true }
}