// =====================================================================
// Edge Function: create-admin-user
// =====================================================================
// Permite que owners criem novos admins direto pelo painel.
// Usa service role pra criar o usuário no Auth + insere em public.admins.
//
// Setup: já roda automaticamente após `supabase functions deploy`.
// Service role key vem como secret SUPABASE_SERVICE_ROLE_KEY (default).
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return error(401, "missing_authorization");

    const token = authHeader.replace(/^Bearer\s+/i, "");

    // 1) Verifica quem está chamando
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return error(401, "invalid_token");

    // 2) Confirma que é owner ativo
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: callerProfile, error: profileErr } = await adminClient
      .from("admins")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profileErr || !callerProfile?.is_active) return error(403, "not_admin");
    if (callerProfile.role !== "owner") return error(403, "owner_required");

    // 3) Lê e valida payload
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const full_name = String(body.full_name || "").trim();
    const password = String(body.password || "");
    const role = ["admin", "viewer"].includes(body.role) ? body.role : "admin";

    if (!email || !email.includes("@")) return error(400, "invalid_email");
    if (!full_name) return error(400, "missing_name");
    if (password.length < 8) return error(400, "password_too_short");

    // 4) Cria usuário no Auth (auto-confirmado)
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      const code = createErr.message?.toLowerCase().includes("already") ? "email_exists" : "create_failed";
      return error(400, code, createErr.message);
    }

    if (!created?.user) return error(500, "no_user_returned");

    // 5) Insere em public.admins
    const { error: insertErr } = await adminClient.from("admins").insert({
      id: created.user.id,
      full_name,
      role,
      is_active: true,
    });

    if (insertErr) {
      // rollback: remove o auth user
      await adminClient.auth.admin.deleteUser(created.user.id);
      return error(500, "admin_insert_failed", insertErr.message);
    }

    return ok({ id: created.user.id, email, full_name, role });
  } catch (e) {
    console.error("unexpected", e);
    return error(500, "unexpected", String(e));
  }
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(status: number, code: string, detail?: string) {
  return new Response(JSON.stringify({ error: code, detail }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
