// =====================================================================
// Briefing — Schema de SITE / DESENVOLVIMENTO (12 blocos)
// =====================================================================
// Base de toda a discovery técnica para projetos de site, landing,
// e-commerce ou redesign. Mesma estrutura do schema de tráfego.
// =====================================================================

export const SITE_BRIEFING_STEPS = [
  // -------------------------------------------------------------------
  {
    id: 'projeto',
    title: 'Tipo de projeto',
    desc: 'Vamos começar entendendo o que você quer construir.',
    fields: [
      { id: 'tipo_projeto', type: 'radio', label: 'Qual o tipo de projeto?',
        options: [
          'Landing page (página única de conversão)',
          'Site institucional (multi-páginas)',
          'Site institucional + blog',
          'E-commerce / loja virtual',
          'Sistema / aplicação web',
          'Redesign de site existente',
          'Migração de plataforma',
          'Não sei ainda — quero ajuda para decidir'
        ], required: true },
      { id: 'site_atual', type: 'url', label: 'Site atual (se já existe)',
        placeholder: 'https://', hint: 'Deixe em branco se for criar do zero' },
      { id: 'motivo_redesign', type: 'textarea', label: 'Por que está refazendo o site?',
        hint: 'O que não funciona hoje? O que você quer mudar?',
        showIf: { field: 'tipo_projeto', in: ['Redesign de site existente', 'Migração de plataforma'] } },
      { id: 'urgencia', type: 'select', label: 'Qual a urgência do projeto?',
        options: [
          'Tenho deadline crítico (até 30 dias)',
          'Próximos 60 dias',
          '2 a 3 meses',
          '3 a 6 meses',
          'Sem pressa, qualidade acima de prazo'
        ], required: true },
      { id: 'orcamento_estimado', type: 'select', label: 'Orçamento previsto para o projeto',
        hint: 'Apenas desenvolvimento (sem mídia, sem mensalidade pós-launch)',
        options: [
          'Até R$ 3.000', 'R$ 3.000 a R$ 8.000', 'R$ 8.000 a R$ 15.000',
          'R$ 15.000 a R$ 30.000', 'R$ 30.000 a R$ 60.000',
          'Acima de R$ 60.000', 'Quero proposta sem teto definido'
        ], required: true }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'empresa',
    title: 'Sobre a empresa',
    desc: 'Contexto rápido do negócio para alinhar tom e abordagem.',
    fields: [
      { id: 'razao_social', type: 'text', label: 'Razão social', required: true },
      { id: 'nome_fantasia', type: 'text', label: 'Nome fantasia (como o cliente conhece)', required: true },
      { id: 'cnpj', type: 'text', label: 'CNPJ', placeholder: '00.000.000/0000-00', mask: 'cnpj' },
      { id: 'segmento', type: 'text', label: 'Segmento / nicho', placeholder: 'Ex: imobiliária, clínica estética, autopeças', required: true },
      { id: 'descricao_negocio', type: 'textarea', label: 'Descreva o que sua empresa faz em 2 a 3 frases',
        hint: 'Como se estivesse explicando para alguém que nunca ouviu falar', required: true },
      { id: 'tempo_mercado', type: 'select', label: 'Há quanto tempo no mercado?', options: [
        'Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'
      ]},
      { id: 'redes_sociais', type: 'textarea', label: 'Redes sociais ativas',
        hint: 'Cole os links — Instagram, LinkedIn, YouTube, TikTok etc.' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'objetivos',
    title: 'Objetivos do site',
    desc: 'Por que esse site existe? Qual problema ele resolve para o negócio?',
    fields: [
      { id: 'objetivo_principal', type: 'checkbox', label: 'Qual o objetivo principal do site?',
        hint: 'Pode marcar mais de um — mas tente eleger 1 prioritário',
        options: [
          'Gerar leads (formulários / WhatsApp)',
          'Vender direto (e-commerce / checkout)',
          'Construir autoridade / conteúdo',
          'Apresentar a empresa (portfólio / institucional)',
          'Atender clientes existentes (área logada / suporte)',
          'Receber agendamentos online',
          'Captar candidatos / vagas',
          'Conversão de tráfego pago (landing page de campanha)'
        ], required: true },
      { id: 'cta_principal', type: 'text', label: 'Qual a ação principal que o visitante deve tomar?',
        hint: 'Ex: "preencher formulário", "chamar no WhatsApp", "comprar agora", "agendar consulta"',
        required: true },
      { id: 'meta_conversao', type: 'text', label: 'Meta de conversão esperada',
        hint: 'Ex: 50 leads/mês, 30 agendamentos/mês, 100 vendas/mês' },
      { id: 'kpi_sucesso', type: 'textarea', label: 'Como você vai medir se o site foi bem-sucedido?',
        hint: 'O que precisa acontecer em 3 meses para você dizer "valeu a pena"' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'publico',
    title: 'Público-alvo',
    desc: 'Para quem o site é feito? Decisões de UX dependem disso.',
    fields: [
      { id: 'avatar_descricao', type: 'textarea', label: 'Descreva o cliente ideal em 2 a 3 frases',
        hint: 'Idade, profissão, onde mora, momento de vida', required: true },
      { id: 'dispositivo_principal', type: 'radio', label: 'Em que dispositivo seu cliente vai acessar mais?',
        options: ['Mobile (celular) — maior parte', 'Desktop — maior parte', 'Equilibrado', 'Não sei'],
        required: true },
      { id: 'nivel_tecnico', type: 'radio', label: 'Nível técnico do público',
        hint: 'Define complexidade aceitável da interface',
        options: [
          'Básico — pouca familiaridade com internet',
          'Médio — usa redes sociais e compra online',
          'Avançado — confortável com tecnologia',
          'Misto'
        ] },
      { id: 'idioma', type: 'checkbox', label: 'Em quais idiomas o site precisa estar?',
        options: ['Português', 'Inglês', 'Espanhol', 'Outros (especifique nas observações)'],
        required: true },
      { id: 'acessibilidade', type: 'radio', label: 'Acessibilidade WCAG é prioridade?',
        hint: 'Importante se o público inclui pessoas com deficiência ou se há exigência regulatória',
        options: ['Sim, prioridade alta', 'Sim, mas não crítico', 'Não, padrão básico está ok', 'Não sei'] }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'referencias',
    title: 'Concorrência & referências',
    desc: 'Sites que você admira são o melhor briefing visual.',
    fields: [
      { id: 'concorrentes_sites', type: 'textarea', label: 'Sites de 3 concorrentes diretos',
        hint: 'Cole o link de cada um, um por linha', required: true },
      { id: 'concorrentes_pontos_fortes', type: 'textarea',
        label: 'O que os concorrentes fazem bem no site deles?' },
      { id: 'concorrentes_pontos_fracos', type: 'textarea',
        label: 'Onde você quer ser MELHOR que os concorrentes no site?' },
      { id: 'sites_referencia', type: 'textarea',
        label: 'Liste 3 a 5 sites que você AMA (não precisa ser do seu mercado)',
        hint: 'Cole o link + 1 frase do que gosta nele', required: true },
      { id: 'sites_evitar', type: 'textarea', label: 'Sites ou padrões que você QUER EVITAR',
        hint: 'Coisas que não combinam com sua marca' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'identidade',
    title: 'Identidade visual & tom',
    desc: 'A marca que vamos respeitar e amplificar.',
    fields: [
      { id: 'tem_brandbook', type: 'radio', label: 'Tem brandbook ou manual de marca?',
        options: ['Sim, completo', 'Sim, parcial', 'Não, mas tem cores e fontes definidas', 'Não tem nada'],
        required: true },
      { id: 'brandbook_tipo', type: 'radio', label: 'Como vai compartilhar o brandbook?',
        options: ['Link do Drive', 'Upload de arquivo'],
        showIf: { field: 'tem_brandbook', in: ['Sim, completo', 'Sim, parcial'] } },
      { id: 'brandbook_link', type: 'url', label: 'Link do Drive com o brandbook',
        placeholder: 'https://drive.google.com/...',
        showIf: { field: 'brandbook_tipo', equals: 'Link do Drive' } },
      { id: 'brandbook_arquivos', type: 'file', label: 'Upload do brandbook',
        hint: 'Até 10 arquivos (PDF, imagem, Word). Máximo 10MB cada.',
        multiple: true, maxFiles: 10,
        accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx,.ai,.psd',
        showIf: { field: 'brandbook_tipo', equals: 'Upload de arquivo' } },
      { id: 'cores_principais', type: 'text', label: 'Cores principais da marca',
        placeholder: 'Ex: #0B1956, #00D9FF — ou descreva' },
      { id: 'fontes_marca', type: 'text', label: 'Fontes / tipografia da marca',
        placeholder: 'Ex: Satoshi, Inter — ou "não definido"' },
      { id: 'logo_arquivos', type: 'file', label: 'Upload do logo (em vetor se possível)',
        hint: 'PNG, SVG, AI ou PDF. Até 5 arquivos.',
        multiple: true, maxFiles: 5,
        accept: '.png,.svg,.ai,.pdf,.eps,.jpg,.jpeg' },
      { id: 'tom_voz', type: 'checkbox', label: 'Tom de comunicação do site',
        options: [
          'Profissional / formal',
          'Próximo / amigável',
          'Divertido / descontraído',
          'Técnico / educativo',
          'Sofisticado / premium',
          'Direto / sem rodeios',
          'Inspiracional / motivacional'
        ] },
      { id: 'estilo_visual', type: 'checkbox', label: 'Estilos visuais que combinam com sua marca',
        options: [
          'Minimalista / clean',
          'Bold / impacto',
          'Premium / luxo',
          'Editorial / revista',
          'Tech / futurista',
          'Orgânico / natural',
          'Brutalista / experimental',
          'Corporativo / sério'
        ] }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'estrutura',
    title: 'Estrutura & páginas',
    desc: 'O sitemap — quais páginas o site precisa ter?',
    fields: [
      { id: 'paginas_obrigatorias', type: 'checkbox', label: 'Páginas que o site precisa ter',
        options: [
          'Home',
          'Sobre / Quem somos',
          'Produtos / Serviços (lista)',
          'Página de produto / serviço individual',
          'Portfólio / Cases / Trabalhos',
          'Blog / Conteúdo',
          'Depoimentos / Cases de cliente',
          'FAQ / Perguntas frequentes',
          'Contato',
          'Trabalhe conosco / Vagas',
          'Política de privacidade / Termos',
          'Área do cliente / Login',
          'Carrinho / Checkout',
          'Páginas de campanha (landing)'
        ], required: true },
      { id: 'paginas_extras', type: 'textarea', label: 'Outras páginas / seções específicas',
        hint: 'O que mais precisa estar no site?' },
      { id: 'qtd_produtos_servicos', type: 'select', label: 'Quantos produtos / serviços terão página própria?',
        options: ['Nenhum', '1 a 5', '6 a 20', '21 a 50', '51 a 200', 'Mais de 200', 'Não sei'] },
      { id: 'sitemap_referencia', type: 'textarea', label: 'Referência de sitemap (se tiver site atual ou quer copiar de outro)',
        hint: 'Cole a estrutura ou link do site de referência' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'conteudo',
    title: 'Conteúdo & copy',
    desc: 'Quem produz texto, foto e vídeo? 80% dos atrasos vêm daqui.',
    fields: [
      { id: 'quem_fornece_texto', type: 'radio', label: 'Quem vai escrever o texto do site?',
        options: [
          'Você / sua equipe entrega tudo pronto',
          'Você entrega rascunho, agência refina',
          'Agência escreve do zero (precisa redação)',
          'Tenho dúvidas — vamos discutir'
        ], required: true },
      { id: 'tem_fotos', type: 'radio', label: 'Tem fotos profissionais para usar no site?',
        options: ['Sim, banco completo', 'Sim, algumas', 'Não, mas tenho material de celular', 'Não tem nada — precisa banco de imagens', 'Precisa ensaio fotográfico'] },
      { id: 'tem_videos', type: 'radio', label: 'Tem vídeos prontos?',
        options: ['Sim, vários', 'Sim, alguns', 'Não, mas posso gravar', 'Não — precisa produção', 'Não vai usar vídeo'] },
      { id: 'depoimentos', type: 'radio', label: 'Tem depoimentos / cases de cliente?',
        options: ['Sim, em vídeo + texto', 'Sim, só em texto', 'Sim, só em print de WhatsApp/redes', 'Não tem'] },
      { id: 'drive_materiais', type: 'url', label: 'Link do Drive com materiais (fotos, vídeos, textos)',
        placeholder: 'https://drive.google.com/...' },
      { id: 'precisa_traducao', type: 'radio', label: 'Precisa traduzir conteúdo para outro idioma?',
        options: ['Sim, profissional', 'Sim, automática (Google Translate)', 'Não'],
        showIf: { field: 'idioma', in: ['Inglês', 'Espanhol', 'Outros (especifique nas observações)'] } }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'funcionalidades',
    title: 'Funcionalidades & integrações',
    desc: 'O que o site precisa FAZER, além de mostrar conteúdo.',
    fields: [
      { id: 'formularios', type: 'textarea', label: 'Quais formulários o site terá?',
        hint: 'Ex: contato, orçamento, newsletter, cadastro, candidatura. Liste cada um.', required: true },
      { id: 'destino_leads', type: 'checkbox', label: 'Para onde os leads dos formulários devem ir?',
        options: [
          'E-mail (qual?)',
          'WhatsApp',
          'CRM (qual?)',
          'Planilha Google',
          'Notion / Airtable',
          'Webhook / API própria',
          'Não sei'
        ], required: true },
      { id: 'destino_leads_detalhe', type: 'textarea',
        label: 'Detalhes do destino (e-mails, número WhatsApp, qual CRM)',
        placeholder: 'Ex: leads@empresa.com.br + WhatsApp 19 99999-9999 + RD Station' },
      { id: 'integracoes', type: 'checkbox', label: 'Integrações necessárias',
        options: [
          'WhatsApp (botão flutuante / chat)',
          'Google Calendar (agendamento)',
          'Calendly / Cal.com',
          'Stripe / pagamento online',
          'Mercado Pago / Pagar.me',
          'Mailchimp / RD Station / ActiveCampaign',
          'HubSpot / Pipedrive / Salesforce',
          'Hotjar / Microsoft Clarity',
          'Chatbot (qual?)',
          'API própria do cliente',
          'Nenhuma'
        ] },
      { id: 'area_logada', type: 'radio', label: 'Site terá área restrita / login?',
        options: [
          'Não',
          'Sim, login simples (cliente vê pedidos)',
          'Sim, área de membros (cursos / conteúdo pago)',
          'Sim, painel administrativo customizado',
          'Não sei ainda'
        ] },
      { id: 'ecommerce_qtd', type: 'select', label: 'Quantos produtos no e-commerce?',
        options: ['1 a 10', '11 a 50', '51 a 200', '201 a 1000', 'Mais de 1000'],
        showIf: { field: 'tipo_projeto', equals: 'E-commerce / loja virtual' } },
      { id: 'ecommerce_pagamentos', type: 'checkbox', label: 'Formas de pagamento do e-commerce',
        options: ['PIX', 'Cartão de crédito', 'Boleto', 'Cartão débito', 'Carteira digital (PicPay etc.)', 'Crédito loja'],
        showIf: { field: 'tipo_projeto', equals: 'E-commerce / loja virtual' } },
      { id: 'ecommerce_frete', type: 'checkbox', label: 'Frete & logística',
        options: ['Correios (cálculo automático)', 'Melhor Envio', 'Frete fixo', 'Retirada no local', 'Frete grátis acima de X', 'Logística própria'],
        showIf: { field: 'tipo_projeto', equals: 'E-commerce / loja virtual' } },
      { id: 'funcionalidades_extras', type: 'textarea',
        label: 'Outras funcionalidades específicas',
        hint: 'Ex: filtros avançados, busca com IA, calculadora, simulador, multi-idiomas com SEO separado' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'infra',
    title: 'Domínio, hospedagem & infra',
    desc: 'Onde o site vai morar e como vamos publicar.',
    fields: [
      { id: 'tem_dominio', type: 'radio', label: 'Já tem domínio?',
        options: ['Sim, registrado no nome da empresa', 'Sim, registrado em outro nome', 'Não, agência registra', 'Quero que vocês indiquem opções'],
        required: true },
      { id: 'dominio_atual', type: 'text', label: 'Qual é o domínio?',
        placeholder: 'exemplo.com.br',
        showIf: { field: 'tem_dominio', in: ['Sim, registrado no nome da empresa', 'Sim, registrado em outro nome'] } },
      { id: 'dominio_registrar', type: 'text', label: 'Onde está registrado?',
        placeholder: 'Ex: Registro.br, GoDaddy, HostGator',
        showIf: { field: 'tem_dominio', in: ['Sim, registrado no nome da empresa', 'Sim, registrado em outro nome'] } },
      { id: 'plataforma_atual', type: 'text', label: 'Plataforma do site atual (se existe)',
        placeholder: 'Ex: WordPress, Wix, Shopify, próprio, nenhum' },
      { id: 'precisa_migrar_conteudo', type: 'radio', label: 'Precisa migrar conteúdo do site antigo?',
        options: ['Sim, tudo', 'Sim, parte (dizer o que)', 'Não, vai começar do zero', 'Não tem site antigo'] },
      { id: 'emails_corporativos', type: 'radio', label: 'Vai usar e-mails corporativos no domínio?',
        hint: 'Ex: contato@empresa.com.br',
        options: ['Sim, já tem (Google Workspace / Microsoft 365)', 'Sim, precisa configurar', 'Não, usa Gmail pessoal', 'Não sei'] },
      { id: 'preferencia_stack', type: 'radio', label: 'Tem preferência de tecnologia?',
        options: [
          'WordPress (CMS amigável)',
          'Webflow (no-code premium)',
          'Next.js / React (custom moderno)',
          'Shopify (e-commerce)',
          'Não tenho preferência — agência decide'
        ] }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'tracking',
    title: 'Tracking, SEO & analytics',
    desc: 'Como vamos medir, otimizar e fazer o site aparecer no Google.',
    fields: [
      { id: 'tem_ga4', type: 'radio', label: 'GA4 já instalado?',
        options: ['Sim, configurado', 'Sim, mas sem certeza se funciona', 'Não', 'Não sei'] },
      { id: 'tem_gtm', type: 'radio', label: 'Google Tag Manager instalado?',
        options: ['Sim, com acesso', 'Sim, sem acesso', 'Não', 'Não sei'] },
      { id: 'tem_search_console', type: 'radio', label: 'Google Search Console configurado?',
        options: ['Sim', 'Não', 'Não sei o que é'] },
      { id: 'tem_pixel_meta', type: 'radio', label: 'Pixel Meta vai ser usado no site?',
        options: ['Sim, já tenho conta', 'Sim, precisa configurar', 'Não, sem mídia paga', 'Não sei'] },
      { id: 'eventos_conversao', type: 'textarea', label: 'Quais eventos / conversões devem ser rastreados?',
        hint: 'Ex: clique no WhatsApp, envio de formulário, compra, scroll 75%, tempo na página' },
      { id: 'seo_prioridade', type: 'radio', label: 'SEO orgânico é prioridade?',
        options: [
          'Sim, principal canal de aquisição',
          'Sim, complementar ao tráfego pago',
          'Não é foco — site vai receber tráfego pago',
          'Não sei ainda'
        ], required: true },
      { id: 'palavras_chave', type: 'textarea', label: 'Palavras-chave estratégicas',
        hint: 'Termos que o cliente busca no Google para te encontrar' },
      { id: 'cidades_atendimento', type: 'textarea', label: 'Cidades / regiões atendidas (SEO local)',
        hint: 'Crítico para serviços locais. Ex: Campinas, Valinhos, Vinhedo' },
      { id: 'concorrentes_seo', type: 'textarea', label: 'Concorrentes que ranqueiam bem no Google',
        hint: 'Sites que aparecem bem para os termos que você quer ranquear' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'operacional',
    title: 'Operacional & expectativas',
    desc: 'Como vamos trabalhar juntos — última etapa.',
    fields: [
      { id: 'responsavel_aprovacao', type: 'text', label: 'Responsável pela aprovação final',
        placeholder: 'Nome + cargo + WhatsApp', required: true },
      { id: 'aprovador_unico', type: 'radio', label: 'A aprovação passa por mais de uma pessoa?',
        options: ['Não, só o responsável principal', 'Sim, 2 pessoas', 'Sim, 3 ou mais (comitê)', 'Depende da etapa'] },
      { id: 'tempo_aprovacao', type: 'select', label: 'Tempo médio de aprovação que podemos contar',
        options: ['Menos de 24h', '1 a 2 dias', '3 a 5 dias', 'Mais de 1 semana'] },
      { id: 'reunioes_frequencia', type: 'select', label: 'Frequência de reuniões durante o projeto',
        options: ['Semanal', 'Quinzenal', 'Apenas marcos (kickoff / homologação / launch)', 'Sem reuniões — comunicação assíncrona'] },
      { id: 'canal_comunicacao', type: 'checkbox', label: 'Canais de comunicação preferidos',
        options: ['WhatsApp', 'E-mail', 'Slack', 'Telegram', 'Reunião online (Google Meet / Zoom)', 'Reunião presencial'] },
      { id: 'manutencao_pos_launch', type: 'radio', label: 'Vai precisar de manutenção pós-launch?',
        options: [
          'Sim, mensalidade de manutenção',
          'Sim, sob demanda (pacote de horas)',
          'Não, equipe interna assume',
          'Não sei ainda'
        ] },
      { id: 'frequencia_updates', type: 'select', label: 'Frequência prevista de atualizações pós-launch',
        options: [
          'Diária (blog ativo, e-commerce com novos produtos)',
          'Semanal',
          'Mensal',
          'Trimestral',
          'Raramente (só correções)'
        ] },
      { id: 'observacoes_extras', type: 'textarea', label: 'Algo mais que precisamos saber?',
        hint: 'Restrições legais (LGPD, ANVISA, OAB), processos especiais, contexto importante' }
    ]
  }
];

// Total de campos para cálculo de progresso
export const SITE_TOTAL_FIELDS = SITE_BRIEFING_STEPS.reduce((acc, s) => acc + s.fields.length, 0);
