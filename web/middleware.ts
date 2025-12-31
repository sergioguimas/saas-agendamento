import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // O await é obrigatório no Next.js 15/16

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // CORREÇÃO: Passamos um único objeto para o .set()
              cookieStore.set({
                name,
                value,
                ...options,
                // Garantimos que 'expires' seja compatível (número ou undefined)
                expires: options.expires instanceof Date ? options.expires.getTime() : undefined,
                // Garantimos que 'sameSite' seja compatível com os tipos do Next.js
                sameSite: typeof options.sameSite === 'boolean' ? undefined : options.sameSite,
              })
            })
          } catch (error) {
            // O erro pode ser ignorado se chamado de um Server Component
          }
        },
      },
    }
  )
}