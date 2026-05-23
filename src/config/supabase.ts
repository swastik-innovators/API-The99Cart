// ─── Supabase Client ───────────────────────────────────────────────────────
// Two clients: public (anon) and admin (service role).

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './index';
import { logger } from './logger';

// ── Public Client (respects RLS) ───────────────────────────────────────────
export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ── Admin Client (bypasses RLS — use with caution) ─────────────────────────
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ── Connection Test ────────────────────────────────────────────────────────
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Simple query to verify connectivity
    const { error } = await supabaseAdmin.from('_health_check').select('*').limit(1);
    // Table may not exist — that's fine; we just need no network error
    if (
      error &&
      error.code !== 'PGRST205' &&
      !error.message.includes('does not exist') &&
      !error.message.includes('relation') &&
      !error.message.includes('schema cache')
    ) {
      throw error;
    }
    logger.info('✅ Supabase connection established');
    return true;
  } catch (err) {
    logger.warn('⚠️  Supabase connection test failed — service may be unreachable', {
      error: err instanceof Error ? err.message : err,
    });
    return false;
  }
}

export default supabase;
