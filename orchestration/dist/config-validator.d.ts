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
export interface ConfigValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validate all configuration and return the result.
 * Call this at application startup.
 */
export declare function validateRuntimeConfig(): ConfigValidationResult;
/**
 * Assert that configuration is valid.
 * Throws a descriptive error if validation fails.
 * Use this at startup to fail-fast on bad configuration.
 */
export declare function assertConfig(): void;
/**
 * Get a safe config summary for logging (no secrets).
 */
export declare function getConfigSummary(): Record<string, string>;
//# sourceMappingURL=config-validator.d.ts.map