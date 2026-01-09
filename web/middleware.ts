import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  
  // Ignora rotas estáticas e API
  if (pathname.includes('.') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return response
  }

  const isAuthPage = pathname === '/login'
  const isSetupPage = pathname === '/setup'
  const isPublicRoute = pathname === '/'

  if (!user) {
    // Se não está logado e tenta acessar área privada
    if (!isAuthPage && !isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else {
    // === LÓGICA DE ONBOARDING ATUALIZADA ===
    let isOnboardingCompleted = false
    let hasOrganization = false
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          organization_id, 
          organizations (
            onboarding_completed
          )
        `)
        .eq('id', user.id)
        .single()
      
      // Verifica se tem org vinculada
      if (profile?.organization_id) {
        hasOrganization = true
        // Verifica se a flag está true no banco
        // @ts-ignore
        isOnboardingCompleted = !!profile.organizations?.onboarding_completed
      }

    } catch (error) {
      console.error("Middleware Error:", error)
    }

    // REGRA 1: Usuário sem Organização (Erro de sistema ou convite pendente) -> Manda pro Setup (ou tela de erro)
    if (!hasOrganization && !isSetupPage && !isPublicRoute) {
       // Se a ideia é que APENAS o admin crie orgs, aqui talvez devesse ser uma página de "Contate o Suporte".
       // Mas mantendo a lógica de setup:
       return NextResponse.redirect(new URL('/setup', request.url))
    }

    // REGRA 2: Tem organização, mas NÃO completou o cadastro -> Força o Setup
    if (hasOrganization && !isOnboardingCompleted && !isSetupPage) {
       return NextResponse.redirect(new URL('/setup', request.url))
    }

    // REGRA 3: Já completou tudo e tenta voltar pro Login ou Setup -> Manda pro Dashboard
    if (isOnboardingCompleted && (isAuthPage || isSetupPage)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}