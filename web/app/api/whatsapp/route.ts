import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  // A Evolution envia o evento 'connection.update'
  if (body.event === "connection.update") {
    const status = body.data.state === "open" ? "connected" : "disconnected"
    const instanceName = body.instance
    
    await supabase
      .from('whatsapp_instances')
      .update({ status: status })
      .eq('name', instanceName)
  }

  return NextResponse.json({ received: true })
}