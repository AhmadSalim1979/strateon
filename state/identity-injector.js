/**
 * MOOSA Identity Injection Layer
 * MCSI Phase B.1b — Identity Anchoring Foundation
 * 
 * NON-DISRUPTIVE injection for LOCAL model requests only.
 * Feature-flag controlled. Easy rollback.
 * 
 * Behavior:
 * - Only injects into requests destined for ollama-local provider
 * - Does NOT affect MiniMax, Gemini, or other external providers
 * - Controlled by IDENTITY_INJECTION_ENABLED env var
 * - All injection events logged to state/telemetry/
 * 
 * Rollback: Set IDENTITY_INJECTION_ENABLED=false or remove this module.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load identity loader
const identity = require('./identity-loader.js');

// Feature flag — set to 'true' to enable, 'false' to disable
const ENABLED = process.env.IDENTITY_INJECTION_ENABLED !== 'false'; // default true

/**
 * Determine if a request should receive identity injection.
 * Currently targets ollama-local provider only.
 * 
 * @param {Object} requestPayload - The model request payload
 * @param {string} provider - Provider name (e.g., 'ollama-local')
 * @returns {boolean}
 */
function shouldInject(requestPayload, provider) {
    if (!ENABLED) return false;
    if (!provider) return false;
    
    const localProviders = ['ollama-local', 'ollama', 'gpu-brain'];
    return localProviders.some(p => provider.toLowerCase().includes(p));
}

/**
 * Inject identity anchor into a model request payload.
 * Prepends anchor to the system message or first user message.
 * 
 * @param {Object} payload - OpenAI-compatible chat completion payload
 * @param {boolean} useAbbreviated - Use abbreviated anchor (for short tasks)
 * @returns {Object} Modified payload with identity anchor injected
 */
function inject(payload, useAbbreviated = false) {
    if (!payload || !payload.messages) {
        return payload;
    }
    
    const anchorText = useAbbreviated 
        ? identity.getAbbreviatedAnchor() 
        : identity.getAnchor();
    
    // Clone payload to avoid mutation
    const modified = JSON.parse(JSON.stringify(payload));
    
    // Inject as a system message at the front
    const systemMessage = {
        role: 'system',
        content: anchorText,
        name: 'MOOSA_IDENTITY_ANCHOR'
    };
    
    // Check if there's already a system message
    const hasSystem = modified.messages.some(m => m.role === 'system');
    
    if (hasSystem) {
        // Prepend before existing system messages
        modified.messages.unshift(systemMessage);
    } else {
        // Insert as first message
        modified.messages.unshift(systemMessage);
    }
    
    return modified;
}

/**
 * Check a model response for identity drift.
 * Logs drift events to telemetry.
 * 
 * @param {string} responseText - The model response text
 * @param {Object} metadata - Request metadata (provider, model, task_type)
 * @returns {{ drift: boolean, matches: string[], severity: string }}
 */
function checkResponseAndLog(responseText, metadata = {}) {
    const result = identity.checkResponse(responseText);
    
    if (result.drift) {
        const event = {
            drift_detected: true,
            matches: result.matches,
            severity: result.severity,
            provider: metadata.provider || 'unknown',
            model: metadata.model || 'unknown',
            task_type: metadata.task_type || 'unknown',
            response_excerpt: responseText.substring(0, 200),
            injection_was_active: metadata.injection_active || false
        };
        
        identity.logEvent('identity_drift', event);
        
        // Write to hallucination telemetry
        const entry = {
            timestamp: new Date().toISOString(),
            event_type: 'identity_drift',
            provider: metadata.provider || 'unknown',
            model: metadata.model || 'unknown',
            matches: result.matches,
            severity: result.severity,
            response_length: responseText.length,
            injection_active: metadata.injection_active || false
        };
        
        writeTelemetry('hallucination', entry);
        
        console.warn('[identity-injector] IDENTITY DRIFT DETECTED:', result.matches.join(', '));
    }
    
    return result;
}

/**
 * Write telemetry entry to a category-specific file.
 * @param {string} category - 'hallucination' | 'routing' | 'safety'
 * @param {Object} entry - Telemetry entry
 */
function writeTelemetry(category, entry) {
    const dir = path.join(__dirname, 'telemetry');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const filePath = path.join(dir, `${category}.jsonl`);
    try {
        fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
    } catch (err) {
        console.error('[identity-injector] Telemetry write failed:', err.message);
    }
}

/**
 * Log a cognition request event.
 * @param {Object} payload - Request payload
 * @param {Object} metadata - Request metadata
 */
function logRequest(payload, metadata = {}) {
    if (!ENABLED) return;
    
    const entry = {
        timestamp: new Date().toISOString(),
        event_type: 'cognition_request',
        provider: metadata.provider || 'unknown',
        model: metadata.model || 'unknown',
        task_type: metadata.task_type || 'unknown',
        injection_active: true,
        message_count: payload?.messages?.length || 0
    };
    
    writeTelemetry('routing', entry);
}

/**
 * Compute confidence score for a response (placeholder — Phase B.2 expands).
 * @param {Object} responseData - Response metadata
 * @returns {number} Confidence score 0-1
 */
function computeConfidence(responseData) {
    // Placeholder — real implementation in Phase B.2
    // For now: 0.8 baseline if no drift detected
    const drift = identity.checkResponse(responseData?.text || '');
    if (drift.drift) return 0.3;
    return 0.8;
}

/**
 * Wrap an Ollama request with identity injection and drift detection.
 * Usage: wrapRequest(originalRequest, provider, metadata)
 * 
 * @param {Object} payload - Chat completion payload
 * @param {string} provider - Provider name
 * @param {Object} metadata - Additional metadata
 * @returns {Object} { wrapped: bool, modifiedPayload: Object|null }
 */
function wrapRequest(payload, provider, metadata = {}) {
    if (!shouldInject(payload, provider)) {
        return { wrapped: false, modifiedPayload: null };
    }
    
    const useAbbreviated = metadata.short_task || false;
    const modifiedPayload = inject(payload, useAbbreviated);
    
    logRequest(modifiedPayload, { ...metadata, provider, injection_active: true });
    
    return { wrapped: true, modifiedPayload };
}

module.exports = {
    shouldInject,
    inject,
    checkResponseAndLog,
    computeConfidence,
    wrapRequest,
    writeTelemetry,
    ENABLED // exposed for debugging
};