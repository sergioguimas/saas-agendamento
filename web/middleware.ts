import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  // Configuração padrão de resposta
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Conecta ao Supabase para gerenciar os cookies de sessão
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }))
        },
      },
    }
  )

  // Apenas atualiza a sessão (essencial para o Auth funcionar)
  await supabase.auth.getUser()

  // --- MODO DE SEGURANÇA ---
  // Removi toda a lógica de bloqueio de organização temporariamente.
  // Isso vai permitir que o site carregue. Se o problema for conexão com o banco,
  // o erro vai aparecer na tela do navegador (client-side), o que é muito mais fácil de corrigir.
  
  return response
}