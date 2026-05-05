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

    // Monta seções estratégicas
    const sections = buildSections(answers);

    const html = renderEmail({
      companyName: client.company_name,
      contactName: client.contact_name,
      contactEmail: client.contact_email,
      contactPhone: client.contact_phone,
      segment: client.segment,
      briefingUrl,
      sections,
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
        subject: `Novo briefing concluído — ${client.company_name}`,
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

type SectionRow = { label: string; value: string; highlight?: boolean };
type Section = { icon: string; title: string; rows: SectionRow[] };

function buildSections(answers: Record<string, any>): Section[] {
  const has = (k: string) => {
    const v = answers[k];
    if (v == null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  };
  const val = (k: string): string => {
    const v = answers[k];
    if (Array.isArray(v)) return v.join(", ");
    return String(v ?? "");
  };
  const push = (sec: Section, k: string, label: string, highlight = false) => {
    if (has(k)) sec.rows.push({ label, value: val(k), highlight });
  };

  const sections: Section[] = [];

  // Objetivos & metas (mais importante — abre a leitura)
  const objectives: Section = { icon: "lucide:target", title: "Objetivos & metas", rows: [] };
  push(objectives, "objetivo_principal", "Objetivo", true);
  push(objectives, "meta_numerica", "Meta em 90 dias", true);
  push(objectives, "orcamento_mensal", "Orçamento/mês", true);
  push(objectives, "cpl_aceitavel", "CPA/CPL aceitável");
  push(objectives, "roas_esperado", "ROAS esperado");
  push(objectives, "capacidade_atendimento", "Capacidade/dia");
  push(objectives, "prazo_resultado", "Prazo de resultado");
  if (objectives.rows.length) sections.push(objectives);

  // Negócio & oferta
  const business: Section = { icon: "lucide:briefcase", title: "Negócio & oferta", rows: [] };
  push(business, "razao_social", "Razão social");
  push(business, "cnpj", "CNPJ");
  push(business, "site", "Site");
  push(business, "instagram", "Instagram");
  push(business, "tempo_mercado", "Tempo de mercado");
  push(business, "faturamento_mensal", "Faturamento");
  push(business, "oferta_principal", "Oferta principal", true);
  push(business, "preco", "Preço");
  push(business, "ticket_medio", "Ticket médio", true);
  push(business, "margem_lucro", "Margem");
  push(business, "garantia", "Garantia");
  push(business, "regiao_atendimento", "Região");
  if (business.rows.length) sections.push(business);

  // Público-alvo
  const audience: Section = { icon: "lucide:users", title: "Público-alvo", rows: [] };
  push(audience, "avatar_descricao", "Avatar");
  push(audience, "faixa_etaria", "Faixa etária");
  push(audience, "genero_predominante", "Gênero");
  push(audience, "classe_social", "Classe social");
  push(audience, "dores", "Dores");
  push(audience, "desejos", "Desejos");
  push(audience, "objecoes", "Objeções");
  if (audience.rows.length) sections.push(audience);

  // Concorrência
  const competition: Section = { icon: "lucide:swords", title: "Concorrência", rows: [] };
  push(competition, "concorrentes_principais", "Principais concorrentes");
  push(competition, "concorrentes_pontos_fracos", "Onde é melhor que eles");
  push(competition, "diferencial_unico", "Diferencial único", true);
  push(competition, "concorrentes_anuncios", "Concorrentes anunciam?");
  if (competition.rows.length) sections.push(competition);

  // Histórico de mídia
  const history: Section = { icon: "lucide:trending-up", title: "Histórico de mídia paga", rows: [] };
  push(history, "ja_anunciou", "Já anunciou");
  push(history, "plataformas_testadas", "Plataformas testadas");
  push(history, "investimento_anterior", "Investimento anterior");
  push(history, "resultado_anterior", "Resultados");
  push(history, "agencia_anterior", "Agência anterior");
  push(history, "que_funcionou", "Funcionou no passado");
  push(history, "que_nao_funcionou", "Não funcionou");
  if (history.rows.length) sections.push(history);

  // Funil & operação
  const funnel: Section = { icon: "lucide:filter", title: "Funil & operação", rows: [] };
  push(funnel, "jornada_compra", "Jornada de compra");
  push(funnel, "tempo_fechamento", "Tempo até fechar");
  push(funnel, "taxa_conversao", "Taxa de conversão");
  push(funnel, "gargalo_atual", "Gargalo atual");
  push(funnel, "canal_atendimento", "Canal de atendimento");
  push(funnel, "time_comercial", "Time comercial");
  push(funnel, "crm", "CRM");
  if (funnel.rows.length) sections.push(funnel);

  // Marca & criativos
  const creative: Section = { icon: "lucide:palette", title: "Marca & criativos", rows: [] };
  push(creative, "tom_voz", "Tom de voz");
  push(creative, "tem_brandbook", "Brandbook");
  push(creative, "tem_fotos", "Fotos profissionais");
  push(creative, "tem_videos", "Vídeos prontos");
  push(creative, "depoimentos", "Depoimentos");
  push(creative, "pode_aparecer", "Pode aparecer em vídeo");
  push(creative, "drive_materiais", "Drive de materiais");
  push(creative, "aprovador_criativos", "Aprovador");
  if (creative.rows.length) sections.push(creative);

  // Tracking & acessos
  const tracking: Section = { icon: "lucide:settings", title: "Tracking & acessos técnicos", rows: [] };
  push(tracking, "tem_bm_meta", "Business Manager");
  push(tracking, "tem_google_ads", "Google Ads");
  push(tracking, "tem_ga4", "GA4");
  push(tracking, "tem_gtm", "GTM");
  push(tracking, "tem_pixel_meta", "Pixel Meta");
  push(tracking, "pode_dar_acesso", "Pode dar acesso", true);
  push(tracking, "site_dominio", "Domínio");
  push(tracking, "cms", "Plataforma do site");
  push(tracking, "tem_landing_page", "Landing page");
  push(tracking, "tem_whatsapp", "WhatsApp");
  push(tracking, "whatsapp_business", "Tipo WhatsApp");
  if (tracking.rows.length) sections.push(tracking);

  // Operacional
  const ops: Section = { icon: "lucide:clipboard-list", title: "Operacional", rows: [] };
  push(ops, "responsavel_aprovacao", "Responsável aprovação");
  push(ops, "reunioes_frequencia", "Reuniões");
  push(ops, "canal_comunicacao", "Comunicação");
  push(ops, "comeca_quando", "Quando começar");
  push(ops, "observacoes_extras", "Observações");
  if (ops.rows.length) sections.push(ops);

  return sections;
}

function renderEmail(d: {
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  segment: string | null;
  briefingUrl: string;
  sections: Section[];
  submittedAt: Date;
}) {
  const date = d.submittedAt.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "long",
    timeStyle: "short",
  });

  const renderRow = (r: SectionRow) => {
    const valStyle = r.highlight
      ? "padding:10px 0;color:#0f0f4e;font-size:14px;font-weight:600;line-height:1.5;"
      : "padding:10px 0;color:#1f2937;font-size:14px;font-weight:400;line-height:1.5;";
    return `
      <tr>
        <td style="padding:10px 16px 10px 0;color:#6b7280;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;width:170px;vertical-align:top;border-bottom:1px solid #f3f4f6;">${escapeHtml(r.label)}</td>
        <td style="${valStyle}border-bottom:1px solid #f3f4f6;">${escapeHtml(r.value).replace(/\n/g, "<br>")}</td>
      </tr>`;
  };

  const renderSection = (s: Section) => `
    <tr>
      <td style="padding:24px 32px 8px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:8px;vertical-align:middle;">
              <img src="${iconifyUrl(s.icon, "0077b6", 18)}" width="18" height="18" alt="" style="display:block;">
            </td>
            <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0077b6;vertical-align:middle;">
              ${escapeHtml(s.title)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 8px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${s.rows.map(renderRow).join("")}
        </table>
      </td>
    </tr>`;

  const sectionsHtml = d.sections.length
    ? d.sections.map(renderSection).join("")
    : `<tr><td style="padding:24px 32px;color:#9ca3af;font-size:14px;font-style:italic;">O cliente não preencheu nenhum campo do briefing.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<title>Briefing concluído — ${escapeHtml(d.companyName)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    body, .email-bg { background: #0f0f1e !important; }
  }
  @media (max-width: 600px) {
    .email-card { border-radius: 0 !important; }
    .email-section { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;">Briefing de ${escapeHtml(d.companyName)} concluído. Veja resumo estratégico e acesse o briefing completo.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#eef0f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" class="email-card" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(15,15,78,0.10);">

          <!-- HERO -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0f4e 0%,#1a1a6e 50%,#0077b6 100%);padding:40px 32px 36px 32px;position:relative;">
              <div style="font-family:'Cabinet Grotesk',Inter,sans-serif;font-weight:900;font-size:32px;letter-spacing:-1.5px;color:#ffffff;line-height:1;">DOCADS<span style="color:#00b4d8;">.</span></div>
              <div style="margin-top:12px;display:inline-block;background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:100px;font-size:11px;color:#ffffff;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">
                <img src="${iconifyUrl("lucide:check-circle-2", "ffffff", 14)}" width="14" height="14" alt="" style="display:inline-block;vertical-align:-2px;margin-right:6px;">Novo briefing concluído
              </div>
              <h1 style="margin:20px 0 6px 0;font-family:'Cabinet Grotesk',Inter,sans-serif;font-size:32px;color:#ffffff;font-weight:800;line-height:1.15;letter-spacing:-0.5px;">${escapeHtml(d.companyName)}</h1>
              ${
                d.segment
                  ? `<div style="color:rgba(255,255,255,0.75);font-size:14px;font-weight:500;">${escapeHtml(d.segment)}</div>`
                  : ""
              }
            </td>
          </tr>

          <!-- CONTATO -->
          <tr>
            <td class="email-section" style="padding:28px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td style="padding-right:8px;vertical-align:middle;">
                    <img src="${iconifyUrl("lucide:phone", "0077b6", 16)}" width="16" height="16" alt="" style="display:block;">
                  </td>
                  <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0077b6;vertical-align:middle;">Contato</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${
                  d.contactName
                    ? `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;width:170px;">Nome</td><td style="padding:6px 0;color:#0f0f4e;font-size:14px;font-weight:600;">${escapeHtml(d.contactName)}</td></tr>`
                    : ""
                }
                ${
                  d.contactEmail
                    ? `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;width:170px;">E-mail</td><td style="padding:6px 0;font-size:14px;font-weight:500;"><a href="mailto:${escapeHtml(d.contactEmail)}" style="color:#0077b6;text-decoration:none;">${escapeHtml(d.contactEmail)}</a></td></tr>`
                    : ""
                }
                ${
                  d.contactPhone
                    ? `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;width:170px;">Telefone</td><td style="padding:6px 0;font-size:14px;font-weight:500;"><a href="tel:${escapeHtml(d.contactPhone.replace(/\D/g, ""))}" style="color:#0077b6;text-decoration:none;">${escapeHtml(d.contactPhone)}</a></td></tr>`
                    : ""
                }
                <tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;width:170px;">Concluído em</td><td style="padding:6px 0;color:#1f2937;font-size:14px;">${escapeHtml(date)}</td></tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr><td style="padding:24px 32px 0 32px;"><div style="height:1px;background:linear-gradient(to right, transparent, #e5e7eb, transparent);"></div></td></tr>

          <!-- CTA TOPO -->
          <tr>
            <td style="padding:20px 32px 8px 32px;text-align:center;">
              <a href="${escapeHtml(d.briefingUrl)}" style="display:inline-block;background:linear-gradient(135deg,#0f0f4e,#0077b6);color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(0,119,182,0.35);">
                Abrir briefing completo no painel →
              </a>
            </td>
          </tr>

          <!-- SEÇÕES -->
          ${sectionsHtml}

          <!-- CTA RODAPÉ -->
          <tr>
            <td style="padding:24px 32px 32px 32px;text-align:center;">
              <a href="${escapeHtml(d.briefingUrl)}" style="display:inline-block;background:#0f0f4e;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Ver no painel →</a>
              ${
                d.contactEmail
                  ? `<a href="mailto:${escapeHtml(d.contactEmail)}" style="display:inline-block;margin-left:8px;background:#ffffff;color:#0f0f4e;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;border:1px solid #e5e7eb;">Responder cliente</a>`
                  : ""
              }
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <div style="font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:14px;color:#0f0f4e;letter-spacing:-0.3px;">DOCADS<span style="color:#00b4d8;">.</span></div>
              <div style="font-size:11px;color:#9ca3af;margin-top:6px;line-height:1.5;">
                Enviado automaticamente pelo sistema de briefings.<br>
                Ao responder este e-mail, você fala diretamente com o cliente.
              </div>
            </td>
          </tr>
        </table>

        <div style="font-size:11px;color:#9ca3af;margin-top:16px;">
          DocAds Marketing de Performance · briefing.docads.com.br
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function iconifyUrl(iconName: string, hexColor: string, size: number): string {
  // Ex: lucide:target → https://api.iconify.design/lucide/target.svg?color=%230077b6&width=18
  const path = iconName.replace(":", "/");
  return `https://api.iconify.design/${path}.svg?color=%23${hexColor}&width=${size}&height=${size}`;
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
