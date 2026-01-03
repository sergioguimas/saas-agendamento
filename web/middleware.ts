import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 1. Conecta ao Supabase
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

  // 2. Verifica Autenticação
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Definição de Rotas
  const pathname = request.nextUrl.pathname
  
  // Ignora arquivos estáticos (Melhora muito a performance)
  if (pathname.includes('.') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return response
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isSetupPage = pathname === '/setup'
  const isPublicRoute = pathname === '/'

  // 4. Lógica de Redirecionamento e Segurança
  if (!user) {
    // Se NÃO está logado e tenta acessar página interna
    if (!isAuthPage && !isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else {
    // Se ESTÁ logado, verificamos se ele já tem organização configurada
    let hasOrganization = false
    
    try {
      // Busca no banco novo usando a coluna CORRETA (organization_id singular)
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      
      hasOrganization = !!profile?.organization_id

    } catch (error) {
      // Se der erro de conexão, assume false para não travar, mas loga o erro
      console.error("Erro no Middleware (Perfil):", error)
    }

    // A. Usuário sem organização tenta acessar o painel -> Manda para Setup
    if (!hasOrganization && !isSetupPage && !isPublicRoute) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    // B. Usuário já configurado tenta acessar Login ou Setup -> Manda para Dashboard
    if (hasOrganization && (isAuthPage || isSetupPage)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas, EXCETO:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (ícone)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}