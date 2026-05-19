/**
 * MOOSA Identity Anchor Loader
 * MCSI Phase B.1b — Identity Anchoring Foundation
 * 
 * Read-only module. No mutation. Fail-safe behavior.
 * 
 * Usage:
 *   const identity = require('./identity-loader.js');
 *   const anchor = identity.getAnchor();           // full anchor text
 *   const short = identity.getAbbreviatedAnchor(); // short form
 *   const blocked = identity.getBlockedTerms();    // array
 *   const patterns = identity.getHallucinationPatterns(); // array
 *   const isClean = identity.checkResponse(response); // { drift: bool, matches: [] }
 */

const path = require('path');
const fs = require('fs');

const IDENTITY_PATH = path.join(__dirname, 'moosa-identity.json');

let _cache = null;
let _cacheTime = null;
const CACHE_TTL_MS = 60000; // Refresh every 60 seconds

/**
 * Load and cache canonical identity.
 * @returns {Object} Identity card
 */
function loadIdentity() {
    const now = Date.now();
    if (_cache && _cacheTime && (now - _cacheTime) < CACHE_TTL_MS) {
        return _cache;
    }
    try {
        const raw = fs.readFileSync(IDENTITY_PATH, 'utf8');
        _cache = JSON.parse(raw);
        _cacheTime = now;
        console.log('[identity-loader] Canonical identity loaded. hash:', _cache.canonical_hash);
        return _cache;
    } catch (err) {
        console.error('[identity-loader] FATAL: Failed to load moosa-identity.json:', err.message);
        // Fail-safe: return minimal identity to prevent broken cognition
        return {
            canonical_name: 'MOOSA',
            identity_anchor_text: '[MOOSA] Created by Ahmad Salim. Private AI. [END]',
            abbreviated_anchor_text: '[MOOSA] Private AI. [END]',
            hallucination_patterns: { blocked_terms: [], blocked_affiliations: [] }
        };
    }
}

/**
 * Get the full identity anchor text for prepending to cognition requests.
 * @returns {string} Full anchor text
 */
function getAnchor() {
    return loadIdentity().identity_anchor_text;
}

/**
 * Get abbreviated anchor for short tasks.
 * @returns {string} Abbreviated anchor text
 */
function getAbbreviatedAnchor() {
    return loadIdentity().abbreviated_anchor_text;
}

/**
 * Get canonical identity name.
 * @returns {string} Canonical name
 */
function getCanonicalName() {
    return loadIdentity().canonical_name || 'MOOSA';
}

/**
 * Get list of blocked terms (exact match hallucination triggers).
 * @returns {string[]} Blocked terms array
 */
function getBlockedTerms() {
    return loadIdentity().hallucination_patterns?.blocked_terms || [];
}

/**
 * Get list of blocked affiliations.
 * @returns {string[]} Blocked affiliations array
 */
function getBlockedAffiliations() {
    return loadIdentity().hallucination_patterns?.blocked_affiliations || [];
}

/**
 * Get hallucination patterns (combined blocked_terms + blocked_affiliations).
 * @returns {string[]} All patterns to check
 */
function getHallucinationPatterns() {
    const patterns = [
        ...(loadIdentity().hallucination_patterns?.blocked_terms || []),
        ...(loadIdentity().hallucination_patterns?.blocked_affiliations || [])
    ];
    return [...new Set(patterns)]; // deduplicate
}

/**
 * Check a model response for identity drift (hallucination).
 * @param {string} responseText - The model response text to check
 * @returns {{ drift: boolean, matches: string[], severity: string }}
 */
function checkResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') {
        return { drift: false, matches: [], severity: 'none' };
    }
    
    const patterns = getHallucinationPatterns();
    const matches = [];
    
    for (const pattern of patterns) {
        if (responseText.includes(pattern)) {
            matches.push(pattern);
        }
    }
    
    const drift = matches.length > 0;
    let severity = 'none';
    if (matches.length > 0) {
        // High severity: external affiliation claims
        const highSeverity = loadIdentity().hallucination_patterns?.blocked_affiliations || [];
        const hasHighSeverity = matches.some(m => highSeverity.includes(m));
        severity = hasHighSeverity ? 'HIGH' : 'MEDIUM';
    }
    
    return { drift, matches, severity };
}

/**
 * Compute current identity checksum.
 * @returns {string} SHA256 hash of current identity definition
 */
function computeHash() {
    const identity = loadIdentity();
    const crypto = require('crypto');
    const def = JSON.stringify({
        name: identity.canonical_name,
        definition: identity.definition,
        owner: identity.owner,
        constraints: identity.core_constraints
    });
    return crypto.createHash('sha256').update(def).digest('hex');
}

/**
 * Verify identity card integrity (detect tampering or corruption).
 * @returns {{ valid: boolean, expected: string, actual: string }}
 */
function verifyIntegrity() {
    const identity = loadIdentity();
    // canonical_hash may be stored as "sha256:<hex>" or just "<hex>"
    const storedHash = identity.canonical_hash || '';
    const storedWithoutPrefix = storedHash.replace(/^sha256:/, '');
    const computedHash = computeHash();
    return {
        valid: storedWithoutPrefix === computedHash,
        expected: storedHash,
        actual: 'sha256:' + computedHash,
        hash_only: computedHash
    };
}

/**
 * Log identity event (for telemetry).
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 */
function logEvent(eventType, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        event_type: eventType,
        source: 'identity-loader',
        identity_hash: loadIdentity().canonical_hash,
        ...data
    };
    
    const logPath = path.join(__dirname, 'telemetry', 'identity-events.jsonl');
    try {
        const dir = path.dirname(logPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch (err) {
        console.error('[identity-loader] Failed to write telemetry event:', err.message);
    }
}

module.exports = {
    getAnchor,
    getAbbreviatedAnchor,
    getCanonicalName,
    getBlockedTerms,
    getBlockedAffiliations,
    getHallucinationPatterns,
    checkResponse,
    computeHash,
    verifyIntegrity,
    logEvent,
    loadIdentity // exposed for debugging only
};