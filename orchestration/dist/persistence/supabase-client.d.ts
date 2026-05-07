/**
 * Supabase Client — Orchestration Framework
 *
 * Single supabase-js client instance with connection pooling.
 * Uses service role key for server-side operations (orchestration has elevated privileges).
 */
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * getClient() — Returns the singleton Supabase client.
 * Call once at startup; reuse throughout the application.
 */
export declare function getClient(): SupabaseClient;
/**
 * Health check — verifies Supabase connection is alive.
 */
export declare function healthCheck(): Promise<{
    ok: boolean;
    latencyMs: number;
    error?: string;
}>;
/**
 * Connection pool info (for observability)
 */
export declare function getPoolStats(): {
    connected: boolean;
    url: string;
};
//# sourceMappingURL=supabase-client.d.ts.map