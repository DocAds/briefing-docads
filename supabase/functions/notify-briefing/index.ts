// =====================================================================
// Edge Function: notify-briefing
// =====================================================================
// Disparada via Database Webhook quando um briefing é INSERT/UPDATE
// com status='submitted'. Envia e-mail para murilo@docads.com.br
// usando Resend.
//
// Setup:
//   1. supabase functions deploy notify-briefing
//   2. supabase secrets set RESEND_API_KEY=re_xxx
//   3. supabase secrets set NOTIFY_TO=murilo@docads.com.br
//   4. supabase secrets set NOTIFY_FROM="Briefing DocAds <briefing@docads.com.br>"
//   5. Database Webhook:
//      Database > Webhooks > Create
//        Name: notify-briefing-submitted
//        Table: briefings
//        Events: INSERT, UPDATE
//        Type: Supabase Edge Function
//        Edge Function: notify-briefing
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: any;
  old_record: any | null;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "murilo@docads.com.br";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Briefing DocAds <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_URL = Deno.env.get("ADMIN_URL") ?? "https://briefing.docads.com.br/admin";

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    // Só processa briefings que viraram submitted
    if (payload.table !== "briefings") {
      return ok({ skipped: "wrong_table" });
    }

    const isNewSubmission =
      payload.record?.status === "submitted" &&
      (payload.type === "INSERT" || payload.old_record?.status !== "submitted");

    if (!isNewSubmission) {
      return ok({ skipped: "not_new_submission" });
    }

    // Busca dados do cliente
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, company_name, contact_name, contact_email, contact_phone, segment")
      .eq("id", payload.record.client_id)
      .single();

    if (clientError || !client) {
      console.error("client_fetch_failed", clientError);
      return error(500, "client_fetch_failed");
    }

    const briefingUrl = `${ADMIN_URL}/briefing.html?id=${payload.record.id}`;
    const answers = payload.record.answers ?? {};

    // Monta resumo
    const summary = buildSummary(answers);

    const html = renderEmail({
      companyName: client.company_name,
      contactName: client.contact_name,
      contactEmail: client.contact_email,
      contactPhone: client.contact_phone,
      segment: client.segment,
      briefingUrl,
      summary,
      submittedAt: new Date(payload.record.submitted_at ?? Date.now()),
    });

    // Envia via Resend
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        subject: `📋 Novo briefing concluído — ${client.company_name}`,
        html,
        reply_to: client.contact_email ?? undefined,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("resend_failed", resp.status, txt);
      return error(resp.status, "resend_failed", txt);
    }

    const result = await resp.json();
    return ok({ sent: true, id: result.id });
  } catch (e) {
    console.error("unexpected", e);
    return error(500, "unexpected", String(e));
  }
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function error(status: number, code: string, detail?: string) {
  return new Response(JSON.stringify({ error: code, detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildSummary(answers: Record<string, any>) {
  const items: { label: string; value: string }[] = [];

  const safe = (v: any) => (v == null || v === "" ? "—" : String(v));
  const fmt = (k: string, label: string) => {
    if (answers[k] != null && answers[k] !== "") {
      items.push({ label, value: safe(answers[k]) });
    }
  };

  fmt("oferta_principal", "Oferta principal");
  fmt("ticket_medio", "Ticket médio");
  fmt("orcamento_mensal", "Orçamento mensal");
  fmt("objetivo_principal", "Objetivo");
  fmt("meta_numerica", "Meta");
  fmt("regiao_atendimento", "Região de atendimento");

  return items;
}

function renderEmail(d: {
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  segment: string | null;
  briefingUrl: string;
  summary: { label: string; value: string }[];
  submittedAt: Date;
}) {
  const date = d.submittedAt.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "long",
    timeStyle: "short",
  });

  const summaryRows = d.summary.length
    ? d.summary
        .map(
          (s) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:160px;vertical-align:top;">${escapeHtml(s.label)}</td>
          <td style="padding:8px 0;color:#0f0f4e;font-size:14px;font-weight:500;">${escapeHtml(s.value)}</td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="2" style="padding:8px 0;color:#6b7280;font-size:13px;">Sem destaques disponíveis no resumo.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Briefing concluído — ${escapeHtml(d.companyName)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,15,78,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#0f0f4e 0%,#0077b6 100%);padding:32px 32px 28px 32px;">
              <div style="font-family:Inter,sans-serif;font-weight:900;font-size:28px;letter-spacing:-1px;color:#ffffff;">DOCADS<span style="color:#00b4d8;">.</span></div>
              <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">Briefing concluído</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Cliente</div>
              <h1 style="margin:6px 0 16px 0;font-size:26px;color:#0f0f4e;font-weight:800;line-height:1.2;">${escapeHtml(d.companyName)}</h1>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                ${
                  d.contactName
                    ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">Contato</td><td style="padding:4px 0;color:#0f0f4e;font-size:14px;">${escapeHtml(d.contactName)}</td></tr>`
                    : ""
                }
                ${
                  d.contactEmail
                    ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">E-mail</td><td style="padding:4px 0;color:#0f0f4e;font-size:14px;"><a href="mailto:${escapeHtml(d.contactEmail)}" style="color:#0077b6;text-decoration:none;">${escapeHtml(d.contactEmail)}</a></td></tr>`
                    : ""
                }
                ${
                  d.contactPhone
                    ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">Telefone</td><td style="padding:4px 0;color:#0f0f4e;font-size:14px;">${escapeHtml(d.contactPhone)}</td></tr>`
                    : ""
                }
                ${
                  d.segment
                    ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">Segmento</td><td style="padding:4px 0;color:#0f0f4e;font-size:14px;">${escapeHtml(d.segment)}</td></tr>`
                    : ""
                }
                <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">Concluído em</td><td style="padding:4px 0;color:#0f0f4e;font-size:14px;">${escapeHtml(date)}</td></tr>
              </table>

              <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-bottom:20px;">
                <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Resumo rápido</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${summaryRows}
                </table>
              </div>

              <div style="text-align:center;margin-top:28px;">
                <a href="${escapeHtml(d.briefingUrl)}" style="display:inline-block;background:#0f0f4e;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Ver briefing completo →</a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <div style="font-size:12px;color:#9ca3af;">Enviado automaticamente pelo sistema de briefings DocAds.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
