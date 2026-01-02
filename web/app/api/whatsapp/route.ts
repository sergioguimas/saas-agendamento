import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    // O evento 'connection.update' indica mudança de status
    if (body.event === "connection.update") {
      const state = body.data?.state || body.data?.status
      const status = state === "open" ? "connected" : "disconnected"
      const instanceName = body.instance

      console.log(`[Webhook Evolution] Instância ${instanceName}: ${status}`)

      // Atualiza o status na tabela do banco de dados
      await supabase
        .from('whatsapp_instances')
        .update({ status: status })
        .eq('name', instanceName)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no Webhook:", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}