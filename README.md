# Briefing DocAds

Sistema de briefings estratégicos para clientes da DocAds, com painel administrativo para gestão de clientes e respostas.

**URL produção:** `https://briefing.docads.com.br`
**Stack:** HTML estático + Supabase (Auth + Postgres + Edge Functions) + cPanel

---

## Estrutura do projeto

```
briefing-docads/
├── public/                    # Arquivos a subir no cPanel (raiz do subdomínio)
│   ├── .htaccess              # Rewrites + segurança Apache
│   ├── index.html             # Redirect para /admin
│   ├── briefing.html          # Formulário público (lê ?c=slug)
│   ├── obrigado.html          # Pós-submissão
│   ├── admin/
│   │   ├── index.html         # Login
│   │   ├── dashboard.html     # Painel inicial
│   │   ├── clientes.html      # Lista de clientes + criação
│   │   ├── cliente.html       # Detalhe (?id=)
│   │   ├── briefings.html     # Lista de briefings
│   │   ├── briefing.html      # Visualização + export PDF
│   │   └── usuarios.html      # Gestão de admins
│   └── assets/
│       ├── css/app.css        # Design system DocAds (claro)
│       ├── js/                # Módulos ES6
│       └── img/               # Logo + favicon
│
├── supabase/
│   ├── 01-schema.sql          # Tabelas + indices + triggers
│   ├── 02-rls.sql             # Row Level Security
│   ├── 03-functions.sql       # RPCs (security definer)
│   ├── 04-seed.sql            # Cria primeiro admin
│   └── functions/
│       └── notify-briefing/   # Edge Function (email Resend)
│
├── README.md                  # Este arquivo
└── DEPLOY.md                  # Passo-a-passo de deploy
```

---

## Como funciona

### Fluxo do cliente

1. Você cria o cliente no painel admin → sistema gera `slug` único
2. Você envia o link `https://briefing.docads.com.br/b/<slug>` para o cliente
3. Cliente abre, vê o nome da empresa pré-preenchido, responde o briefing em 11 etapas
4. Auto-save em cada mudança (resiliente a perda de conexão)
5. Ao concluir: link é desativado + email vai para `murilo@docads.com.br`

### Fluxo admin

1. Login em `/admin` com `adm@docads.com.br` / `DocAds123..`
2. Dashboard com stats + briefings recentes
3. Cadastra novo cliente → link gerado automaticamente
4. Visualiza briefings, marca como analisados, exporta PDF
5. Pode adicionar mais usuários admin via Supabase + SQL

---

## Os 11 blocos do briefing

1. **Empresa** — razão social, faturamento, sazonalidade
2. **Oferta** — produto, preço, ticket, margem, garantia
3. **Público-alvo** — avatar, dores, desejos, objeções, região
4. **Concorrência** — players, diferencial único
5. **Histórico de marketing** — investimento prévio, plataformas testadas
6. **Objetivos & metas** — KPI, orçamento, capacidade operacional
7. **Funil & operação** — jornada, gargalo, time comercial, CRM
8. **Marca & posicionamento** — tom de voz, brandbook
9. **Ativos criativos** — fotos, vídeos, depoimentos
10. **Tracking & acessos** — BM Meta, Google Ads, GA4, GTM, pixel
11. **Operacional** — aprovador, frequência de reuniões

---

## Configuração

Veja [DEPLOY.md](./DEPLOY.md) para o passo-a-passo completo.

Resumo rápido:

1. **Supabase**: rodar os 4 arquivos `.sql` na ordem em SQL Editor
2. **Auth**: criar usuário `adm@docads.com.br` / `DocAds123..` antes do `04-seed.sql`
3. **Edge Function**: deploy via Supabase CLI + setup Resend
4. **DNS**: apontar `briefing.docads.com.br` para o cPanel
5. **cPanel**: subir conteúdo de `public/` na raiz do subdomínio

---

## Segurança

- Senhas só ficam no Supabase Auth (hasheadas com bcrypt)
- RLS bloqueia acesso a dados — anônimo só consegue via RPCs específicas
- Links de briefing são desativados automaticamente após submissão
- Headers de segurança via `.htaccess` (X-Frame-Options, CSP-friendly)
- Sem dados sensíveis no código frontend

---

## Stack técnica

- **Front:** HTML5 + CSS Custom Properties + ES6 modules (sem build step)
- **Tipografia:** Fontshare (Satoshi + Cabinet Grotesk)
- **DB:** Supabase Postgres (free tier)
- **Auth:** Supabase Auth (email/senha)
- **Email:** Resend (free tier 100/dia)
- **Hosting:** cPanel (estáticos)
