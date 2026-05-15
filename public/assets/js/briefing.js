// =====================================================================
// Briefing — Lógica do formulário multi-step (multi-tipo: trafego/site)
// =====================================================================

import {
  getBriefingBySlug,
  saveBriefingDraft,
  submitBriefing,
  uploadBriefingFile
} from './supabase.js';
import {
  getSchema,
  getTypeMeta,
  calculateProgress,
  shouldShowField,
  anyFieldDependsOn
} from './briefing-registry.js';
import { $, debounce, escapeHtml, getQueryParam, toast } from './utils.js';
import { applyMask, maskValue } from './masks.js';

function extractSlugFromPath() {
  const m = window.location.pathname.match(/\/b\/([a-z0-9-]+)\/?$/i);
  return m ? m[1] : null;
}
const slug = getQueryParam('c') || getQueryParam('slug') || extractSlugFromPath();

const state = {
  slug,
  briefingType: 'trafego',
  steps: null,
  meta: null,
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

    state.briefingType = data.briefing_type || 'trafego';
    try {
      state.steps = getSchema(state.briefingType);
    } catch (e) {
      showError('Tipo de briefing não suportado. Contate a DocAds.');
      return;
    }
    state.meta = getTypeMeta(state.briefingType);

    state.clientName = data.client.company_name;
    state.contactName = data.client.contact_name || '';
    state.contactEmail = data.client.contact_email || '';
    state.contactPhone = data.client.contact_phone || '';

    if (state.contactName) state.answers.contato_nome = state.contactName;
    if (state.contactEmail) state.answers.contato_email = state.contactEmail;
    if (state.contactPhone) state.answers.contato_telefone = state.contactPhone;

    if (data.briefing) {
      if (data.briefing.status === 'submitted') {
        showAlreadySubmitted();
        return;
      }
      state.answers = { ...state.answers, ...(data.briefing.answers || {}) };
      state.currentStep = Math.min(data.briefing.current_step || 0, state.steps.length - 1);
    }

    const stepParam = getQueryParam('step');
    if (stepParam != null && stepParam !== '') {
      const n = parseInt(stepParam, 10);
      if (!isNaN(n)) {
        state.currentStep = Math.max(0, Math.min(n, state.steps.length - 1));
      }
    }

    document.title = `${state.meta.label} — ${state.clientName} | DocAds`;
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
  const step = state.steps[state.currentStep];
  const progress = calculateProgress(state.steps, state.answers);
  const meta = state.meta;

  root.innerHTML = `
    <div class="briefing-shell">
      <div class="briefing-hero">
        <div class="briefing-hero-content">
          <img src="/assets/img/logo.png" alt="DocAds">
          <span class="badge">${escapeHtml(meta.badge)}</span>
          <h1>${meta.heroTitle(escapeHtml(state.clientName))}</h1>
          <p class="lede">${meta.heroLede}</p>
        </div>
      </div>

      <div class="progress-shell">
        <div class="progress-inner">
          <div class="progress-track"><div class="progress-fill" style="width: ${progress}%"></div></div>
          <span class="progress-text">${progress}% • Etapa ${state.currentStep + 1} de ${state.steps.length}</span>
          <span class="progress-saving" id="saving-indicator" style="opacity:0">✓ salvo</span>
        </div>
      </div>

      <div class="briefing-content">
        <div class="step-card">
          <div class="stepper">
            ${state.steps.map((_, i) => `
              <div class="stepper-dot ${i < state.currentStep ? 'done' : ''} ${i === state.currentStep ? 'current' : ''}"></div>
            `).join('')}
          </div>

          <div class="step-number">Etapa ${state.currentStep + 1} • ${escapeHtml(step.id)}</div>
          <h2 class="step-title">${escapeHtml(step.title)}</h2>
          <p class="step-desc">${escapeHtml(step.desc)}</p>

          <div class="step-body">
            ${step.fields.filter(f => shouldShowField(f, state.answers)).map(f => renderField(f, state.answers[f.id])).join('')}
          </div>

          <div class="step-actions">
            <button class="btn btn-ghost" id="btn-back" ${state.currentStep === 0 ? 'disabled' : ''}>← Voltar</button>
            ${state.currentStep === state.steps.length - 1
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
          ${f.options.map(o => `
            <label class="radio">
              <input type="radio" name="${f.id}" data-id="${f.id}" value="${escapeHtml(o)}" ${value === o ? 'checked' : ''}>
              <span class="radio-label">${escapeHtml(o)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (f.type === 'file') {
    const files = Array.isArray(value) ? value : [];
    const max = f.maxFiles || 10;
    const remaining = Math.max(0, max - files.length);
    return `
      <div class="field" data-field="${f.id}">
        <label class="${labelClass}">${escapeHtml(f.label)}</label>
        ${hint}
        <div class="file-list" id="file-list-${f.id}">
          ${files.map((file, i) => `
            <div class="file-item">
              <div class="file-info">
                <div class="file-icon">📄</div>
                <div>
                  <a href="${escapeHtml(file.url)}" target="_blank" class="file-name">${escapeHtml(file.name)}</a>
                  <div class="file-meta">${formatBytes(file.size)}</div>
                </div>
              </div>
              <button type="button" class="btn-remove-file" data-field-id="${f.id}" data-index="${i}" aria-label="Remover">×</button>
            </div>
          `).join('')}
        </div>
        ${remaining > 0 ? `
          <label class="file-add">
            <input type="file" data-id="${f.id}" data-max="${max}"
              ${f.multiple ? 'multiple' : ''}
              ${f.accept ? `accept="${escapeHtml(f.accept)}"` : ''}
              style="display:none;">
            <span>+ Adicionar arquivo${f.multiple ? 's' : ''}</span>
            <span class="file-add-hint">${remaining} de ${max} restantes</span>
          </label>
        ` : '<div class="text-sm text-muted" style="margin-top:8px;">Limite atingido. Remova um arquivo para enviar outro.</div>'}
        <div class="file-progress" id="file-progress-${f.id}" style="display:none;"></div>
      </div>
    `;
  }

  if (f.type === 'repeater') {
    const items = Array.isArray(value) ? value : [];
    const itemLabel = f.itemLabel || 'Item';
    const addLabel = f.addLabel || '+ Adicionar item';
    return `
      <div class="field" data-field="${f.id}">
        <label class="${labelClass}">${escapeHtml(f.label)}</label>
        ${hint}
        <div class="repeater-list" data-repeater="${f.id}">
          ${items.map((item, idx) => renderRepeaterItem(f, item, idx, itemLabel)).join('')}
        </div>
        <button type="button" class="repeater-add" data-repeater-add="${f.id}">
          <span>${escapeHtml(addLabel)}</span>
        </button>
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

function renderRepeaterItem(f, item, idx, itemLabel) {
  const safe = item && typeof item === 'object' ? item : {};
  return `
    <div class="repeater-item" data-repeater-id="${f.id}" data-repeater-idx="${idx}">
      <div class="repeater-item-head">
        <span class="repeater-item-title">${escapeHtml(itemLabel)} ${idx + 1}</span>
        <button type="button" class="repeater-remove" data-repeater-remove="${f.id}" data-index="${idx}" aria-label="Remover">×</button>
      </div>
      <div class="repeater-item-body">
        ${f.fields.map(sub => renderRepeaterSubField(f.id, idx, sub, safe[sub.id])).join('')}
      </div>
    </div>
  `;
}

function renderRepeaterSubField(repeaterId, idx, sub, value) {
  const id = `r-${repeaterId}-${idx}-${sub.id}`;
  const labelClass = sub.required ? 'field-label field-required' : 'field-label';
  const labelHtml = `<label class="${labelClass}" for="${id}">${escapeHtml(sub.label)}</label>`;
  const placeholder = escapeHtml(sub.placeholder || '');
  const v = value == null ? '' : String(value);

  if (sub.type === 'textarea') {
    return `
      <div class="repeater-subfield">
        ${labelHtml}
        <textarea class="textarea" id="${id}"
          data-repeater-input="${repeaterId}" data-index="${idx}" data-sub="${sub.id}"
          placeholder="${placeholder}">${escapeHtml(v)}</textarea>
      </div>
    `;
  }

  return `
    <div class="repeater-subfield">
      ${labelHtml}
      <input class="input" type="text" id="${id}"
        data-repeater-input="${repeaterId}" data-index="${idx}" data-sub="${sub.id}"
        value="${escapeHtml(v)}" placeholder="${placeholder}">
    </div>
  `;
}

// ---------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------
function attachListeners(step) {
  const root = $('#briefing-root');

  root.querySelectorAll('input[type=text], input[type=email], input[type=tel], input[type=url], input[type=number], textarea, select').forEach(el => {
    el.addEventListener('input', () => {
      const mask = el.dataset.mask;
      if (mask) applyMask(el, mask);
      state.answers[el.dataset.id] = el.value;
      autoSave();
    });
  });

  root.querySelectorAll('input[type=radio]').forEach(el => {
    el.addEventListener('change', () => {
      state.answers[el.dataset.id] = el.value;
      autoSave();
      if (anyFieldDependsOn(state.steps, el.dataset.id)) {
        clearOrphanAnswers();
        render();
      }
    });
  });

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
      if (anyFieldDependsOn(state.steps, id)) render();
    });
  });

  root.querySelectorAll('input[type=file]').forEach(el => {
    el.addEventListener('change', async (e) => {
      const fieldId = el.dataset.id;
      const max = parseInt(el.dataset.max || '10', 10);
      const current = Array.isArray(state.answers[fieldId]) ? state.answers[fieldId] : [];
      const files = [...e.target.files];
      const slots = max - current.length;
      if (files.length > slots) {
        toast(`Você só pode enviar mais ${slots} arquivo(s).`, 'warning');
        files.splice(slots);
      }

      const progressEl = $(`#file-progress-${fieldId}`);
      const newFiles = [...current];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast(`"${file.name}" excede 10MB e foi pulado.`, 'error');
          continue;
        }
        if (progressEl) {
          progressEl.style.display = 'block';
          progressEl.textContent = `Enviando ${i + 1} de ${files.length}: ${file.name}...`;
        }
        try {
          const uploaded = await uploadBriefingFile(slug, file);
          newFiles.push(uploaded);
        } catch (err) {
          console.error(err);
          toast(`Erro ao enviar "${file.name}": ${err.message || 'falha de rede'}`, 'error');
        }
      }

      if (progressEl) progressEl.style.display = 'none';
      state.answers[fieldId] = newFiles;
      saveImmediately();
      render();
    });
  });

  root.querySelectorAll('.btn-remove-file').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldId = btn.dataset.fieldId;
      const idx = parseInt(btn.dataset.index, 10);
      const arr = Array.isArray(state.answers[fieldId]) ? [...state.answers[fieldId]] : [];
      arr.splice(idx, 1);
      state.answers[fieldId] = arr;
      saveImmediately();
      render();
    });
  });

  root.querySelectorAll('[data-repeater-input]').forEach(el => {
    el.addEventListener('input', () => {
      const fid = el.dataset.repeaterInput;
      const idx = parseInt(el.dataset.index, 10);
      const sub = el.dataset.sub;
      const arr = Array.isArray(state.answers[fid]) ? [...state.answers[fid]] : [];
      while (arr.length <= idx) arr.push({});
      arr[idx] = { ...(arr[idx] || {}), [sub]: el.value };
      state.answers[fid] = arr;
      autoSave();
    });
  });

  root.querySelectorAll('[data-repeater-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fid = btn.dataset.repeaterAdd;
      const arr = Array.isArray(state.answers[fid]) ? [...state.answers[fid]] : [];
      arr.push({});
      state.answers[fid] = arr;
      saveImmediately();
      render();
      requestAnimationFrame(() => {
        const newItems = document.querySelectorAll(`[data-repeater-id="${fid}"]`);
        const last = newItems[newItems.length - 1];
        if (last) {
          last.scrollIntoView({ behavior: 'smooth', block: 'center' });
          last.querySelector('input, textarea')?.focus();
        }
      });
    });
  });

  root.querySelectorAll('[data-repeater-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fid = btn.dataset.repeaterRemove;
      const idx = parseInt(btn.dataset.index, 10);
      const arr = Array.isArray(state.answers[fid]) ? [...state.answers[fid]] : [];
      arr.splice(idx, 1);
      state.answers[fid] = arr;
      saveImmediately();
      render();
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
      const params = new URLSearchParams({
        c: state.clientName,
        t: state.briefingType
      });
      window.location.href = `/obrigado.html?${params.toString()}`;
    } catch (e) {
      console.error(e);
      toast('Erro ao enviar. Tente novamente em instantes.', 'error');
      btn.disabled = false;
      btn.textContent = 'Enviar briefing →';
      state.isSubmitting = false;
    }
  });
}

function clearOrphanAnswers() {
  for (const step of state.steps) {
    for (const f of step.fields) {
      if (f.showIf && !shouldShowField(f, state.answers)) {
        delete state.answers[f.id];
      }
    }
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function validateStep(step) {
  let firstError = null;
  const setError = (fieldEl, msg) => {
    if (!fieldEl) return;
    if (!firstError) firstError = fieldEl;
    fieldEl.querySelector(':scope > .field-error')?.remove();
    const err = document.createElement('div');
    err.className = 'field-error';
    err.textContent = msg;
    fieldEl.appendChild(err);
  };

  for (const f of step.fields) {
    if (!shouldShowField(f, state.answers)) continue;
    const v = state.answers[f.id];
    const fieldEl = document.querySelector(`[data-field="${f.id}"]`);

    if (f.type === 'repeater') {
      const items = Array.isArray(v) ? v : [];
      const minItems = f.minItems != null ? f.minItems : (f.required ? 1 : 0);
      if (items.length < minItems) {
        setError(fieldEl, minItems === 1
          ? 'Adicione ao menos 1 item.'
          : `Adicione ao menos ${minItems} itens.`);
        continue;
      }
      const requiredSubs = (f.fields || []).filter(s => s.required);
      const hasIncomplete = items.some(it => {
        const obj = it && typeof it === 'object' ? it : {};
        return requiredSubs.some(s => {
          const val = obj[s.id];
          return val == null || String(val).trim() === '';
        });
      });
      if (hasIncomplete) {
        setError(fieldEl, 'Preencha todos os campos obrigatórios de cada item (ou remova o que estiver vazio).');
      }
      continue;
    }

    const isEmpty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (f.required && isEmpty) {
      setError(fieldEl, 'Esse campo é obrigatório.');
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

    const progress = calculateProgress(state.steps, state.answers);
    const progressEl = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}% • Etapa ${state.currentStep + 1} de ${state.steps.length}`;

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
          <p class="lede">Obrigado, ${escapeHtml(state.clientName)}! Suas respostas já foram recebidas pela equipe DocAds. Em breve entraremos em contato.</p>
        </div>
      </div>
    </div>
  `;
}

boot();
