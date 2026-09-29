import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENV_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const LS_URL_KEY = 'elo.supabase.url';
const LS_ANON_KEY = 'elo.supabase.anon';

function lerLocal(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') return { url: '', anonKey: '' };
  try {
    return {
      url: (window.localStorage.getItem(LS_URL_KEY) ?? '').trim(),
      anonKey: (window.localStorage.getItem(LS_ANON_KEY) ?? '').trim(),
    };
  } catch {
    return { url: '', anonKey: '' };
  }
}

export type FonteSupabase = 'env' | 'local' | 'none';

export function getSupabaseConfig(): { url: string; anonKey: string; fonte: FonteSupabase } {
  const envUrl = (ENV_URL ?? '').trim();
  const envKey = (ENV_ANON_KEY ?? '').trim();
  if (envUrl && envKey) return { url: envUrl, anonKey: envKey, fonte: 'env' };
  const local = lerLocal();
  if (local.url && local.anonKey) return { url: local.url, anonKey: local.anonKey, fonte: 'local' };
  return { url: '', anonKey: '', fonte: 'none' };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().fonte !== 'none';
}

// Compat: antes era um boolean estático. Mantém o nome mas como getter dinâmico.
export const isSupabaseConfiguredFlag = Boolean(ENV_URL && ENV_ANON_KEY);

export function guardarSupabaseLocal(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_URL_KEY, url.trim());
  window.localStorage.setItem(LS_ANON_KEY, anonKey.trim());
  client = null;
  window.dispatchEvent(new Event('elo:supabase-changed'));
}

export function limparSupabaseLocal() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LS_URL_KEY);
  window.localStorage.removeItem(LS_ANON_KEY);
  client = null;
  window.dispatchEvent(new Event('elo:supabase-changed'));
}

let client: SupabaseClient | null = null;
let clientKey = '';

export function getSupabase(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return null;
  const key = cfg.url + '|' + cfg.anonKey.slice(0, 12);
  if (client && clientKey === key) return client;
  client = createClient(cfg.url, cfg.anonKey);
  clientKey = key;
  return client;
}
