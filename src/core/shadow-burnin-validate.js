/**
 * Shadow Burn-In Validation — Phase D-2.8
 */

const fs = require('fs');
const path = require('path');
const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const { computeWindowSummaries, detectDegradation, computeConfidenceScores } = require('./shadow-longitudinal-tracker.js');

console.log('=== D-2.8 Validation ===\n');

// Test data
const obs = [
    {gpu:{status:'success',latency_ms:800},comparison:{hallucination_score:0.05,response_similarity_score:0.85},timestamp:new Date().toISOString()},
    {gpu:{status:'success',latency_ms:750},comparison:{hallucination_score:0.1,response_similarity_score:0.80},timestamp:new Date(Date.now()-30*60000).toISOString()},
    {gpu:{status:'timeout',latency_ms:180000},comparison:{hallucination_score:0,response_similarity_score:0},timestamp:new Date(Date.now()-7200000).toISOString()},
    {gpu:{status:'success',latency_ms:900},comparison:{hallucination_score:0.15,response_similarity_score:0.75},timestamp:new Date(Date.now()-18000000).toISOString()}
];

// Test 1: Window summaries
const s = computeWindowSummaries(obs);
console.log('T1 Window summaries:', s['1h'].observationCount, 'obs,', s['1h'].gpuAvailabilityPct, '% avail,', s['1h'].avgLatencyMs, 'ms avg');
console.log(s['1h'].observationCount===4 ? '  ✅ PASS' : '  ❌ FAIL');

// Test 2: Nominal degradation
const base = {avgHallucinationRate:0.1,avgSemanticDriftPct:15,avgTimeoutRate:0.05,avgLatencyMs:800,avgMalformedRate:0.02,observationCount:10,establishedAt:new Date().toISOString()};
const met = {hallucinationRate:0.12,semanticDriftPct:18,timeoutRate:0.04,avgLatencyMs:820,malformedResponseRate:0.02};
const {status:ns} = detectDegradation(base,met,obs);
console.log('\nT2 Nominal degrade:', ns.degraded, ns.alertLevel);
console.log(!ns.degraded && ns.alertLevel==='NOMINAL' ? '  ✅ PASS' : '  ❌ FAIL');

// Test 3: HIGH degradation
const dmet = {hallucinationRate:0.45,semanticDriftPct:45,timeoutRate:0.20,avgLatencyMs:2000,malformedResponseRate:0.15};
const {status:ds,events:de} = detectDegradation(base,dmet,obs);
console.log('\nT3 HIGH degrade:', ds.degraded, ds.alertLevel, de.length, 'events');
console.log(ds.degraded && ds.alertLevel==='HIGH' ? '  ✅ PASS' : '  ❌ FAIL');

// Test 4: Confidence scores
const cs = computeConfidenceScores(base,met,obs);
console.log('\nT4 Confidence:', cs.operational+'%', cs.stability+'%', cs.overall+'%');
console.log(cs.overall >= 50 ? '  ✅ PASS' : '  ❌ FAIL');

// Test 5: Tracker run
const {runLongitudinalUpdate} = require('./shadow-longitudinal-tracker.js');
const r = runLongitudinalUpdate();
console.log('\nT5 Tracker run:', Object.keys(r.windowSummaries).join(','), 'windows, conf:', r.confidenceScores.overall+'%');
console.log(r.windowSummaries && r.confidenceScores ? '  ✅ PASS' : '  ❌ FAIL');

// Test 6: Persistence
const cf = path.join(STATE_DIR,'shadow-confidence-scores.json');
const sf = path.join(STATE_DIR,'shadow-longitudinal-summaries/latest.json');
console.log('\nT6 Persistence:', fs.existsSync(cf) ? '✅' : '❌', fs.existsSync(sf) ? '✅' : '❌');
console.log(fs.existsSync(cf) && fs.existsSync(sf) ? '  ✅ PASS' : '  ❌ FAIL');

console.log('\n=== DONE ===');