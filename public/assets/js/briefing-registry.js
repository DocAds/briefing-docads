// =====================================================================
// Registry de schemas — resolve briefing_type → steps + metadados
// =====================================================================
// Centraliza a logica generica (showIf, progress, lookup) e mantem os
// schemas isolados em arquivos proprios.
// =====================================================================

import { BRIEFING_STEPS as TRAFEGO_STEPS } from './briefing-schema.js';
import { SITE_BRIEFING_STEPS } from './briefing-site-schema.js';

export const VALID_TYPES = ['trafego', 'site'];

export const TYPE_META = {
  trafego: {
    label: 'Tráfego',
    short: 'Tráfego pago',
    icon: 'lucide:target',
    emoji: '🎯',
    badge: 'Briefing de tráfego',
    heroTitle: (name) => `Olá, ${name} 👋`,
    heroLede: 'Esse briefing é a base de toda a estratégia de tráfego pago que vamos construir para o seu negócio. Quanto mais real e detalhado, melhor o resultado. Tempo médio: <strong>15 a 20 minutos</strong>. Suas respostas são salvas automaticamente.'
  },
  site: {
    label: 'Site',
    short: 'Desenvolvimento de site',
    icon: 'lucide:layout-template',
    emoji: '💻',
    badge: 'Briefing de site',
    heroTitle: (name) => `Olá, ${name} 👋`,
    heroLede: 'Esse briefing vai guiar todo o desenvolvimento do seu site — da estrutura ao design, passando por funcionalidades, integrações e SEO. Quanto mais detalhado, mais alinhada será a entrega. Tempo médio: <strong>20 a 25 minutos</strong>. Suas respostas são salvas automaticamente.'
  }
};

const SCHEMAS = {
  trafego: TRAFEGO_STEPS,
  site: SITE_BRIEFING_STEPS
};

export function getSchema(type) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`tipo de briefing invalido: ${type}`);
  }
  return SCHEMAS[type];
}

export function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.trafego;
}

// ---------------------------------------------------------------------
// Helpers genericos (recebem steps por parametro)
// ---------------------------------------------------------------------
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

export function countVisibleFields(steps, answers) {
  let total = 0;
  for (const step of steps) {
    for (const f of step.fields) {
      if (shouldShowField(f, answers)) total++;
    }
  }
  return total;
}

export function calculateProgress(steps, answers) {
  const visible = countVisibleFields(steps, answers);
  if (visible === 0) return 0;
  let filled = 0;
  for (const step of steps) {
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

export function findStepByFieldId(steps, fieldId) {
  for (const step of steps) {
    if (step.fields.some(f => f.id === fieldId)) return step;
  }
  return null;
}

export function getFieldDef(steps, fieldId) {
  for (const step of steps) {
    const f = step.fields.find(x => x.id === fieldId);
    if (f) return f;
  }
  return null;
}

export function anyFieldDependsOn(steps, fieldId) {
  for (const step of steps) {
    for (const f of step.fields) {
      if (f.showIf?.field === fieldId) return true;
    }
  }
  return false;
}
