# Briefing DocAds

Sistema de briefings estratégicos para clientes da DocAds, com painel administrativo para gestão de clientes e respostas. Suporta **dois tipos de briefing por cliente**: Tráfego pago e Desenvolvimento de site.

**URL produção:** `https://briefing.docads.com.br`
**Stack:** HTML estático + Supabase (Auth + Postgres + Edge Functions) + cPanel

---

## Estrutura do projeto

```
briefing-docads/
├── public/                          # Arquivos a subir no cPanel (raiz do subdomínio)
│   ├── .htaccess                    # Rewrites + segurança Apache
│   ├── index.html                   # Redirect para /admin
│   ├── briefing.html                # Formulário público (lê ?c=slug)
│   ├── obrigado.html                # Pós-submissão (mensagem por tipo)
│   ├── admin/
│   │   ├── index.html               # Login
│   │   ├── dashboard.html           # Painel inicial (stats por tipo)
│   │   ├── clientes.html            # Lista de clientes + criação + escolha de tipo
│   │   ├── cliente.html             # Detalhe (?id=) — slots Tráfego e Site
│   │   ├── briefings.html           # Lista de briefings (filtro por tipo)
│   │   ├── briefing.html            # Visualização + export PDF (carrega schema certo)
│   │   └── usuarios.html            # Gestão de admins
│   └── assets/
│       ├── css/app.css              # Design system DocAds (claro)
│       ├── js/
│       │   ├── briefing-schema.js   # 11 blocos do briefing de TRÁFEGO
│       │   ├── briefing-site-schema.js # 12 blocos do briefing de SITE
│       │   ├── briefing-registry.js # Resolve tipo → schema + metadados
│       │   ├── briefing.js          # Form runtime multi-step (multi-tipo)
│       │   ├── supabase.js          # Client + RPC wrappers
│       │   ├── admin-shell.js       # Topbar comum
│       │   ├── masks.js             # CNPJ, telefone, currency, percent
│       │   ├── utils.js             # Helpers
│       │   └── config.js            # SUPABASE_URL + ANON_KEY
│       └── img/                     # Logo + favicon
│
├── supabase/
│   ├── 01-schema.sql                # Tabelas + indices + triggers
│   ├── 02-rls.sql                   # Row Level Security
│   ├── 03-functions.sql             # RPCs (security definer) — versão original
│   ├── 04-seed.sql                  # Cria primeiro admin
│   ├── 05-storage.sql               # Bucket de uploads
│   ├── 06-multi-briefing.sql        # ⭐ Migração para multi-tipo (idempotente)
│   └── functions/
│       └── notify-briefing/         # Edge Function (email Resend)
│
├── README.md                        # Este arquivo
└── DEPLOY.md                        # Passo-a-passo de deploy
```

---

## Como funciona

### Fluxo do cliente

1. Você cria o cliente no painel admin
2. Escolhe quais briefings quer gerar — Tráfego, Site, ou os dois
3. Sistema gera 1 link único por tipo escolhido (`/b/<slug>`)
4. Você envia o link correspondente para o cliente
5. Cliente abre, vê o nome da empresa pré-preenchido, responde o briefing
6. Auto-save em cada mudança (resiliente a perda de conexão)
7. Ao concluir: link daquele tipo é desativado + email vai para a equipe DocAds
8. Cliente que receber 2 links pode preencher os dois em ordens / momentos diferentes

### Fluxo admin

1. Login em `/admin` com credenciais do owner
2. Dashboard com stats separadas por tipo (Tráfego / Site) + briefings recentes
3. **Criar novo cliente** → modal pede dados básicos → após criar, modal pergunta quais tipos de briefing gerar (pode pular e gerar depois)
4. Tela do cliente exibe **2 slots** lado a lado: 🎯 Tráfego e 💻 Site, cada um com botão "Gerar link" / "Copiar" / "Desativar" / "Ver respostas"
5. Visualiza briefings, marca como analisados, exporta PDF
6. Pode adicionar mais usuários admin via Supabase + SQL

---

## Os tipos de briefing

### 🎯 Briefing de Tráfego (11 blocos)

Foco em estratégia de mídia paga: oferta, público, concorrência, objetivos de campanha, funil, marca, criativos, tracking e operação.

1. Empresa, Oferta, Público-alvo, Concorrência, Histórico de marketing, Objetivos & metas, Funil & operação, Marca & posicionamento, Ativos criativos, Tracking & acessos, Operacional

### 💻 Briefing de Site (12 blocos)

Foco em desenvolvimento de site / landing / e-commerce: objetivo, identidade, estrutura, conteúdo, funcionalidades, infra, SEO e operação.

1. Tipo de projeto, Empresa & contexto, Objetivos do site, Público-alvo, Concorrência & referências, Identidade visual & tom, Estrutura & páginas, Conteúdo & copy, Funcionalidades & integrações, Domínio/hospedagem/infra, Tracking/SEO/analytics, Operacional & expectativas

---

## Configuração

Veja [DEPLOY.md](./DEPLOY.md) para o passo-a-passo completo.

### Setup inicial (primeira vez)

1. **Supabase**: rodar os SQL files na ordem em SQL Editor
   ```
   01-schema.sql → 02-rls.sql → 03-functions.sql → 04-seed.sql → 05-storage.sql → 06-multi-briefing.sql
   ```
2. **Auth**: criar usuário owner (`adm@docads.com.br`) antes do `04-seed.sql`
3. **Edge Function**: deploy via Supabase CLI + setup Resend
4. **DNS**: apontar `briefing.docads.com.br` para o cPanel
5. **cPanel**: subir conteúdo de `public/` na raiz do subdomínio

### Atualização (já tem o sistema rodando — só falta o multi-tipo)

1. **Roda apenas** `supabase/06-multi-briefing.sql` no SQL Editor (idempotente — pode rodar várias vezes)
2. **Sobe** o conteúdo de `public/` no cPanel substituindo arquivos existentes
3. Pronto — todos os briefings antigos viram automaticamente do tipo `trafego`

---

## Migration `06-multi-briefing.sql` — o que faz

- Adiciona coluna `briefing_type text` em `briefing_links` e `briefings` (default `'trafego'` → backward compat)
- CHECK constraint: tipo só pode ser `'trafego'` ou `'site'`
- Índice único `(client_id, briefing_type) WHERE is_active=true` — evita 2 links ativos do mesmo tipo
- Atualiza `get_briefing_by_slug` para retornar `briefing_type`
- `save_briefing_draft` e `submit_briefing` passam a ser **scoped por tipo** (cliente pode ter draft de tráfego E draft de site sem colisão)
- `generate_briefing_slug(company, type)` — slug ganha prefixo `trf-` / `ste-` para legibilidade
- `get_dashboard_stats` — retorna contadores separados por tipo
- Status do cliente vai pra `completed` apenas quando **todos** os links ativos foram entregues

---

## Segurança

- Senhas só ficam no Supabase Auth (hasheadas com bcrypt)
- RLS bloqueia acesso a dados — anônimo só consegue via RPCs específicas
- Links de briefing são desativados automaticamente após submissão
- Cada link é scoped a UM tipo — não dá pra preencher tráfego no link de site
- Headers de segurança via `.htaccess` (X-Frame-Options, CSP-friendly)
- Sem dados sensíveis no código frontend
- CHECK constraint no banco impede tipo inválido em qualquer fonte

---

## Stack técnica

- **Front:** HTML5 + CSS Custom Properties + ES6 modules (sem build step)
- **Tipografia:** Fontshare (Satoshi + Cabinet Grotesk)
- **DB:** Supabase Postgres (free tier)
- **Auth:** Supabase Auth (email/senha)
- **Email:** Resend (free tier 100/dia)
- **Hosting:** cPanel (estáticos)
