import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    console.log("Webhook received:", payload)

    const documentId = payload.signature_request_id || payload.document_id || payload.id

    if (!documentId) {
      return new Response("Missing document ID", { status: 400, headers: corsHeaders })
    }

    let status = "sent"
    if (payload.status === "signed" || payload.status === "completed") {
      status = "signed"
    } else if (payload.status === "rejected" || payload.status === "expired") {
      status = "cancelled"
    }

    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }

    if (status === "signed") {
      updateData.signed_at = new Date().toISOString()
      if (payload.document && payload.document.download_url) {
        updateData.pdf_url = payload.document.download_url
      }
    }

    const { data, error } = await supabase
      .from("generated_contracts")
      .update(updateData)
      .eq("signature_request_id", documentId)

    if (error) {
      console.error("Database error:", error)
      return new Response("Database error", { status: 500, headers: corsHeaders })
    }

    console.log("Contract updated successfully")

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Webhook error:", error)
    return new Response("Internal error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})