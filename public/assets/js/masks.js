// =====================================================================
// Máscaras de input (vanilla JS, sem dependências)
// =====================================================================
// Uso: aplicar como `oninput` ou via event listener.
//   import { applyMask } from './masks.js';
//   applyMask(inputEl, 'currency');
// =====================================================================

export const MASKS = {
  // 00.000.000/0000-00 (também aceita CPF se ≤ 11 dígitos)
  cnpj(v) {
    const d = String(v).replace(/\D/g, '').slice(0, 14);
    if (d.length === 0) return '';
    if (d.length <= 11) {
      return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return d
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  },

  // (00) 0000-0000 ou (00) 00000-0000
  phone(v) {
    const d = String(v).replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) {
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    }
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  },

  // R$ 0.000,00
  currency(v) {
    const d = String(v).replace(/\D/g, '');
    if (!d) return '';
    const cents = parseInt(d, 10);
    const reais = (cents / 100).toFixed(2);
    const [intPart, decPart] = reais.split('.');
    return 'R$ ' + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart;
  },

  // 00,00%
  percent(v) {
    const d = String(v).replace(/\D/g, '').slice(0, 4);
    if (!d) return '';
    if (d.length <= 2) return d + '%';
    return d.slice(0, -2) + ',' + d.slice(-2) + '%';
  }
};

/**
 * Aplica a máscara no input element preservando posição do cursor.
 * Use no event listener de 'input'.
 */
export function applyMask(input, maskName) {
  const fn = MASKS[maskName];
  if (!fn) return;
  const oldValue = input.value;
  const oldCursor = input.selectionStart;
  const newValue = fn(oldValue);
  if (newValue === oldValue) return;
  input.value = newValue;
  // Tenta manter cursor próximo do final (UX simples e funcional)
  const diff = newValue.length - oldValue.length;
  const newCursor = Math.max(0, (oldCursor || newValue.length) + diff);
  try {
    input.setSelectionRange(newCursor, newCursor);
  } catch { /* alguns tipos de input não suportam setSelectionRange */ }
}

/**
 * Aplica máscara em valor estático (pra quando carrega rascunho salvo).
 */
export function maskValue(value, maskName) {
  if (value == null || value === '') return '';
  const fn = MASKS[maskName];
  return fn ? fn(value) : value;
}
