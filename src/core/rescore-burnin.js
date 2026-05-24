/**
 * Re-score 25 burn-in entries with calibrated comparison engine (v3)
 */

import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { compareResponses } = require('/home/node/.openclaw/workspace/src/core/gpu-shadow-comparison.js');

const EVIDENCE_LOG = '/home/node/.openclaw/workspace/moosa-worker/state/gpu-shadow-evidence-log.jsonl';

async function main() {
    const entries = [];
    const raw = fs.readFileSync(EVIDENCE_LOG, 'utf8');
    for (const line of raw.trim().split('\n')) {
        try { entries.push(JSON.parse(line)); } catch {}
    }

    const recent = entries.slice(-25);
    
    console.log('=== CALIBRATED v3 RE-SCORING: 25 BURNS ===\n');
    
    const before = {};
    const after = {};
    const results = [];
    
    for (const e of recent) {
        const minimax = e.minimax_response || '';
        const gpu = e.gpu_response || '';
        const gpuLat = e.gpu_latency_ms || 0;
        const cat = e.cat || 'unknown';
        
        const comparison = compareResponses({
            request: {
                request_id: 'rescore-' + Date.now().toString(36),
                user_message: e.msg_preview || '',
                system_context: null
            },
            minimaxResponse: minimax,
            gpuResponse: gpu,
            minimaxLatencyMs: 0,
            gpuLatencyMs: gpuLat,
            gpuStatus: e.gpu_status || 'success'
        });
        
        const q = comparison.comparison.overall_gpu_quality;
        const sim = comparison.comparison.response_similarity_score;
        const contSim = comparison.comparison.content_similarity_score;
        const hal = comparison.comparison.hallucination_score;
        const halFlags = comparison.comparison.hallucination_flags || [];
        const coreShared = comparison.comparison.core_fact_shared;
        const coreRatio = comparison.comparison.core_fact_overlap;
        
        before[e.overall_quality] = (before[e.overall_quality] || 0) + 1;
        after[q] = (after[q] || 0) + 1;
        
        results.push({ cat, before: e.overall_quality, after: q, sim, contSim, hal, coreShared, coreRatio });
        
        const icon = (q === 'WORSE' || q === 'FAILED') ? 'X' : (q.includes('COMPARABLE') || q.includes('PARTIALLY')) ? 'V' : '?';
        const line = icon + ' ' + cat.toUpperCase().padEnd(12) + ' before=' + String(e.overall_quality).padEnd(25) + ' after=' + String(q).padEnd(28) + ' sim=' + sim.toFixed(3) + ' cont=' + contSim.toFixed(3) + ' core=' + coreShared + '/' + coreRatio.toFixed(2) + ' hal=' + hal.toFixed(2);
        process.stdout.write(line + '\n');
    }
    
    console.log('\n=== BEFORE (v1/D-2.12c) ===');
    for (const [k, v] of Object.entries(before)) {
        console.log('  ' + String(k).padEnd(25) + ': ' + v);
    }
    
    console.log('\n=== AFTER (calibrated v3) ===');
    for (const [k, v] of Object.entries(after)) {
        console.log('  ' + String(k).padEnd(28) + ': ' + v);
    }
    
    const worse = Object.entries(after).filter(([k]) => k === 'WORSE' || k === 'FAILED').reduce((s, [,v]) => s+v, 0);
    const comparable = Object.entries(after).filter(([k]) => k.includes('COMPARABLE') && !k.includes('WORSE')).reduce((s, [,v]) => s+v, 0);
    const partial = Object.entries(after).filter(([k]) => k.includes('PARTIALLY')).reduce((s, [,v]) => s+v, 0);
    console.log('\n=== SUMMARY ===');
    console.log('  COMPARABLE (all types): ' + comparable + '/25');
    console.log('  PARTIALLY_COMPARABLE: ' + partial + '/25');
    console.log('  WORSE/FAILED: ' + worse + '/25');
}

main().catch(console.error);