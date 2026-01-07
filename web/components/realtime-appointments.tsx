'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export function RealtimeAppointments() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Inscreve no canal de mudanças do banco
    const channel = supabase
      .channel('realtime-appointments')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta tudo (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          // Quando algo mudar, avisa o Next.js para recarregar os dados
          console.log('⚡ Mudança detectada no banco:', payload)
          router.refresh()

          // Feedback visual opcional
          if (payload.eventType === 'UPDATE' && payload.new.status === 'confirmed') {
             toast.success("Um agendamento foi confirmado!")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  return null // Esse componente não renderiza nada visual, só escuta
}