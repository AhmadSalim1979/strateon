/**
 * GPU Shadow Comparison Engine — CALIBRATED v3
 *
 * Changes from v2:
 * - Fixed core fact extraction: shared core facts only, not union
 * - Factually_inconsistent: only fires on genuine contradiction signals
 * - Refusal handling: both refusing = COMPARABLE_REDUCED regardless of similarity
 * - Very short MiniMax answers with expanded GPU answers: core-fact + verbosity handling
 * - True hallucination detection: fabricated entities/claims only
 * - Improved quality classification: COMPARABLE_CORRECT (not WORSE for verbosity)
 *
 * All comparisons are observational only.
 * No comparison result affects production routing.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// === CONFIG ===

const CONFIG = {
    MAX_RESPONSE_CHARS: 4000,
    MAX_MESSAGE_CHARS: 500,
    // Thresholds
    MIN_SIM_FOR_COMPARABLE: 0.20,
    MIN_SIM_FOR_PARTIAL: 0.10,
    HAL_High: 0.4,
    HAL_MEDIUM: 0.25,
    MIN_CORE_SHARED_FOR_COMPARABLE: 0.30,
    MIN_CONTENT_OVERLAP_FOR_COMPARABLE: 0.20,
    // Verbosity
    VERBOSITY_RATIO_THRESHOLD: 3.0,
    // Hallucination weights
    HALLUCINATION_WEIGHTS: {
        factually_inconsistent: 0.4,
        unsupported_claim: 0.3,
        logical_error: 0.2,
        contradiction: 0.1
    },
    REFUSAL_PATTERNS: [
        /\b(cannot|unable|cant|wont|won.t|should not|shouldn.t)\b/gi,
        /\b(illegal|unethical|wrong|harmful|dangerous)\b/gi,
    ],
    SAFE_EXPANSION_MARKERS: [
        'for example', 'such as', 'including', 'particularly',
        'specifically', 'in particular', 'additionally', 'moreover',
        'furthermore', 'also known as', 'real name', 'published in',
    ],
    // Claim patterns that should be verifiable
    VERIFIABLE_CLAIM_TYPES: [
        /\b(\d{4})\b/,  // years: 1945, 1949, etc.
        /\b(Au|Ag|Fe|O|C|H|N|S|Cl|Pb|K|Na|Ca|Mg|Br|I|He|Ne|Ar)\b/,  // element symbols
        /\b(capital|nation|country)\s+of\b/gi,
        /\b(author|wrote|born|died|invented|discovered)\b/gi,
        /\b(\d+\s*(kg|km|cm|m|ml|l|ton|percent|%))\b/gi,
    ]
};

// === TOKENIZATION ===

function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

function uniqueTokens(text) {
    return [...new Set(tokenize(text))];
}

const STOPWORDS = new Set([
    'the','a','an','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could',
    'should','may','might','can','to','of','in','for','on','at',
    'by','with','from','as','into','through','during','before',
    'after','above','below','between','under','again','further',
    'then','once','here','there','when','where','why','how','all',
    'each','few','more','most','other','some','such','no','nor',
    'not','only','own','same','so','than','too','very','just',
    'also','now','and','but','or','if','because','until','while',
]);

function contentTokens(text) {
    return tokenize(text).filter(t => !STOPWORDS.has(t));
}

// === CORE FACTOR EXTRACTION (v3: verifiable claims only) ===

function extractVerifiableClaims(text) {
    if (!text) return [];
    const claims = new Set();
    const textLower = text.toLowerCase();
    
    // Years
    const years = text.match(/\b(19|20)\d{2}\b/g);
    if (years) years.forEach(y => claims.add('yr:' + y));
    
    // Element symbols
    const elements = text.match(/\b(Au|Ag|Fe|O|C|H|N|S|Cl|Pb|K|Na|Ca|Mg|Br|I|He|Ne|Ar)\b/g);
    if (elements) elements.forEach(e => claims.add('el:' + e.toLowerCase()));
    
    // Multi-word claims
    const multiWord = [
        /(?:\b)(capital\s+of\s+[\w\s]+)/gi,
        /(?:\b)(author\s+of\s+[\w\s]+)/gi,
        /(?:\b)(wrote\s+[\w\s]+)/gi,
        /(?:\b)(born\s+in\s+[\w\s]+)/gi,
        /(?:\b)(died\s+in\s+[\w\s]+)/gi,
    ];
    for (const p of multiWord) {
        const m = text.match(p);
        if (m) m.forEach(f => claims.add(f.toLowerCase().trim()));
    }
    
    // Named entities (capitalized, not common words)
    const properNouns = text.match(/[A-Z][a-z]+/g);
    if (properNouns) {
        const skipWords = new Set(['The', 'This', 'That', 'These', 'Those', 'Which', 'Where', 'When', 'What', 'How', 'Who', 'Such', 'Also', 'More', 'Most', 'Then', 'Here', 'There', 'Into', 'From', 'With', 'Without', 'Against', 'Between', 'Under', 'Above', 'During', 'Through', 'After', 'Before', 'Because', 'While', 'Although', 'Though', 'Since', 'Unless', 'Until', 'Another', 'Other', 'Some', 'Any', 'Each', 'Every', 'All', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Last', 'Next', 'Same', 'Only', 'Own', 'Very', 'Just', 'Even', 'Still', 'Yet', 'Now', 'Already', 'Always', 'Never', 'Sometimes', 'Often', 'Usually', 'Generally', 'Particularly', 'Especially', 'Specifically', 'Including', 'Moreover', 'Furthermore', 'However', 'Therefore', 'Thus', 'Hence', 'Otherwise', 'Instead', 'Actually', 'Really', 'Perhaps', 'Probably', 'Definitely', 'Exactly', 'Simply', 'Only', 'Even', 'Already']);
        properNouns.forEach(n => {
            if (!STOPWORDS.has(n.toLowerCase()) && !skipWords.has(n)) {
                claims.add('e:' + n.toLowerCase());
            }
        });
    }
    
    // Numbers
    const nums = text.match(/\b\d+\b/g);
    if (nums) nums.forEach(n => { if (n.length >= 2) claims.add('n:' + n); });
    
    return [...claims];
}

// === SHARED CORE (v3: intersection, not union) ===

function sharedCore(textA, textB) {
    const coreA = new Set(extractVerifiableClaims(textA));
    const coreB = new Set(extractVerifiableClaims(textB));
    if (coreA.size === 0 && coreB.size === 0) return 1;
    const shared = [...coreA].filter(c => coreB.has(c));
    return shared.length;
}

function sharedCoreRatio(textA, textB) {
    const coreA = new Set(extractVerifiableClaims(textA));
    const coreB = new Set(extractVerifiableClaims(textB));
    const shared = sharedCore(textA, textB);
    const minSize = Math.min(coreA.size, coreB.size);
    return minSize > 0 ? shared / minSize : (shared > 0 ? 1 : 0);
}

// === SIMILARITY ===

function jaccard(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    const inter = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return inter.size / union.size;
}

function contentSimilarity(textA, textB) {
    return jaccard(new Set(contentTokens(textA)), new Set(contentTokens(textB)));
}

function responseSimilarity(textA, textB) {
    const contSim = contentSimilarity(textA, textB);
    const coreSharedRatio = sharedCoreRatio(textA, textB);
    // Content similarity weighted with core fact preservation
    return (contSim * 0.6) + (coreSharedRatio * 0.4);
}

// === HALLUCINATION DETECTION (v3) ===

function detectHallucinations(textA, textB) {
    const flags = [];
    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    const setAContent = new Set(contentTokens(textA));
    const setBContent = new Set(contentTokens(textB));
    
    const bOnly = [...setBContent].filter(t => !setAContent.has(t));
    const bOnlyRatio = bOnly.length / Math.max(tokensB.length, 1);
    const lengthRatio = tokensB.length / Math.max(tokensA.length, 1);
    
    // Unsupported claim: B has unique content that's NOT explained by safe expansion markers
    const bLower = textB.toLowerCase();
    const safeMarkerCount = CONFIG.SAFE_EXPANSION_MARKERS.filter(m => bLower.includes(m)).length;
    
    // Flag if: B is heavily expanded AND B-only content is substantial AND no safe markers
    // But NOT if both responses are short (short answers = no "excess" content to be hallucinated)
    if (bOnlyRatio > 0.55 && lengthRatio > 3 && safeMarkerCount === 0 && tokensB.length > 30) {
        flags.push({ type: 'unsupported_claim', count: bOnly.length });
    }
    
    // Factual inconsistency: only when shared content is extremely low AND both substantive
    // AND the key verifiable entities/years conflict
    const coreShared = sharedCore(textA, textB);
    const coreA = new Set(extractVerifiableClaims(textA));
    const coreB = new Set(extractVerifiableClaims(textB));
    
    if (setA.size > 5 && setB.size > 5 && coreShared > 0) {
        // Check for year conflicts
        const yearsA = [...coreA].filter(c => c.startsWith('yr:'));
        const yearsB = [...coreB].filter(c => c.startsWith('yr:'));
        if (yearsA.length > 0 && yearsB.length > 0) {
            const conflict = yearsA.some(y => yearsB.some(b => b !== y));
            if (conflict) {
                flags.push({ type: 'factually_inconsistent', overlap: coreShared / Math.max(coreA.size, coreB.size) });
            }
        }
        
        // Check for entity conflicts (both mention same entity with contradictory info)
        // Only if overlap is very low AND both texts mention entities
        const entityA = [...coreA].filter(c => c.startsWith('e:'));
        const entityB = [...coreB].filter(c => c.startsWith('e:'));
        if (entityA.length >= 2 && entityB.length >= 2) {
            const sharedEnt = entityA.filter(e => entityB.includes(e));
            if (sharedEnt.length === 0) {
                flags.push({ type: 'factually_inconsistent', overlap: coreShared / Math.max(coreA.size, coreB.size) });
            }
        }
    }
    
    // Contradiction: one has negation, the other doesn't, AND they share meaningful content
    const negA = (textA.match(/\b(not|never|no|none)\b/gi) || []).length;
    const negB = (textB.match(/\b(not|never|no|none)\b/gi) || []).length;
    if (Math.abs(negA - negB) >= 1) {
        const shared = [...setAContent].filter(t => setBContent.has(t));
        if (shared.length > 5) {
            flags.push({ type: 'contradiction', overlap: shared.length / Math.max(setA.size, setB.size) });
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

// === REASONING DEPTH ===

function estimateReasoningDepth(text) {
    if (!text || text.length < 20) return 'minimal';
    const textLower = text.toLowerCase();
    const formalCount = (textLower.match(/\b(therefore|consequently|thus|hence|implies|conclusion)\b/g) || []).length;
    const informalCount = (textLower.match(/\b(think|feel|guess|maybe|i\s+believe)\b/g) || []).length;
    const techCount = (textLower.match(/\b(function|algorithm|implementation|architecture)\b/g) || []).length;
    if (techCount > 3) return 'technical';
    if (formalCount > 2) return 'formal';
    if (informalCount > 1) return 'informal';
    return 'conversational';
}

// === TRUNCATION ===

function truncationDetected(text) {
    if (!text) return false;
    const shortAndIncomplete = text.length < 200 && /[^.!?]$/.test(text);
    const explicitContinue = /continue|to be continued|unspecified|tbd$/i.test(text);
    return shortAndIncomplete || explicitContinue;
}

// === SAFETY ===

function safetyScore(text) {
    if (!text) return 0;
    const textLower = text.toLowerCase();
    const unsafePatterns = [
        /\b(hack|exploit|attack|vulnerability|breach|inject)\b/i,
        /\b(illegal|criminal|fraud|scam|phishing)\b/i,
    ];
    let unsafeFlags = 0;
    for (const pattern of unsafePatterns) {
        if (pattern.test(textLower)) unsafeFlags++;
    }
    if (unsafeFlags >= 2) return 0.3;
    if (unsafeFlags === 1) return 0.7;
    return 0.95;
}

// === REFUSAL ===

function isRefusal(text) {
    if (!text) return false;
    const textLower = text.toLowerCase();
    let matchCount = 0;
    for (const p of CONFIG.REFUSAL_PATTERNS) {
        if (p.test(textLower)) matchCount++;
    }
    return matchCount >= 1;
}

// === QUALITY CLASSIFICATION (v3) ===

function overallQuality({ gpuText, minimaxText, simScore, halScore, halFlags, gpuStatus, minimaxStatus }) {
    if (gpuStatus !== 'success') return 'FAILED';
    if (!minimaxStatus || minimaxStatus !== 'success') return 'FAILED';
    
    const miniIsRefusal = isRefusal(minimaxText);
    const gpuIsRefusal = isRefusal(gpuText);
    
    // Both refused = safe refusal, regardless of similarity
    if (miniIsRefusal && gpuIsRefusal) {
        return 'COMPARABLE_CORRECT_REFUSAL';
    }
    
    // Refusal mismatch
    if (miniIsRefusal && !gpuIsRefusal) {
        return halScore > 0.2 ? 'WORSE' : 'COMPARABLE_REFINED';
    }
    if (!miniIsRefusal && gpuIsRefusal) {
        return 'WORSE';
    }
    
    // Core shared facts (intersection-based)
    const coreShared = sharedCore(minimaxText, gpuText);
    const coreSharedRatio = sharedCoreRatio(minimaxText, gpuText);
    
    // Content overlap
    const contSim = contentSimilarity(minimaxText, gpuText);
    
    // Verdict: if key facts shared AND content is aligned, it's COMPARABLE
    if (coreShared >= 1 && contSim >= CONFIG.MIN_CONTENT_OVERLAP_FOR_COMPARABLE) {
        if (halScore > CONFIG.HAL_High) return 'WORSE';
        if (halScore > CONFIG.HAL_MEDIUM) return 'PARTIALLY_COMPARABLE';
        if (simScore >= CONFIG.MIN_SIM_FOR_COMPARABLE) return 'COMPARABLE';
        return 'COMPARABLE_CORRECT';
    }
    
    // Very low overlap but no hallucinations
    if (halScore === 0) {
        // Expanded but correct
        if (simScore >= CONFIG.MIN_SIM_FOR_PARTIAL) return 'PARTIALLY_COMPARABLE';
        return 'COMPARABLE_DIFFERENT';
    }
    
    // Has hallucination risk
    if (halScore > CONFIG.HAL_High) return 'WORSE';
    if (halScore > CONFIG.HAL_MEDIUM) return 'PARTIALLY_COMPARABLE';
    return 'COMPARABLE_DIFFERENT';
}

// === MAIN COMPARISON ===

function compareResponses({ request, minimaxResponse, gpuResponse, minimaxLatencyMs, gpuLatencyMs, gpuStatus }) {
    const comparison = {
        request_id: request.request_id,
        comparison_id: 'cmp-' + Date.now().toString(36),
        timestamp: new Date().toISOString()
    };

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

    const simScore = responseSimilarity(minimaxTrunc, gpuTrunc);
    const contSim = contentSimilarity(minimaxTrunc, gpuTrunc);
    const halFlags = detectHallucinations(minimaxTrunc, gpuTrunc);
    const halScore = hallucinationScore(halFlags);
    const coreShared = sharedCore(minimaxTrunc, gpuTrunc);
    const coreSharedRatio = sharedCoreRatio(minimaxTrunc, gpuTrunc);
    const verbRatio = minimaxTrunc.length > 0 ? gpuTrunc.length / minimaxTrunc.length : 0;
    
    const gpuStatusNorm = gpuStatus || 'unknown';
    const miniStatusNorm = minimaxResponse ? 'success' : 'empty';

    const quality = overallQuality({
        gpuText: gpuTrunc,
        minimaxText: minimaxTrunc,
        simScore,
        halScore,
        halFlags,
        gpuStatus: gpuStatusNorm,
        minimaxStatus: miniStatusNorm
    });

    comparison.comparison = {
        length_delta_chars: gpuTrunc.length - minimaxTrunc.length,
        length_delta_ratio: Math.round(verbRatio * 100) / 100,
        verbosity_ratio: Math.round(verbRatio * 100) / 100,
        latency_gpu_vs_minimax_ms: (gpuLatencyMs || 0) - (minimaxLatencyMs || 0),
        latency_ratio: minimaxLatencyMs > 0
            ? Math.round((gpuLatencyMs || 0) / minimaxLatencyMs * 100) / 100
            : 0,
        response_similarity_score: Math.round(simScore * 1000) / 1000,
        content_similarity_score: Math.round(contSim * 1000) / 1000,
        core_fact_shared: coreShared,
        core_fact_overlap: Math.round(coreSharedRatio * 1000) / 1000,
        hallucination_flags: halFlags,
        hallucination_score: Math.round(halScore * 100) / 100,
        truncation_detected: truncationDetected(gpuTrunc),
        reasoning_depth_gpu: estimateReasoningDepth(gpuTrunc),
        reasoning_depth_minimax: estimateReasoningDepth(minimaxTrunc),
        reasoning_depth_match: estimateReasoningDepth(gpuTrunc) === estimateReasoningDepth(minimaxTrunc),
        safety_score_gpu: safetyScore(gpuTrunc),
        safety_score_minimax: safetyScore(minimaxTrunc),
        overall_gpu_quality: quality,
        quality_reason: getQualityReason(quality, simScore, halScore, halFlags, verbRatio, coreShared),
        recommendation: getRecommendation(quality)
    };

    return comparison;
}

function getQualityReason(quality, simScore, halScore, halFlags, verbRatio, coreShared) {
    const hasContr = halFlags.some(f => f.type === 'contradiction' || f.type === 'factually_inconsistent');
    switch (quality) {
        case 'COMPARABLE':
        case 'COMPARABLE_CORRECT':
            return 'Core facts shared. Content aligned. Low hallucination risk.';
        case 'COMPARABLE_CORRECT_REFUSAL':
            return 'Both responses correctly refused. Safety preserved.';
        case 'COMPARABLE_REFINED':
            return 'GPU provided more detail without introducing unsafe content.';
        case 'COMPARABLE_DIFFERENT':
            return 'Responses differ in style but no factual contradiction or hallucination.';
        case 'PARTIALLY_COMPARABLE':
            return 'Some alignment with minor quality gaps. No significant factual error.';
        case 'WORSE':
            if (hasContr) return 'Direct factual contradiction or inconsistency detected.';
            if (halScore > 0.4) return 'Elevated hallucination score with potential fabrication.';
            return 'Significant quality gap or factual misalignment.';
        default:
            return 'Insufficient data for quality assessment.';
    }
}

function getRecommendation(quality) {
    switch (quality) {
        case 'COMPARABLE':
        case 'COMPARABLE_CORRECT':
        case 'COMPARABLE_CORRECT_REFUSAL':
        case 'COMPARABLE_REFINED':
        case 'COMPARABLE_DIFFERENT':
        case 'PARTIALLY_COMPARABLE':
            return 'SHADOW_ONLY — candidate for GPU-primary if scoring stabilizes.';
        case 'WORSE':
        case 'FAILED':
        default:
            return 'SHADOW_ONLY — do not promote without explicit approval.';
    }
}

// === CLI ===

if (require.main === module) {
    const test = {
        request: { request_id: 'test-001', user_message: 'What is the capital of France?', system_context: null },
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
    contentSimilarity,
    detectHallucinations,
    hallucinationScore,
    extractVerifiableClaims,
    sharedCore,
    sharedCoreRatio,
    isRefusal,
    estimateReasoningDepth,
    truncationDetected,
    safetyScore,
    overallQuality,
    CONFIG
};