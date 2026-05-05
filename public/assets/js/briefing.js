// =====================================================================
// Briefing — Lógica do formulário multi-step
// =====================================================================

import {
  getBriefingBySlug,
  saveBriefingDraft,
  submitBriefing
} from './supabase.js';
import { BRIEFING_STEPS, calculateProgress } from './briefing-schema.js';
import { $, debounce, escapeHtml, getQueryParam, toast } from './utils.js';
import { applyMask, maskValue } from './masks.js';

const slug = getQueryParam('c') || getQueryParam('slug');
const state = {
  slug,
  clientName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  answers: {},
  currentStep: 0,
  isSubmitting: false
};

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
async function boot() {
  if (!slug) {
    showError('Link inválido. Solicite um novo link à equipe DocAds.');
    return;
  }

  try {
    const data = await getBriefingBySlug(slug);
    if (data?.error) {
      showError(data.error === 'link_expired'
        ? 'Este link expirou. Solicite um novo link à equipe DocAds.'
        : 'Link inválido ou já utilizado. Entre em contato com a DocAds.');
      return;
    }

    state.clientName = data.client.company_name;
    state.contactName = data.client.contact_name || '';
    state.contactEmail = data.client.contact_email || '';
    state.contactPhone = data.client.contact_phone || '';

    // Pré-preenche
    if (state.contactName) state.answers.contato_nome = state.contactName;
    if (state.contactEmail) state.answers.contato_email = state.contactEmail;
    if (state.contactPhone) state.answers.contato_telefone = state.contactPhone;

    if (data.briefing) {
      if (data.briefing.status === 'submitted') {
        showAlreadySubmitted();
        return;
      }
      state.answers = { ...state.answers, ...(data.briefing.answers || {}) };
      state.currentStep = Math.min(data.briefing.current_step || 0, BRIEFING_STEPS.length - 1);
    }

    render();
  } catch (e) {
    console.error(e);
    showError('Erro ao carregar o briefing. Recarregue a página ou contate a DocAds.');
  }
}

// ---------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------
function render() {
  const root = $('#briefing-root');
  const isWelcome = state.currentStep === -1;
  const step = BRIEFING_STEPS[state.currentStep];
  const progress = calculateProgress(state.answers);

  root.innerHTML = `
    <div class="briefing-shell">
      <div class="briefing-hero">
        <div class="briefing-hero-content">
          <img src="/assets/img/logo.png" alt="DocAds">
          <span class="badge">Briefing estratégico</span>
          <h1>Olá, ${escapeHtml(state.clientName)} 👋</h1>
          <p class="lede">Esse formulário é a base de toda a estratégia que vamos construir para o seu negócio. Quanto mais real e detalhado, melhor o resultado. Tempo médio: <strong>15 a 20 minutos</strong>. Suas respostas são salvas automaticamente.</p>
        </div>
      </div>

      <div class="progress-shell">
        <div class="progress-inner">
          <div class="progress-track"><div class="progress-fill" style="width: ${progress}%"></div></div>
          <span class="progress-text">${progress}% • Etapa ${state.currentStep + 1} de ${BRIEFING_STEPS.length}</span>
          <span class="progress-saving" id="saving-indicator" style="opacity:0">✓ salvo</span>
        </div>
      </div>

      <div class="briefing-content">
        <div class="step-card">
          <div class="stepper">
            ${BRIEFING_STEPS.map((_, i) => `
              <div class="stepper-dot ${i < state.currentStep ? 'done' : ''} ${i === state.currentStep ? 'current' : ''}"></div>
            `).join('')}
          </div>

          <div class="step-number">Etapa ${state.currentStep + 1} • ${escapeHtml(step.id)}</div>
          <h2 class="step-title">${escapeHtml(step.title)}</h2>
          <p class="step-desc">${escapeHtml(step.desc)}</p>

          <div class="step-body">
            ${step.fields.map(f => renderField(f, state.answers[f.id])).join('')}
          </div>

          <div class="step-actions">
            <button class="btn btn-ghost" id="btn-back" ${state.currentStep === 0 ? 'disabled' : ''}>← Voltar</button>
            ${state.currentStep === BRIEFING_STEPS.length - 1
              ? `<button class="btn btn-gradient btn-lg" id="btn-submit">Enviar briefing →</button>`
              : `<button class="btn btn-primary" id="btn-next">Continuar →</button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  attachListeners(step);
}

function renderField(f, value) {
  const id = `f-${f.id}`;
  const labelClass = f.required ? 'field-label field-required' : 'field-label';
  const hint = f.hint ? `<div class="field-hint">${escapeHtml(f.hint)}</div>` : '';

  if (f.type === 'textarea') {
    return `
      <div class="field" data-field="${f.id}">
        <label class="${labelClass}" for="${id}">${escapeHtml(f.label)}</label>
        ${hint}
        <textarea class="textarea" id="${id}" data-id="${f.id}" placeholder="${escapeHtml(f.placeholder || '')}">${escapeHtml(value || '')}</textarea>
      </div>
    `;
  }

  if (f.type === 'select') {
    return `
      <div class="field" data-field="${f.id}">
        <label class="${labelClass}" for="${id}">${escapeHtml(f.label)}</label>
        ${hint}
        <select class="select" id="${id}" data-id="${f.id}">
          <option value="">Selecione...</option>
          ${f.options.map(o => `<option value="${escapeHtml(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (f.type === 'radio') {
    return `
      <div class="field" data-field="${f.id}">
        <label class="${labelClass}">${escapeHtml(f.label)}</label>
        ${hint}
        <div class="radio-group">
          ${f.options.map((o, i) => `
            <label class="radio">
              <input type="radio" name="${f.id}" data-id="${f.id}" value="${escapeHtml(o)}" ${value === o ? 'checked' : ''}>
              <span class="radio-label">${escapeHtml(o)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (f.type === 'checkbox') {
    const arr = Array.isArray(value) ? value : [];
    return `
      <div class="field" data-field="${f.id}">
        <label class="${labelClass}">${escapeHtml(f.label)}</label>
        ${hint}
        <div class="checkbox-group">
          ${f.options.map(o => `
            <label class="checkbox">
              <input type="checkbox" data-id="${f.id}" value="${escapeHtml(o)}" ${arr.includes(o) ? 'checked' : ''}>
              <span class="checkbox-label">${escapeHtml(o)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  // text/email/tel/url/number
  const inputType = f.type === 'number' ? 'number' : f.type;
  const displayValue = f.mask ? maskValue(value, f.mask) : (value || '');
  const maskAttr = f.mask ? ` data-mask="${escapeHtml(f.mask)}" inputmode="${f.mask === 'currency' || f.mask === 'percent' || f.mask === 'cnpj' || f.mask === 'phone' ? 'numeric' : 'text'}"` : '';
  return `
    <div class="field" data-field="${f.id}">
      <label class="${labelClass}" for="${id}">${escapeHtml(f.label)}</label>
      ${hint}
      <input class="input" type="${inputType}" id="${id}" data-id="${f.id}"
        value="${escapeHtml(displayValue)}"
        placeholder="${escapeHtml(f.placeholder || '')}"${maskAttr}>
    </div>
  `;
}

// ---------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------
function attachListeners(step) {
  const root = $('#briefing-root');

  // inputs (text/textarea/select) — aplica máscara se houver
  root.querySelectorAll('input[type=text], input[type=email], input[type=tel], input[type=url], input[type=number], textarea, select').forEach(el => {
    el.addEventListener('input', () => {
      const mask = el.dataset.mask;
      if (mask) applyMask(el, mask);
      state.answers[el.dataset.id] = el.value;
      autoSave();
    });
  });

  // radio
  root.querySelectorAll('input[type=radio]').forEach(el => {
    el.addEventListener('change', () => {
      state.answers[el.dataset.id] = el.value;
      autoSave();
    });
  });

  // checkbox
  root.querySelectorAll('input[type=checkbox]').forEach(el => {
    el.addEventListener('change', () => {
      const id = el.dataset.id;
      const arr = Array.isArray(state.answers[id]) ? state.answers[id] : [];
      const val = el.value;
      if (el.checked && !arr.includes(val)) arr.push(val);
      else if (!el.checked) {
        const i = arr.indexOf(val);
        if (i >= 0) arr.splice(i, 1);
      }
      state.answers[id] = arr;
      autoSave();
    });
  });

  $('#btn-back')?.addEventListener('click', () => {
    if (state.currentStep > 0) {
      state.currentStep--;
      saveImmediately();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $('#btn-next')?.addEventListener('click', () => {
    if (!validateStep(step)) return;
    state.currentStep++;
    saveImmediately();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#btn-submit')?.addEventListener('click', async () => {
    if (!validateStep(step)) return;
    if (state.isSubmitting) return;
    state.isSubmitting = true;
    const btn = $('#btn-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      await submitBriefing(slug, state.answers);
      window.location.href = `/obrigado.html?c=${encodeURIComponent(state.clientName)}`;
    } catch (e) {
      console.error(e);
      toast('Erro ao enviar. Tente novamente em instantes.', 'error');
      btn.disabled = false;
      btn.textContent = 'Enviar briefing →';
      state.isSubmitting = false;
    }
  });
}

function validateStep(step) {
  let firstError = null;
  for (const f of step.fields) {
    const v = state.answers[f.id];
    const isEmpty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (f.required && isEmpty) {
      const fieldEl = document.querySelector(`[data-field="${f.id}"]`);
      if (fieldEl && !firstError) firstError = fieldEl;
      const existingError = fieldEl?.querySelector('.field-error');
      if (existingError) existingError.remove();
      if (fieldEl) {
        const err = document.createElement('div');
        err.className = 'field-error';
        err.textContent = 'Esse campo é obrigatório.';
        fieldEl.appendChild(err);
      }
    }
  }
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Preencha os campos obrigatórios.', 'warning');
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// Auto-save
// ---------------------------------------------------------------------
const autoSave = debounce(saveImmediately, 1200);

async function saveImmediately() {
  try {
    const indicator = $('#saving-indicator');
    if (indicator) indicator.style.opacity = '0.5';

    const progress = calculateProgress(state.answers);
    const progressEl = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}% • Etapa ${state.currentStep + 1} de ${BRIEFING_STEPS.length}`;

    await saveBriefingDraft(slug, state.answers, progress, state.currentStep);

    if (indicator) {
      indicator.style.opacity = '1';
      setTimeout(() => {
        if (indicator) indicator.style.opacity = '0';
      }, 1500);
    }
  } catch (e) {
    console.error('save_failed', e);
  }
}

// ---------------------------------------------------------------------
// Telas alternativas
// ---------------------------------------------------------------------
function showError(message) {
  $('#briefing-root').innerHTML = `
    <div class="briefing-shell">
      <div class="briefing-hero">
        <div class="briefing-hero-content">
          <img src="/assets/img/logo.png" alt="DocAds">
          <h1>Ops!</h1>
          <p class="lede">${escapeHtml(message)}</p>
        </div>
      </div>
    </div>
  `;
}

function showAlreadySubmitted() {
  $('#briefing-root').innerHTML = `
    <div class="briefing-shell">
      <div class="briefing-hero">
        <div class="briefing-hero-content">
          <img src="/assets/img/logo.png" alt="DocAds">
          <h1>Briefing já enviado ✓</h1>
          <p class="lede">Obrigado, ${escapeHtml(state.clientName)}! Suas respostas já foram recebidas pela equipe DocAds. Em breve entraremos em contato com sua estratégia.</p>
        </div>
      </div>
    </div>
  `;
}

boot();
