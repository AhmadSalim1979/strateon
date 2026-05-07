"use strict";
/**
 * Config Validator — Runtime Configuration Validation
 * Phase 3: Validates all required environment variables on startup
 *
 * Fail-fast: if critical configuration is missing, the application
 * will exit immediately with a clear error message rather than
 * failing silently with unexpected behavior.
 *
 * Shadow-safe: does not affect production behavior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRuntimeConfig = validateRuntimeConfig;
exports.assertConfig = assertConfig;
exports.getConfigSummary = getConfigSummary;
/**
 * Required environment variables that MUST be set.
 * These represent the critical configuration for the orchestration runtime.
 */
const REQUIRED_ENV_VARS = [
    {
        name: 'WEBHOOK_INTERNAL_SECRET',
        description: 'Secret for internal webhook authentication',
        validate: (value) => {
            // Must not be the development default
            if (value === 'dev-internal-secret-change-in-prod') {
                return 'WEBHOOK_INTERNAL_SECRET is set to the default development secret. Set a strong secret in production.';
            }
            // Must be at least 16 characters
            if (value.length < 16) {
                return 'WEBHOOK_INTERNAL_SECRET must be at least 16 characters long.';
            }
            return null;
        },
    },
    {
        name: 'SUPABASE_URL',
        description: 'Supabase project URL',
        validate: (value) => {
            if (!value.startsWith('https://')) {
                return 'SUPABASE_URL must be a valid HTTPS URL.';
            }
            return null;
        },
    },
    {
        name: 'SUPABASE_SERVICE_KEY',
        description: 'Supabase service role key',
        validate: (value) => {
            if (value.length < 20) {
                return 'SUPABASE_SERVICE_KEY appears to be invalid (too short).';
            }
            return null;
        },
    },
];
/**
 * Optional environment variables with default values.
 * These are warnings — not hard failures.
 */
const OPTIONAL_WITH_WARNINGS = [
    {
        name: 'REDIS_HOST',
        description: 'Redis server host',
        defaultValue: '127.0.0.1',
        warningIfDefault: 'Using default Redis host 127.0.0.1. Set REDIS_HOST if Redis is on a different machine.',
    },
];
/**
 * Validate all configuration and return the result.
 * Call this at application startup.
 */
function validateRuntimeConfig() {
    const errors = [];
    const warnings = [];
    // Check required environment variables
    for (const envVar of REQUIRED_ENV_VARS) {
        const value = process.env[envVar.name];
        if (!value || value.trim() === '') {
            errors.push(`${envVar.name}: ${envVar.description} — REQUIRED`);
            continue;
        }
        // Run custom validator if provided
        if (envVar.validate) {
            const validationError = envVar.validate(value);
            if (validationError) {
                errors.push(`${envVar.name}: ${validationError}`);
            }
        }
    }
    // Check optional variables and warn if defaults are in use
    for (const opt of OPTIONAL_WITH_WARNINGS) {
        const value = process.env[opt.name] || opt.defaultValue;
        if (value === opt.defaultValue && opt.defaultValue !== '') {
            warnings.push(`${opt.name}: ${opt.warningIfDefault}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Assert that configuration is valid.
 * Throws a descriptive error if validation fails.
 * Use this at startup to fail-fast on bad configuration.
 */
function assertConfig() {
    const result = validateRuntimeConfig();
    if (!result.valid) {
        const message = [
            '❌ CONFIGURATION VALIDATION FAILED',
            '',
            'Critical environment variables are missing or invalid:',
            ...result.errors.map(e => `  - ${e}`),
            '',
            'Fix these issues before starting the orchestration runtime.',
            'Run `openclaw env-check` to validate your environment configuration.',
        ].join('\n');
        console.error(message);
        process.exit(1);
    }
    if (result.warnings.length > 0) {
        console.warn('⚠️  Configuration warnings:');
        result.warnings.forEach(w => console.warn(`  - ${w}`));
    }
}
/**
 * Get a safe config summary for logging (no secrets).
 */
function getConfigSummary() {
    return {
        'ORCHESTRATION_MODE': process.env.ORCHESTRATION_MODE || 'production (default)',
        'WEBHOOK_PORT': process.env.WEBHOOK_PORT || '3003',
        'SUPABASE_URL': process.env.SUPABASE_URL ? '(set)' : '(missing)',
        'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY ? '(set)' : '(missing)',
        'REDIS_HOST': process.env.REDIS_HOST || '127.0.0.1',
        'REDIS_PORT': process.env.REDIS_PORT || '6379',
        'WORKER_COUNT': process.env.WORKER_COUNT || '3',
        'MAX_EVENT_HOPS': process.env.MAX_EVENT_HOPS || '10',
    };
}
//# sourceMappingURL=config-validator.js.map