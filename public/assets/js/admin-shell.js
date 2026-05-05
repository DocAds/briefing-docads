// =====================================================================
// Admin shell — topbar comum a todas as páginas do admin
// =====================================================================

import { requireAdmin, logout } from './supabase.js';
import { escapeHtml } from './utils.js';

export async function mountAdminShell(activePage) {
  const { profile } = await requireAdmin();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard.html' },
    { id: 'clientes', label: 'Clientes', href: '/admin/clientes.html' },
    { id: 'briefings', label: 'Briefings', href: '/admin/briefings.html' },
    { id: 'usuarios', label: 'Usuários', href: '/admin/usuarios.html' }
  ];

  const topbarEl = document.createElement('header');
  topbarEl.className = 'topbar';
  topbarEl.innerHTML = `
    <a href="/admin/dashboard.html" class="topbar-logo">
      <img src="/assets/img/logo.png" alt="DocAds">
      <span style="font-weight:700;color:var(--text-muted);font-size:14px;border-left:1px solid var(--border);padding-left:12px;margin-left:4px;">briefing</span>
    </a>

    <nav class="topbar-nav">
      ${navItems.map(n => `<a href="${n.href}" class="${n.id === activePage ? 'active' : ''}">${escapeHtml(n.label)}</a>`).join('')}
    </nav>

    <div class="topbar-user">
      <div style="text-align:right;">
        <div style="font-weight:600;color:var(--text);font-size:13px;">${escapeHtml(profile.full_name)}</div>
        <div style="font-size:12px;color:var(--text-subtle);text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(profile.role)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" id="logout-btn">Sair</button>
    </div>
  `;
  document.body.prepend(topbarEl);

  topbarEl.querySelector('#logout-btn').addEventListener('click', logout);

  return profile;
}
