/**
 * GPU Shadow Sampling — Phase D-2.6b
 * Classifies user requests for shadow routing eligibility
 *
 * Three classification levels:
 * - SAFE_FOR_SHADOW: May be duplicated to GPU path
 * - NOT_SAFE_FOR_SHADOW: Not yet eligible, may be promoted later
 * - NEVER_GPU: Must never be sent to GPU
 *
 * SECURITY INVARIANTS:
 * - No requests are ever automatically forwarded to GPU
 * - NEVER_GPU classification is hard — no override without explicit approval
 * - All classification decisions are logged
 */

const fs = require('fs');
const path = require('path');

const SAMPLING_LOG = '/home/node/.openclaw/workspace/state/gpu-shadow-sampling-log.jsonl';

// === REQUEST CATEGORIES ===

const CATEGORY = {
    SAFE_FOR_SHADOW: 'SAFE_FOR_SHADOW',
    NOT_SAFE_FOR_SHADOW: 'NOT_SAFE_FOR_SHADOW',
    NEVER_GPU: 'NEVER_GPU'
};

// === KEYWORD BLOCKLISTS ===

const NEVER_GPU_PATTERNS = [
    // Approvals / denials
    /\b(approve|approval|deny|denial|reject|cancel|authorize)\b.*\b(transaction|payment|billing|invoice|contract|deal|wire|transfer|funds|ach)\b/i,
    /\b(wire\s*transfer|ach|payment\s*instruction|funds\s+transfer)\b/i,
    /\b(accept|reject)\s+(terms|agreement|contract|proposal)\b/i,
    /\b(execute|trigger)\s+(payment|transfer|wire|transaction|funds)\b/i,

    // Billing / payments
    /\b(send|pay|process|charge|refund)\s+.*\b(money|dollar|euro|pound|ruppee|invoice|bill)\b/i,
    /\b(billing|payment)\s+(instruction|direction|order)\b/i,
    /\b(payment|link|stripe)\b.*\b(create|setup|activate)\b/i,

    // External communications
    /\b(email|message|call|contact)\s+.*\b(client|customer|partner|investor|vendor|buyer)\b/i,
    /\b(send|send\s+to|compose|write)\s+.*\b(email|letter|message)\b/i,
    /\b(post|publish|share|tweet|announce)\s+.*\b(public|linkedin|twitter|facebook|social)\b/i,

    // Security / credentials
    /\b(password|secret|api.?key|token|credential|private.?key)\b/i,
    /\b(login|authenticate|auth|oauth)\b.*\b(credentials|secrets|keys)\b/i,
    /\b(reset|change)\s+(password|credential|secret)\b/i,

    // Legal / contractual
    /\b(legal|contract|agreement|nda|terms?\s+of|terms?\s+&|terms?\s+and)\b/i,
    /\b(attorney|lawyer|counsel|legal\s+advice)\b/i,

    // Executive / strategic decisions
    /\b(acquire|acquisition|buy|sell|divest|ipo|fundraise|investment)\b/i,
    /\b(strategic|executive|board\s+decision|c-suite|cto|ceo|cfo|coo|cmo)\b/i,
    /\b(hire|fire|promote|demote|compensation|salary)\b/i,

    // Destructive / irreversible
    /\b(delete|remove|destroy|terminate|cancel\s+account)\b.*\b(user|client|account|data)\b/i,
    /\b(drop\s+table|truncate|delete\s+.*\s+where)\b/i,
    /\b(rm\s+-rf|rmrf|mkfs|dd\s+if=)\b/i,

    // Highly sensitive
    /\b(medical|health\s+record|ssn|social\s+security|passport\s+number)\b/i,
    /\b(uber|hired|visa|immigration)\b.*\b(status|application|case)\b/i
];

const NOT_SAFE_FOR_SHADOW_PATTERNS = [
    // Client-facing outputs
    /\b(response|reply|answer)\s+.*\b(client|customer|partner)\b.*\b(email|message|letter)\b/i,
    /\b(draft|compose|write)\s+.*\b(email|letter|response)\b.*\b(client|customer)\b/i,
    /\b(proposal|quote|contract)\s+.*\b(send|deliver|send\s+to)\b/i,

    // Multi-step reasoning chains
    /\b(continue|keep\s+going|don'?t\s+stop|finish\s+the)\b/i,
    /\b(previous|last\s+message|earlier\s+you)\b.*\b(said|mentioned|did)\b/i,
    /\b(step\s+\d+|phase\s+\d+|stage\s+\d+)\b/i,

    // High-stakes creative
    /\b(creative|marketing|copy|brand\s+voice| campaign)\b/i,
    /\b(write\s+.*\s+blog\s+post|write\s+.*\s+article|write\s+.*\s+landing\s+page)\b/i,
    /\b(whitepaper|deck|presentation)\s+.*\s+(for|about)\b.*\b(client|investor)\b/i,

    // Approval-required tasks
    /\b(review\s+and\s+approve|approve\s+and\s+send|sign\s+off)\b/i,
    /\b(submit|file|lodge)\s+.*\b(application|form|claim)\b/i
];

const SAFE_FOR_SHADOW_INDICATORS = [
    /\b(what\s+is|how\s+does|explain|describe|define|what'?s\s+a)\b/i,
    /\b(summarize|analyze|review|compare|contrast|evaluate)\b/i,
    /\b(code\s+review|explain\s+.*\s+function|explain\s+.*\s+logic)\b/i,
    /\b(what\s+are\s+the|list\s+.*\s+steps?|outline\s+.*\s+approach)\b/i,
    /\b(draft\s+.*\s+for\s+internal|internal\s+.*\s+analysis|internal\s+.*\s+memo)\b/i,
    /\b(how\s+should\s+we|How\s+can\s+I|what\s+would\s+you\s+recommend)\b/i,
    /\b(factorial|calculate|compute|determine|solve\s+for)\b/i
];

// === CLASSIFICATION LOGIC ===

function classifyRequest(message, options) {
    options = options || {};
    const messageLower = message.toLowerCase().trim();
    const msgHash = hashString(message);

    // Check NEVER_GPU first — hard blocks
    for (const pattern of NEVER_GPU_PATTERNS) {
        if (pattern.test(messageLower)) {
            const result = {
                category: CATEGORY.NEVER_GPU,
                reason: 'matched_pattern',
                pattern: pattern.toString(),
                request_excerpt: message.substring(0, 80),
                message_hash: msgHash,
                timestamp: new Date().toISOString()
            };
            logSamplingDecision(result);
            return result;
        }
    }

    // Check NOT_SAFE_FOR_SHADOW
    for (const pattern of NOT_SAFE_FOR_SHADOW_PATTERNS) {
        if (pattern.test(messageLower)) {
            const result = {
                category: CATEGORY.NOT_SAFE_FOR_SHADOW,
                reason: 'matched_pattern',
                pattern: pattern.toString(),
                request_excerpt: message.substring(0, 80),
                message_hash: msgHash,
                timestamp: new Date().toISOString()
            };
            logSamplingDecision(result);
            return result;
        }
    }

    // Check SAFE_FOR_SHADOW indicators
    for (const pattern of SAFE_FOR_SHADOW_INDICATORS) {
        if (pattern.test(messageLower)) {
            const result = {
                category: CATEGORY.SAFE_FOR_SHADOW,
                reason: 'matched_safe_indicator',
                pattern: pattern.toString(),
                request_excerpt: message.substring(0, 80),
                message_hash: msgHash,
                timestamp: new Date().toISOString()
            };
            logSamplingDecision(result);
            return result;
        }
    }

    // Default: NOT_SAFE_FOR_SHADOW (conservative — better to skip than wrongly sample)
    const result = {
        category: CATEGORY.NOT_SAFE_FOR_SHADOW,
        reason: 'default_conservative',
        request_excerpt: message.substring(0, 80),
        message_hash: msgHash,
        timestamp: new Date().toISOString()
    };
    logSamplingDecision(result);
    return result;
}

// === LOGGING ===

function logSamplingDecision(result) {
    try {
        fs.appendFileSync(SAMPLING_LOG, JSON.stringify(result) + '\n');
    } catch {}
}

// === HELPERS ===

function hashString(str) {
    // Simple non-crypto hash for logging brevity
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// === CLI ===

if (require.main === module) {
    const message = process.argv.slice(2).join(' ');
    if (!message) {
        console.log('Usage: node gpu-shadow-sampling.js "your request message"');
        process.exit(1);
    }
    const result = classifyRequest(message);
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { classifyRequest, CATEGORY, NEVER_GPU_PATTERNS, NOT_SAFE_FOR_SHADOW_PATTERNS, SAFE_FOR_SHADOW_INDICATORS };