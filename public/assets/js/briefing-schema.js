// =====================================================================
// Briefing — Schema de perguntas (11 blocos estratégicos)
// =====================================================================
// Cada bloco vira um "step" do formulário multi-step.
// type: text | textarea | radio | checkbox | select | number | tel | email | url
// mask: cnpj | cpfcnpj | phone | currency | percent (opcional)
// =====================================================================

export const BRIEFING_STEPS = [
  // -------------------------------------------------------------------
  {
    id: 'empresa',
    title: 'Sobre a empresa',
    desc: 'Vamos começar conhecendo o seu negócio. Quanto mais real, melhor a estratégia.',
    fields: [
      { id: 'site', type: 'url', label: 'Site oficial', placeholder: 'https://' },
      { id: 'instagram', type: 'text', label: 'Instagram', placeholder: '@perfil' },
      { id: 'tempo_mercado', type: 'select', label: 'Há quanto tempo no mercado?', options: [
        'Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'
      ]},
      { id: 'qtd_funcionarios', type: 'select', label: 'Quantos funcionários?', options: [
        'Apenas eu', '2 a 5', '6 a 20', '21 a 50', '51 a 200', 'Mais de 200'
      ]},
      { id: 'faturamento_mensal', type: 'select', label: 'Faturamento mensal médio',
        hint: 'Importante para definirmos CAC e orçamento aceitável. Sigilo total.',
        options: [
          'Até R$ 10 mil', 'R$ 10 mil a R$ 30 mil', 'R$ 30 mil a R$ 100 mil',
          'R$ 100 mil a R$ 300 mil', 'R$ 300 mil a R$ 1 milhão', 'Acima de R$ 1 milhão',
          'Prefiro não informar'
        ]
      },
      { id: 'sazonalidade', type: 'textarea', label: 'Tem sazonalidade? Quais meses são mais fortes ou mais fracos?',
        hint: 'Ex: dezembro é forte, janeiro é fraco' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'oferta',
    title: 'Produto / Serviço / Oferta',
    desc: 'O que você vende e como vende. Base de toda copy e criativo.',
    fields: [
      { id: 'oferta_principal', type: 'textarea', label: 'Qual a oferta principal que vai ser anunciada?',
        hint: 'Descreva em detalhes: o que é, para quem, qual o resultado prometido.', required: true },
      { id: 'preco', type: 'text', label: 'Preço da oferta principal', placeholder: 'R$ 0,00', mask: 'currency' },
      { id: 'ticket_medio', type: 'text', label: 'Ticket médio de venda',
        hint: 'Quanto vale uma venda fechada em média', placeholder: 'R$ 0,00', mask: 'currency', required: true },
      { id: 'margem_lucro', type: 'select', label: 'Margem de lucro estimada na oferta',
        hint: 'Define até quanto faz sentido pagar por venda',
        options: [
          'Até 10%', '10% a 25%', '25% a 50%', '50% a 75%', 'Acima de 75%', 'Não sei calcular'
        ]
      },
      { id: 'forma_pagamento', type: 'textarea', label: 'Formas de pagamento aceitas',
        hint: 'PIX, cartão (à vista/parcelado), boleto, financiamento etc.' },
      { id: 'garantia', type: 'textarea', label: 'Tem garantia? Qual?',
        hint: 'Ex: garantia de 30 dias, troca grátis, dinheiro de volta' },
      { id: 'bonus', type: 'textarea', label: 'Bônus ou itens inclusos na oferta',
        hint: 'O que vai além do produto principal' },
      { id: 'ofertas_secundarias', type: 'textarea', label: 'Tem ofertas secundárias / upsell?',
        hint: 'Outros produtos que entram no funil' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'publico',
    title: 'Público-alvo',
    desc: 'Quem é o cliente ideal? Quanto mais nichado, melhor o resultado.',
    fields: [
      { id: 'avatar_descricao', type: 'textarea', label: 'Descreva o cliente ideal em 3 a 5 frases',
        hint: 'Idade, gênero, profissão, classe social, momento de vida', required: true },
      { id: 'faixa_etaria', type: 'select', label: 'Faixa etária predominante', options: [
        '18 a 24', '25 a 34', '35 a 44', '45 a 54', '55+', 'Mistura ampla'
      ]},
      { id: 'genero_predominante', type: 'select', label: 'Gênero predominante', options: [
        'Maior parte mulheres', 'Maior parte homens', 'Equilibrado'
      ]},
      { id: 'classe_social', type: 'select', label: 'Classe social', options: [
        'A', 'B', 'C', 'D/E', 'A e B', 'B e C', 'Mistura'
      ]},
      { id: 'regiao_atendimento', type: 'textarea', label: 'Onde estão seus clientes? (cidade/estado/raio)',
        hint: 'Crítico para serviços locais. Ex: Campinas e região, raio de 50km',
        required: true },
      { id: 'dores', type: 'textarea', label: 'Quais as 3 maiores dores que seu produto/serviço resolve?',
        required: true },
      { id: 'desejos', type: 'textarea', label: 'O que esse cliente quer alcançar?',
        hint: 'O resultado/transformação desejado' },
      { id: 'objecoes', type: 'textarea', label: 'Quais objeções ele costuma ter antes de comprar?',
        hint: 'Ex: "é caro", "não confio", "vou pensar"', required: true },
      { id: 'gatilho_compra', type: 'textarea', label: 'O que faz ele finalmente comprar?',
        hint: 'Urgência, indicação, prova social, prazo, etc.' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'concorrencia',
    title: 'Concorrência',
    desc: 'Mapeamento dos principais players do seu mercado.',
    fields: [
      { id: 'concorrentes_principais', type: 'textarea', label: 'Liste seus 3 a 5 principais concorrentes',
        hint: 'Nome + site/Instagram de cada um, um por linha', required: true },
      { id: 'concorrentes_pontos_fortes', type: 'textarea', label: 'O que os concorrentes fazem bem?' },
      { id: 'concorrentes_pontos_fracos', type: 'textarea', label: 'Onde você é melhor que eles?',
        hint: 'Vamos usar isso como copy', required: true },
      { id: 'concorrentes_anuncios', type: 'radio', label: 'Eles anunciam em mídia paga?',
        options: ['Sim, ativamente', 'Sim, ocasionalmente', 'Não anunciam', 'Não sei'] },
      { id: 'diferencial_unico', type: 'textarea', label: 'Qual seu DIFERENCIAL ÚNICO em uma frase?',
        hint: 'O que ninguém mais faz igual a você', required: true }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'historico',
    title: 'Histórico de marketing',
    desc: 'O que já foi tentado para evitarmos repetir erros.',
    fields: [
      { id: 'ja_anunciou', type: 'radio', label: 'Já investiu em tráfego pago antes?',
        options: ['Sim, atualmente está rodando', 'Sim, mas não está rodando agora', 'Nunca'],
        required: true },
      { id: 'plataformas_testadas', type: 'checkbox', label: 'Quais plataformas já testou?',
        options: ['Meta Ads (Facebook/Instagram)', 'Google Ads', 'TikTok Ads', 'YouTube Ads',
                 'LinkedIn Ads', 'Pinterest Ads', 'Kwai Ads', 'Nenhuma'] },
      { id: 'investimento_anterior', type: 'text', label: 'Quanto investiu em média por mês?',
        placeholder: 'R$ 0,00', mask: 'currency' },
      { id: 'resultado_anterior', type: 'textarea', label: 'Quais resultados obteve?',
        hint: 'Leads/mês, vendas, ROAS, CPL — o que tiver de número' },
      { id: 'agencia_anterior', type: 'radio', label: 'Já trabalhou com agência ou gestor de tráfego?',
        options: ['Sim, satisfeito', 'Sim, insatisfeito', 'Sim, resultado misto', 'Não, é a primeira vez'] },
      { id: 'motivo_troca', type: 'textarea', label: 'Por que está trocando / contratando agora?',
        hint: 'Vai nos ajudar a evitar dores anteriores' },
      { id: 'que_funcionou', type: 'textarea', label: 'O que funcionou no passado?' },
      { id: 'que_nao_funcionou', type: 'textarea', label: 'O que NÃO funcionou?' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'objetivos',
    title: 'Objetivos & metas',
    desc: 'Onde queremos chegar com a estratégia.',
    fields: [
      { id: 'objetivo_principal', type: 'checkbox', label: 'Qual o objetivo principal da campanha?',
        hint: 'Pode marcar mais de uma opção',
        options: [
          'Gerar leads (contatos qualificados)',
          'Vender direto pelo site / e-commerce',
          'Agendamentos / consultas',
          'Tráfego qualificado para o site',
          'Reconhecimento de marca',
          'Mensagens no WhatsApp'
        ], required: true },
      { id: 'meta_numerica', type: 'text', label: 'Meta numérica em 90 dias',
        hint: 'Ex: 200 leads/mês, 30 vendas/mês, R$ 100k em receita', required: true },
      { id: 'cpl_aceitavel', type: 'text', label: 'CPA / CPL aceitável (custo por lead/venda)',
        hint: 'Quanto pode pagar para gerar 1 lead/venda', placeholder: 'R$ 0,00', mask: 'currency' },
      { id: 'roas_esperado', type: 'text', label: 'ROAS esperado (se vende direto)',
        hint: 'Ex: 3x significa que para cada R$1 investido, R$3 de venda' },
      { id: 'orcamento_mensal', type: 'select', label: 'Orçamento mensal disponível para mídia paga',
        hint: 'Apenas o investimento em ads, não inclui honorários',
        options: [
          'Até R$ 1.000', 'R$ 1.000 a R$ 3.000', 'R$ 3.000 a R$ 5.000',
          'R$ 5.000 a R$ 10.000', 'R$ 10.000 a R$ 30.000',
          'R$ 30.000 a R$ 100.000', 'Acima de R$ 100.000'
        ], required: true },
      { id: 'capacidade_atendimento', type: 'text', label: 'Quantos leads/dia consegue atender bem?',
        hint: 'Capacidade real da operação. Não adianta gerar mais do que aguenta', required: true },
      { id: 'prazo_resultado', type: 'select', label: 'Em quanto tempo precisa de resultado?',
        options: ['Imediato (1-2 semanas)', '1 mês', '2-3 meses', '6 meses+', 'Sem pressa'] }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'funil',
    title: 'Funil de vendas & operação',
    desc: 'Como acontece a venda hoje. Aqui descobrimos onde está o gargalo.',
    fields: [
      { id: 'jornada_compra', type: 'textarea',
        label: 'Descreva a jornada do cliente do primeiro contato até a compra',
        hint: 'Passo a passo: lead chega → o que acontece → como fecha', required: true },
      { id: 'tempo_fechamento', type: 'select', label: 'Tempo médio entre primeiro contato e fechamento',
        options: ['Mesmo dia', '1 a 3 dias', '1 semana', '2 a 4 semanas',
                 '1 a 3 meses', 'Mais de 3 meses'] },
      { id: 'taxa_conversao', type: 'text', label: 'Taxa de conversão de lead em venda',
        hint: 'A cada 100 leads, quantos viram cliente?', placeholder: '0%', mask: 'percent' },
      { id: 'gargalo_atual', type: 'textarea', label: 'Onde está o maior gargalo hoje?',
        hint: 'Falta lead? Lead ruim? Conversão baixa? Demora? Atendimento?' },
      { id: 'canal_atendimento', type: 'checkbox', label: 'Como atende leads recebidos?',
        options: ['WhatsApp', 'Ligação', 'E-mail', 'Visita presencial',
                 'Loja física', 'Site / e-commerce', 'Reunião online'] },
      { id: 'time_comercial', type: 'select', label: 'Quantas pessoas no time comercial?',
        options: ['Só eu / dono', '1 vendedor', '2 a 3 vendedores', '4 a 10', 'Mais de 10'] },
      { id: 'crm', type: 'text', label: 'Usa CRM? Qual?',
        placeholder: 'Ex: RD Station, HubSpot, Pipedrive, planilha, nenhum' },
      { id: 'horario_atendimento', type: 'text', label: 'Horário de atendimento',
        placeholder: 'Ex: Seg-Sex 8h-18h, Sáb 9h-13h' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'marca',
    title: 'Marca & posicionamento',
    desc: 'Identidade e tom de voz que vamos respeitar nos criativos.',
    fields: [
      { id: 'tom_voz', type: 'checkbox', label: 'Como sua marca se comunica?',
        options: ['Profissional / formal', 'Próxima / amigável', 'Divertida / descontraída',
                 'Técnica / educativa', 'Sofisticada / premium', 'Direta / sem rodeios',
                 'Inspiracional / motivacional'] },
      { id: 'tem_brandbook', type: 'radio', label: 'Tem brandbook ou manual de marca?',
        options: ['Sim, completo', 'Sim, parcial', 'Não, mas tem cores/fontes definidas', 'Não tem nada'] },
      { id: 'brandbook_tipo', type: 'radio', label: 'Como vai compartilhar o brandbook?',
        options: ['Link do Drive', 'Upload de arquivo'],
        showIf: { field: 'tem_brandbook', in: ['Sim, completo', 'Sim, parcial'] } },
      { id: 'brandbook_link', type: 'url', label: 'Link do Drive com o brandbook',
        placeholder: 'https://drive.google.com/...',
        showIf: { field: 'brandbook_tipo', equals: 'Link do Drive' } },
      { id: 'brandbook_arquivos', type: 'file', label: 'Upload do brandbook',
        hint: 'Até 10 arquivos (PDF, imagem ou Word). Máximo 10MB cada.',
        multiple: true, maxFiles: 10,
        accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
        showIf: { field: 'brandbook_tipo', equals: 'Upload de arquivo' } },
      { id: 'palavras_proibidas', type: 'textarea',
        label: 'Tem palavras ou abordagens proibidas?',
        hint: 'O que NÃO podemos dizer ou fazer nos anúncios' },
      { id: 'referencias_marca', type: 'textarea',
        label: 'Marcas que admira ou se inspira',
        hint: 'Pode ser do seu mercado ou não' }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'criativos',
    title: 'Ativos criativos',
    desc: 'O que já existe e o que precisa ser produzido.',
    fields: [
      { id: 'tem_fotos', type: 'radio', label: 'Tem fotos profissionais do produto/serviço/equipe?',
        options: ['Sim, vasto banco', 'Sim, algumas', 'Não, só celular', 'Não tem nada'] },
      { id: 'tem_videos', type: 'radio', label: 'Tem vídeos prontos?',
        options: ['Sim, vários', 'Sim, alguns', 'Não, mas posso gravar com celular', 'Não'] },
      { id: 'depoimentos', type: 'radio', label: 'Tem depoimentos de clientes / cases reais?',
        options: ['Sim, em vídeo + texto', 'Sim, só em texto/print', 'Não'] },
      { id: 'pode_aparecer', type: 'radio', label: 'Você (ou alguém da equipe) pode aparecer em vídeos?',
        options: ['Sim, sem problema', 'Sim, mas com produção mais simples', 'Não'] },
      { id: 'drive_materiais', type: 'url', label: 'Link do Drive com materiais (fotos/vídeos/logo)',
        placeholder: 'https://drive.google.com/...' },
      { id: 'aprovador_criativos', type: 'text', label: 'Quem aprova criativos antes de publicar?',
        placeholder: 'Nome + cargo' },
      { id: 'tempo_aprovacao', type: 'select', label: 'Quanto tempo de aprovação podemos esperar?',
        options: ['Menos de 24h', '1 a 2 dias', '3 a 5 dias', 'Mais de 1 semana'] }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'tracking',
    title: 'Tracking & acessos técnicos',
    desc: 'Sem isso, a campanha sobe sem dados — e a gente não pode otimizar no escuro.',
    fields: [
      { id: 'tem_bm_meta', type: 'radio', label: 'Tem Business Manager (Meta)?',
        options: ['Sim e tenho acesso', 'Sim mas não tenho acesso', 'Não tenho', 'Não sei'] },
      { id: 'tem_google_ads', type: 'radio', label: 'Tem conta Google Ads?',
        options: ['Sim e tenho acesso', 'Sim mas não tenho acesso', 'Não tenho', 'Não sei'] },
      { id: 'tem_ga4', type: 'radio', label: 'GA4 instalado?',
        options: ['Sim, configurado', 'Sim, mas sem certeza se funciona', 'Não', 'Não sei'] },
      { id: 'tem_gtm', type: 'radio', label: 'Google Tag Manager instalado?',
        options: ['Sim, com acesso', 'Sim, sem acesso', 'Não', 'Não sei'] },
      { id: 'tem_pixel_meta', type: 'radio', label: 'Pixel Meta instalado e disparando eventos?',
        options: ['Sim, eventos OK', 'Sim, mas sem certeza dos eventos', 'Não', 'Não sei'] },
      { id: 'pode_dar_acesso', type: 'radio', label: 'Pode dar acesso aos gerenciadores para nossa BM/MCC?',
        options: ['Sim, na hora', 'Sim, com algumas semanas', 'Não, prefere conta nossa', 'Não sei'], required: true },
      { id: 'site_dominio', type: 'url', label: 'Domínio principal do site',
        placeholder: 'https://...' },
      { id: 'cms', type: 'text', label: 'Plataforma do site',
        placeholder: 'Ex: WordPress, Wix, Shopify, próprio, etc.' },
      { id: 'tem_landing_page', type: 'radio', label: 'Tem landing page específica para campanhas?',
        options: ['Sim, várias', 'Sim, uma genérica', 'Não, usamos a home', 'Precisa criar', 'Não sei'] },
      { id: 'tem_whatsapp', type: 'tel', label: 'Número de WhatsApp para receber leads',
        placeholder: '(00) 00000-0000', mask: 'phone' },
      { id: 'whatsapp_business', type: 'radio', label: 'É WhatsApp Business?',
        options: ['Sim, com API oficial', 'Sim, app comum', 'Não, é WhatsApp pessoal', 'Não sei'] }
    ]
  },

  // -------------------------------------------------------------------
  {
    id: 'operacional',
    title: 'Operacional & expectativas',
    desc: 'Última etapa: como vamos trabalhar juntos.',
    fields: [
      { id: 'responsavel_aprovacao', type: 'text', label: 'Responsável pela aprovação final',
        placeholder: 'Nome + cargo + WhatsApp', required: true },
      { id: 'reunioes_frequencia', type: 'select', label: 'Frequência de reuniões desejada',
        options: ['Semanal', 'Quinzenal', 'Mensal', 'Sob demanda', 'Sem reuniões — só relatórios'] },
      { id: 'canal_comunicacao', type: 'checkbox', label: 'Canais de comunicação preferidos',
        options: ['WhatsApp', 'E-mail', 'Slack', 'Telegram', 'Reunião presencial', 'Reunião online'] },
      { id: 'comeca_quando', type: 'select', label: 'Quando precisa começar?',
        options: ['Imediato', 'Esta semana', 'Próximas 2 semanas', 'Próximo mês', 'Sem pressa'] },
      { id: 'observacoes_extras', type: 'textarea', label: 'Algo mais que precisamos saber?',
        hint: 'Restrições legais, processos especiais, contexto adicional' }
    ]
  }
];

// Total de campos para cálculo de progresso
export const TOTAL_FIELDS = BRIEFING_STEPS.reduce((acc, s) => acc + s.fields.length, 0);

// Decide se um campo condicional deve ser exibido com base nas respostas atuais.
// Suporta: showIf: { field: 'X', equals: 'Y' } | { field: 'X', in: ['Y','Z'] }
export function shouldShowField(field, answers) {
  if (!field.showIf) return true;
  const target = answers?.[field.showIf.field];
  if (field.showIf.equals !== undefined) {
    if (Array.isArray(target)) return target.includes(field.showIf.equals);
    return target === field.showIf.equals;
  }
  if (field.showIf.in) {
    if (Array.isArray(target)) return target.some(v => field.showIf.in.includes(v));
    return field.showIf.in.includes(target);
  }
  return true;
}

// Conta campos visíveis (respeitando showIf) — base do cálculo de progresso
export function countVisibleFields(answers) {
  let total = 0;
  for (const step of BRIEFING_STEPS) {
    for (const f of step.fields) {
      if (shouldShowField(f, answers)) total++;
    }
  }
  return total;
}

export function calculateProgress(answers) {
  const visible = countVisibleFields(answers);
  if (visible === 0) return 0;
  let filled = 0;
  for (const step of BRIEFING_STEPS) {
    for (const f of step.fields) {
      if (!shouldShowField(f, answers)) continue;
      const v = answers?.[f.id];
      if (v == null || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      filled++;
    }
  }
  return Math.min(99, Math.round((filled / visible) * 100));
}

export function findStepByFieldId(fieldId) {
  for (const step of BRIEFING_STEPS) {
    if (step.fields.some(f => f.id === fieldId)) return step;
  }
  return null;
}

export function getFieldDef(fieldId) {
  for (const step of BRIEFING_STEPS) {
    const f = step.fields.find(x => x.id === fieldId);
    if (f) return f;
  }
  return null;
}
