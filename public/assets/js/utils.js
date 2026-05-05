// =====================================================================
// Utilitários gerais
// =====================================================================

export function $(sel, parent = document) { return parent.querySelector(sel); }
export function $$(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

export function debounce(fn, delay = 800) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function formatDate(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: opts.dateStyle ?? 'short',
    timeStyle: opts.timeStyle ?? 'short'
  });
}

export function formatDateOnly(iso) {
  return formatDate(iso, { dateStyle: 'short', timeStyle: undefined }).split(',')[0];
}

const STATUS_LABELS = {
  pending: 'Aguardando',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  analyzed: 'Analisado',
  archived: 'Arquivado',
  draft: 'Rascunho',
  submitted: 'Submetido'
};

export function statusLabel(s) { return STATUS_LABELS[s] || s; }

export function statusBadge(s) {
  const cls = {
    pending: 'badge-pending',
    in_progress: 'badge-progress',
    completed: 'badge-completed',
    analyzed: 'badge-analyzed',
    archived: 'badge-archived',
    draft: 'badge-pending',
    submitted: 'badge-completed'
  }[s] || '';
  return `<span class="badge ${cls}">${statusLabel(s)}</span>`;
}

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ---------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------
let toastContainer;
function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message, type = 'info', duration = 3500) {
  const c = ensureToastContainer();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.2s';
    setTimeout(() => el.remove(), 200);
  }, duration);
}

// ---------------------------------------------------------------------
// Copy to clipboard
// ---------------------------------------------------------------------
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copiado para área de transferência', 'success', 2000);
    return true;
  } catch {
    toast('Não foi possível copiar', 'error');
    return false;
  }
}
