// =====================================================================
// Supabase client + helpers
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cfg = window.DOCADS_CONFIG;
if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
  throw new Error('DOCADS_CONFIG não definido. Inclua config.js antes de supabase.js');
}

export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'docads-briefing-auth'
  }
});

// ---------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function requireAdmin(redirectTo = '/admin/index.html') {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    throw new Error('not_authenticated');
  }
  const { data: profile, error } = await supabase
    .from('admins')
    .select('id, full_name, role, is_active')
    .eq('id', session.user.id)
    .single();
  if (error || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    window.location.href = redirectTo;
    throw new Error('not_admin');
  }
  return { session, profile };
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/admin/index.html';
}

// ---------------------------------------------------------------------
// RPC wrappers
// ---------------------------------------------------------------------
export async function getBriefingBySlug(slug) {
  const { data, error } = await supabase.rpc('get_briefing_by_slug', { p_slug: slug });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function saveBriefingDraft(slug, answers, progress, currentStep) {
  const { data, error } = await supabase.rpc('save_briefing_draft', {
    p_slug: slug,
    p_answers: answers,
    p_progress: progress,
    p_current_step: currentStep
  });
  if (error) throw error;
  return data;
}

export async function submitBriefing(slug, answers) {
  const { data, error } = await supabase.rpc('submit_briefing', {
    p_slug: slug,
    p_answers: answers
  });
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) throw error;
  return data;
}

export async function generateBriefingSlug(companyName) {
  const { data, error } = await supabase.rpc('generate_briefing_slug', {
    p_company_name: companyName
  });
  if (error) throw error;
  return data;
}
