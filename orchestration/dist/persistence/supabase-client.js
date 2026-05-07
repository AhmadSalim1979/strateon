"use strict";
/**
 * Supabase Client — Orchestration Framework
 *
 * Single supabase-js client instance with connection pooling.
 * Uses service role key for server-side operations (orchestration has elevated privileges).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.healthCheck = healthCheck;
exports.getPoolStats = getPoolStats;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
let _client = null;
/**
 * getClient() — Returns the singleton Supabase client.
 * Call once at startup; reuse throughout the application.
 */
function getClient() {
    if (!_client) {
        if (!config_1.SUPABASE_URL || !config_1.SUPABASE_SERVICE_KEY) {
            throw new Error('Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in environment.');
        }
        _client = (0, supabase_js_1.createClient)(config_1.SUPABASE_URL, config_1.SUPABASE_SERVICE_KEY, {
            auth: {
                autoRefreshToken: false, // Service role key doesn't need refresh
                persistSession: false,
            },
            db: {
                schema: 'public',
            },
        });
        console.log(`[supabase] Connected to ${config_1.SUPABASE_URL}`);
    }
    return _client;
}
/**
 * Health check — verifies Supabase connection is alive.
 */
async function healthCheck() {
    const start = Date.now();
    try {
        const client = getClient();
        const { error } = await client.from('executions').select('plan_id').limit(1);
        if (error)
            throw error;
        return { ok: true, latencyMs: Date.now() - start };
    }
    catch (err) {
        return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
}
/**
 * Connection pool info (for observability)
 */
function getPoolStats() {
    return {
        connected: _client !== null,
        url: config_1.SUPABASE_URL,
    };
}
//# sourceMappingURL=supabase-client.js.map