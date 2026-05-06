/**
 * Supabase Client — Orchestration Framework
 * 
 * Single supabase-js client instance with connection pooling.
 * Uses service role key for server-side operations (orchestration has elevated privileges).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../config';

let _client: SupabaseClient | null = null;

/**
 * getClient() — Returns the singleton Supabase client.
 * Call once at startup; reuse throughout the application.
 */
export function getClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error(
        'Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in environment.'
      );
    }
    
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,  // Service role key doesn't need refresh
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
    
    console.log(`[supabase] Connected to ${SUPABASE_URL}`);
  }
  
  return _client;
}

/**
 * Health check — verifies Supabase connection is alive.
 */
export async function healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  
  try {
    const client = getClient();
    const { error } = await client.from('executions').select('plan_id').limit(1);
    
    if (error) throw error;
    
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

/**
 * Connection pool info (for observability)
 */
export function getPoolStats(): { connected: boolean; url: string } {
  return {
    connected: _client !== null,
    url: SUPABASE_URL,
  };
}