# Deploy — Briefing DocAds

Passo-a-passo completo para colocar o sistema no ar em `briefing.docads.com.br`.

**Tempo total:** ~30 minutos

---

## Parte 1 — Supabase

### 1.1. Criar usuário admin

1. Abra [Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard/project/saomjqnbiovwtpghbdkt/auth/users)
2. Clique em **Add user → Create new user**
3. Preencha:
   - **Email:** `adm@docads.com.br`
   - **Password:** `DocAds123..`
   - ✅ **Auto Confirm User**
4. Clique **Create user**

### 1.2. Rodar os SQLs (na ordem)

Vá para [SQL Editor → New query](https://supabase.com/dashboard/project/saomjqnbiovwtpghbdkt/sql/new) e execute na ordem:

1. `supabase/01-schema.sql` — cria tabelas, indices, triggers
2. `supabase/02-rls.sql` — Row Level Security
3. `supabase/03-functions.sql` — RPCs `get_briefing_by_slug`, `save_briefing_draft`, `submit_briefing`, etc.
4. `supabase/04-seed.sql` — vincula `adm@docads.com.br` à tabela `admins` como `owner`

> Se algo falhar no `04-seed.sql`, você não criou o usuário no passo 1.1.

### 1.3. Deploy da Edge Function (notificação por email)

#### A. Criar conta no Resend (free)

1. Crie conta em [resend.com](https://resend.com) (até 100 emails/dia grátis, 3000/mês)
2. **Domains → Add Domain → docads.com.br**
3. Adicione os registros DNS que o Resend pedir (no painel da DocAds em onde gerencia o DNS de docads.com.br)
4. Aguarde verificação (geralmente <1h)
5. **API Keys → Create** → copie a `re_...`

#### B. Deploy da função

Instale a [Supabase CLI](https://supabase.com/docs/guides/cli) se ainda não tiver:

```bash
brew install supabase/tap/supabase
```

Login e link com o projeto:

```bash
supabase login
cd briefing-docads
supabase link --project-ref saomjqnbiovwtpghbdkt
```

Configure os secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
supabase secrets set NOTIFY_TO=murilo@docads.com.br
supabase secrets set NOTIFY_FROM="Briefing DocAds <briefing@docads.com.br>"
supabase secrets set ADMIN_URL="https://briefing.docads.com.br/admin"
```

Faça o deploy:

```bash
supabase functions deploy notify-briefing --no-verify-jwt
```

> `--no-verify-jwt` é necessário porque a função é chamada via webhook do banco, não via auth.

#### C. Configurar o Database Webhook

1. Vá em [Database → Webhooks](https://supabase.com/dashboard/project/saomjqnbiovwtpghbdkt/database/hooks)
2. **Create a new hook**:
   - **Name:** `notify-briefing-submitted`
   - **Table:** `briefings`
   - **Events:** ✅ Insert ✅ Update
   - **Type:** `Supabase Edge Functions`
   - **Edge Function:** `notify-briefing`
   - **Method:** POST
   - **Timeout:** 5000
3. Salvar

Teste: marcar um briefing como `submitted` deve disparar email.

---

## Parte 2 — DNS (subdomínio briefing.docads.com.br)

No painel onde você gerencia DNS de `docads.com.br`:

- **Tipo:** A
- **Nome:** `briefing`
- **Valor:** IP do servidor cPanel (geralmente fornecido pela hospedagem)
- **TTL:** 300 (ou padrão)

Aguarde propagação (~5-30min). Verifique com:

```bash
dig briefing.docads.com.br
```

---

## Parte 3 — cPanel

### 3.1. Criar subdomínio

1. cPanel → **Domains → Subdomains** (ou **Domínios**)
2. **Subdomain:** `briefing`
3. **Domain:** `docads.com.br`
4. **Document Root:** `/home/USER/briefing.docads.com.br` (ou similar)
5. Criar

### 3.2. Habilitar SSL (Let's Encrypt)

1. cPanel → **SSL/TLS Status**
2. Selecione `briefing.docads.com.br` → **Run AutoSSL**
3. Aguarde até ver certificado válido

### 3.3. Subir os arquivos

Via cPanel **File Manager** (ou FTP):

1. Vá até a pasta `briefing.docads.com.br/`
2. Faça upload de **todo o conteúdo** da pasta `public/` (não a pasta em si — o conteúdo dela)
3. Estrutura final no servidor:

```
briefing.docads.com.br/
├── .htaccess
├── index.html
├── briefing.html
├── obrigado.html
├── admin/
│   ├── index.html
│   ├── dashboard.html
│   └── ...
└── assets/
    ├── css/
    ├── js/
    └── img/
```

### 3.4. Validar

Abra:

- `https://briefing.docads.com.br/admin` → deve mostrar tela de login
- Login com `adm@docads.com.br` / `DocAds123..`
- Cadastrar primeiro cliente
- Copiar link gerado → abrir em aba anônima → preencher briefing teste
- Verificar email em `murilo@docads.com.br`

---

## Parte 4 — Git

```bash
cd briefing-docads
git init
git add .
git commit -m "feat: sistema de briefings DocAds"
git branch -M main
git remote add origin https://github.com/DocAds/briefing-docads.git
git push -u origin main
```

> Lembrete: o repo está conectado ao Vercel da DocAds. Se você for usar Vercel ao invés de cPanel, basta dar push e configurar a integração — o `.htaccess` será ignorado, mas o resto funciona como Static Site (deve apontar build directory para `public/`).

---

## Manutenção

### Adicionar novo usuário admin

1. Supabase Auth → criar usuário com email/senha
2. SQL Editor:

```sql
insert into public.admins (id, full_name, role)
select id, 'Nome Completo', 'admin'
from auth.users where email = 'novo@docads.com.br';
```

### Trocar senha do admin

Auth → Users → clique no usuário → **Send password reset** ou **Update user password**.

### Backup

Supabase faz backup automático no plano free. Para baixar:

```bash
supabase db dump --data-only > backup.sql
```

### Editar perguntas do briefing

Edite `public/assets/js/briefing-schema.js` — cada bloco vira uma etapa.
**ATENÇÃO:** se mudar `id` de campos, briefings antigos vão ficar com chaves órfãs no JSONB. Prefira adicionar novos campos do que renomear.

---

## Troubleshooting

| Problema | Solução |
|---|---|
| Login retorna "Usuário sem permissão de admin" | Não rodou `04-seed.sql` ou o email não bate. Verificar `select * from public.admins` |
| Briefing não envia email | Verificar logs em Supabase → Edge Functions → notify-briefing → Logs. 90% das vezes é Resend não verificou domínio ou key errada |
| Link `/b/<slug>` retorna 404 | `.htaccess` não foi enviado ou `mod_rewrite` desabilitado no cPanel |
| RLS bloqueando query no admin | Verificar se função `is_admin()` retorna `true` para o user logado: `select public.is_admin();` |
| Auto-save não funciona | DevTools → Network: ver se chamadas `save_briefing_draft` estão indo. Se erro CORS, reconferir Supabase URL no `config.js` |
