/**
 * GPU Shadow Comparison Engine — Phase D-2.6b
 * Compares MiniMax and GPU responses across 9 dimensions
 *
 * All comparisons are observational only.
 * No comparison result affects production routing.
 *
 * SECURITY INVARIANTS:
 * - Tokens are never printed or exposed in logs
 * - Comparison results are stored, not used operationally
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// === COMPARISON CONFIG ===

const CONFIG = {
    MAX_RESPONSE_CHARS: 4000,
    MAX_MESSAGE_CHARS: 500,
    HALLUCINATION_WEIGHTS: {
        factually_inconsistent: 0.4,
        unsupported_claim: 0.3,
        logical_error: 0.2,
        contradiction: 0.1
    }
};

// === TOKENIZING (simple word-based for comparison) ===

function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

function uniqueTokens(text) {
    const tokens = tokenize(text);
    return [...new Set(tokens)];
}

function jaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

function keywordOverlap(textA, textB) {
    const tokensA = new Set(uniqueTokens(textA));
    const tokensB = new Set(uniqueTokens(textB));
    return jaccardSimilarity(tokensA, tokensB);
}

// === RESPONSE SIMILARITY ===

function responseSimilarity(textA, textB) {
    const tokensA = new Set(tokenize(textA));
    const tokensB = new Set(tokenize(textB));
    // Weighted Jaccard — common tokens weighted by frequency
    const shared = [...tokensA].filter(t => tokensB.has(t)).length;
    const total = Math.max(tokensA.size, tokensB.size);
    if (total === 0) return 0;
    return shared / total;
}

// === HALLUCINATION DETECTION (simple keyword-based heuristic) ===

function detectHallucinations(textA, textB) {
    const flags = [];
    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    // Unsupported claim: text B has significant content not in A
    const bOnly = [...setB].filter(t => !setA.has(t));
    if (bOnly.length > tokensB.length * 0.4 && tokensB.length > 10) {
        flags.push({ type: 'unsupported_claim', count: bOnly.length });
    }

    // Factual inconsistency: shared concepts contradict
    const sharedTerms = [...setA].filter(t => setB.has(t));
    // Simple check: if both have content but share < 30% terms, flag as potentially inconsistent
    if (setA.size > 5 && setB.size > 5) {
        const overlap = sharedTerms.length / Math.max(setA.size, setB.size);
        if (overlap < 0.25) {
            flags.push({ type: 'factually_inconsistent', overlap: Math.round(overlap * 100) / 100 });
        }
    }

    return flags;
}

function hallucinationScore(flags) {
    if (!flags || flags.length === 0) return 0;
    let score = 0;
    for (const flag of flags) {
        score += CONFIG.HALLUCINATION_WEIGHTS[flag.type] || 0.1;
    }
    return Math.min(1, score);
}

// === REASONING DEPTH ESTIMATION ===

function estimateReasoningDepth(text) {
    if (!text || text.length < 20) return 'minimal';

    const depthIndicators = {
        formal: /\b(therefore|consequently|thus|hence|implies|derived|conclusion|analysis|furthermore|moreover|inasmuch)\b/gi,
        informal: /\b(think|feel|guess|maybe|i\s+believe|i\s+think|probably|perhaps)\b/gi,
        technical: /\b(function|algorithm|implementation|architecture|protocol|specification|interface|abstraction)\b/gi
    };

    let formalCount = 0, informalCount = 0, techCount = 0;
    const textLower = text.toLowerCase();

    let m;
    const formalRegex = depthIndicators.formal;
    while ((m = formalRegex.exec(textLower)) !== null) formalCount++;
    const informalRegex = depthIndicators.informal;
    while ((m = informalRegex.exec(textLower)) !== null) informalCount++;
    const techRegex = depthIndicators.technical;
    while ((m = techRegex.exec(textLower)) !== null) techCount++;

    const total = text.length;
    const density = (formalCount + informalCount + techCount) / total;

    if (techCount > 3) return 'technical';
    if (formalCount > 2 || density > 0.003) return 'formal';
    if (informalCount > 1) return 'informal';
    return 'conversational';
}

// === TRUNCATION DETECTION ===

function truncationDetected(text) {
    if (!text) return false;
    // Incomplete sentence indicators
    const incompletePatterns = [
        /[^.!?]$/, // doesn't end with sentence terminator
        /\b(the|the\s+a|and\s+then|it\s+was\s+the)\s*$/i, // trailing fragment
        /\b(continue|to\s+be\s+continued|unspecified)\s*$/i // explicit continue markers
    ];
    // Only flag as truncated if text is short and ends abruptly
    const shortAndIncomplete = text.length < 200 && /[^.!?]$/.test(text);
    const explicitContinue = /continue|to be continued|unspecified|tbd|pending\s+completion$/i.test(text);
    return shortAndIncomplete || explicitContinue;
}

// === SAFETY SCORE ESTIMATION ===

function safetyScore(text) {
    if (!text) return 0;
    const textLower = text.toLowerCase();

    const unsafePatterns = [
        /\b(hack|exploit|attack|vulnerability|breach|inject|manipulat)\b/i,
        /\b(illegal|criminal|fraud|scam|phishing)\b/i,
        /\b(do\s+not\s+distribute|confidential|proprietary|trade\s+secret)\b/i
    ];

    let unsafeFlags = 0;
    for (const pattern of unsafePatterns) {
        if (pattern.test(textLower)) unsafeFlags++;
    }

    if (unsafeFlags >= 2) return 0.3;
    if (unsafeFlags === 1) return 0.7;
    return 0.95; // default safe
}

// === OVERALL QUALITY ASSESSMENT ===

function overallQuality(gpuText, minimaxText, comparison) {
    const { response_similarity, hallucination_score, latency_ratio } = comparison;

    if (response_similarity < 0.3 && hallucination_score > 0.3) {
        return 'WORSE'; // Completely different and hallucinating
    }
    if (response_similarity < 0.3) {
        return 'INCOMPARABLE'; // Too different to compare
    }
    if (hallucination_score > 0.4) {
        return 'WORSE'; // Hallucinating
    }
    if (response_similarity > 0.75 && hallucination_score < 0.2 && latency_ratio < 3) {
        return 'BETTER'; // Similar quality, reasonable latency
    }
    return 'COMPARABLE';
}

// === MAIN COMPARISON ===

function compareResponses({ request, minimaxResponse, gpuResponse, minimaxLatencyMs, gpuLatencyMs, gpuStatus }) {
    const comparison = {
        request_id: request.request_id,
        comparison_id: 'cmp-' + Date.now().toString(36),
        timestamp: new Date().toISOString()
    };

    // Truncate for storage
    const minimaxTrunc = (minimaxResponse || '').substring(0, CONFIG.MAX_RESPONSE_CHARS);
    const gpuTrunc = (gpuResponse || '').substring(0, CONFIG.MAX_RESPONSE_CHARS);
    const requestTrunc = (request.user_message || '').substring(0, CONFIG.MAX_MESSAGE_CHARS);

    comparison.request = {
        user_message: requestTrunc,
        message_length: request.user_message ? request.user_message.length : 0,
        has_system_context: !!request.system_context,
        context_snapshot_hash: request.context_hash || null
    };

    comparison.minimax = {
        response: minimaxTrunc,
        response_length: minimaxTrunc.length,
        latency_ms: minimaxLatencyMs || 0,
        model: request.minimax_model || 'MiniMax',
        status: minimaxResponse ? 'success' : 'empty'
    };

    comparison.gpu = {
        response: gpuTrunc,
        response_length: gpuTrunc.length,
        latency_ms: gpuLatencyMs || 0,
        model: 'mistral-small3.2:latest',
        status: gpuStatus || 'unknown'
    };

    // Compute comparison dimensions
    const minTokens = tokenize(minimaxTrunc);
    const gpuTokens = tokenize(gpuTrunc);

    comparison.comparison = {
        length_delta_chars: (gpuTrunc.length - minimaxTrunc.length),
        length_delta_ratio: minimaxTrunc.length > 0
            ? Math.abs((gpuTrunc.length - minimaxTrunc.length) / minimaxTrunc.length)
            : 0,
        latency_gpu_vs_minimax_ms: (gpuLatencyMs || 0) - (minimaxLatencyMs || 0),
        latency_ratio: minimaxLatencyMs > 0
            ? (gpuLatencyMs || 0) / minimaxLatencyMs
            : 0,
        response_similarity_score: responseSimilarity(minimaxTrunc, gpuTrunc),
        keyword_overlap: keywordOverlap(minimaxTrunc, gpuTrunc),
        hallucination_flags: detectHallucinations(minimaxTrunc, gpuTrunc),
        hallucination_score: hallucinationScore(detectHallucinations(minimaxTrunc, gpuTrunc)),
        truncation_detected: truncationDetected(gpuTrunc),
        reasoning_depth_gpu: estimateReasoningDepth(gpuTrunc),
        reasoning_depth_minimax: estimateReasoningDepth(minimaxTrunc),
        reasoning_depth_match: estimateReasoningDepth(gpuTrunc) === estimateReasoningDepth(minimaxTrunc),
        safety_score_gpu: safetyScore(gpuTrunc),
        safety_score_minimax: safetyScore(minimaxTrunc),
        overall_gpu_quality: 'INSUFFICIENT_DATA',
        recommendation: 'SHADOW_ONLY — do not promote without explicit approval'
    };

    // Final quality assessment
    if (gpuStatus === 'success' && minimaxResponse) {
        comparison.comparison.overall_gpu_quality = overallQuality(
            gpuTrunc, minimaxTrunc, comparison.comparison
        );
    }

    return comparison;
}

// === CLI ===

if (require.main === module) {
    const test = {
        request: {
            request_id: 'test-001',
            user_message: 'What is the capital of France?',
            system_context: null
        },
        minimaxResponse: 'The capital of France is Paris.',
        gpuResponse: 'Paris is the capital city of France.',
        minimaxLatencyMs: 800,
        gpuLatencyMs: 3200,
        gpuStatus: 'success'
    };
    const result = compareResponses(test);
    console.log(JSON.stringify(result, null, 2));
}

module.exports = {
    compareResponses,
    responseSimilarity,
    keywordOverlap,
    detectHallucinations,
    hallucinationScore,
    estimateReasoningDepth,
    truncationDetected,
    safetyScore,
    overallQuality,
    CONFIG
};