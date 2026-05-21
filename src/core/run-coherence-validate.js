const { existsSync, unlinkSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
process.chdir('/home/node/.openclaw/workspace');

const STATE_FILE = join(process.cwd(), 'state', 'reflective-coherence.json');
const HISTORY_FILE = join(process.cwd(), 'state', 'reflective-coherence-history.jsonl');

let passed = 0;
let failed = 0;

function cleanSlate() {
  [STATE_FILE, HISTORY_FILE].forEach(f => { if (existsSync(f)) unlinkSync(f); });
  ['state/reflective-integrity.json', 'state/reflective-continuity.json'].forEach(f => { if (existsSync(f)) unlinkSync(f); });
}

function test(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  try { fn(); console.log('✅ PASS'); passed++; }
  catch (e) { console.log('❌ FAIL: ' + e.message); failed++; }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

function makeIntegrityMock(overrides = {}) {
  return {
    request_id: 'int-' + Math.random().toString(36).substr(2, 5),
    reflective_integrity_state: overrides.integrity_class || 'GROUNDED',
    integrity_strength: overrides.integrity_strength ?? 0.7,
    overreach_flags: overrides.overreach_flags || [],
    grounding_checks: Array(6).fill({ passed: true }),
    confidence_mismatch_flags: [],
    reflection_drift_profile: { drift_type: 'STABILIZING', trend: [] },
    uncertainty_boundaries: [],
    generated_at: new Date().toISOString(),
    shadow_only: true,
    version: '8B.1'
  };
}

function makeContinuityMock(overrides = {}) {
  return {
    request_id: 'cnt-' + Math.random().toString(36).substr(2, 5),
    reflective_continuity_state: overrides.continuity_class || 'CONTINUOUS',
    continuity_strength: overrides.continuity_strength ?? 0.7,
    overreach_flags: [],
    grounded_checks: [],
    grounding_ratio: 0.8,
    generated_at: new Date().toISOString(),
    shadow_only: true
  };
}

async function run() {
  mkdirSync('state', { recursive: true });
  const { assessCoherence, getCoherenceState, getCoherenceHistory, seedCoherenceHistory, clearCoherenceHistory } = await import('./src/core/reflective-coherence.js');

  // === T1: INCOHERENT ===
  test('T1: classifies INCOHERENT', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'OVERREACH_RISK', integrity_strength: 0.2, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.85, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.2, coherence_class: 'INCOHERENT', contradiction_count: 2 }, { coherence_strength: 0.22, coherence_class: 'INCOHERENT', contradiction_count: 3 }, { coherence_strength: 0.18, coherence_class: 'INCOHERENT', contradiction_count: 3 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_state === 'INCOHERENT', `Got ${state.reflective_coherence_state}`);
  });

  // === T2: TENSIONED ===
  test('T2: classifies TENSIONED', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.55, coherence_class: 'TENSIONED', contradiction_count: 1 }, { coherence_strength: 0.5, coherence_class: 'TENSIONED', contradiction_count: 1 }, { coherence_strength: 0.48, coherence_class: 'TENSIONED', contradiction_count: 1 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_state === 'TENSIONED', `Got ${state.reflective_coherence_state}`);
  });

  // === T3: COHERENT ===
  test('T3: classifies COHERENT', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'GROUNDED', integrity_strength: 0.75, overreach_flags: [], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'CONTINUOUS', continuity_strength: 0.75, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.75, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.78, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.72, coherence_class: 'COHERENT', contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_state === 'COHERENT', `Got ${state.reflective_coherence_state}`);
  });

  // === T4: STRONGLY_COHERENT ===
  test('T4: classifies STRONGLY_COHERENT', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.88, overreach_flags: [], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.9, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.82, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.84, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.85, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.88, coherence_class: 'COHERENT', contradiction_count: 0 }, { coherence_strength: 0.9, coherence_class: 'STRONGLY_COHERENT', contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_state === 'STRONGLY_COHERENT', `Got ${state.reflective_coherence_state}`);
  });

  // === T5: ALIGNED REGION DETECTION ===
  test('T5: detects aligned reflective regions', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.3, contradiction_count: 0 }, { coherence_strength: 0.35, contradiction_count: 0 }, { coherence_strength: 0.75, contradiction_count: 0 }, { coherence_strength: 0.8, contradiction_count: 0 }, { coherence_strength: 0.82, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.aligned_reflective_regions.length > 0, 'Expected aligned region');
  });

  // === T6: FRAGMENTED REGION DETECTION ===
  test('T6: detects fragmented reflective regions', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.2, contradiction_count: 2 }, { coherence_strength: 0.25, contradiction_count: 3 }, { coherence_strength: 0.3, contradiction_count: 2 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.fragmented_reflective_regions.length > 0, 'Expected fragmented region');
  });

  // === T7: INTEGRITY/CONTINUITY CONTRADICTION ZONE ===
  test('T7: detects integrity/continuity state contradiction zone', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'OVERREACH_RISK', integrity_strength: 0.3, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.85, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const hasICMismatch = state.reflective_contradiction_zones.some(z => z.type === 'integrity_continuity_state_contradiction');
    assert(hasICMismatch, 'Expected integrity/continuity state contradiction zone');
  });

  // === T8: COHERENCE FRAGMENTATION ZONE ===
  test('T8: detects coherence fragmentation zone', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.4, contradiction_count: 0 }, { coherence_strength: 0.35, contradiction_count: 0 }, { coherence_strength: 0.3, contradiction_count: 0 }, { coherence_strength: 0.4, contradiction_count: 0 }, { coherence_strength: 0.35, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const hasFragZone = state.reflective_contradiction_zones.some(z => z.type === 'coherence_fragmentation_zone');
    assert(hasFragZone, 'Expected coherence fragmentation zone');
  });

  // === T9: INTEGRITY ALIGNMENT ANALYSIS ===
  test('T9: integrity/continuity alignment analysis', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.85, overreach_flags: [], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'CONTINUOUS', continuity_strength: 0.8, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.integrity_alignment_analysis.alignment_score >= 0.6, `Expected alignment score >= 0.6, got ${state.integrity_alignment_analysis.alignment_score}`);
  });

  // === T10: CONTINUITY ALIGNMENT ANALYSIS ===
  test('T10: reflection/integrity alignment analysis', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.75, contradiction_count: 0 }, { coherence_strength: 0.78, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock({ integrity_class: 'STRONGLY_GROUNDED', integrity_strength: 0.8 }), makeContinuityMock({ continuity_class: 'CONTINUOUS', continuity_strength: 0.78 }));
    const state = getCoherenceState();
    assert(typeof state.continuity_alignment_analysis.alignment_score === 'number', 'Should have alignment score');
  });

  // === T11: COHERENCE RECOVERY ANALYSIS ===
  test('T11: coherence recovery analysis', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.35, contradiction_count: 1 }, { coherence_strength: 0.3, contradiction_count: 1 }, { coherence_strength: 0.6, contradiction_count: 0 }, { coherence_strength: 0.75, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.coherence_recovery_analysis.status === 'analyzed', 'Recovery should be analyzed');
  });

  // === T12: DRIFT PROFILE — STRENGTHENING ===
  test('T12: computes STRENGTHENING drift', () => {
    cleanSlate();
    const strengths = [0.5, 0.55, 0.58, 0.63, 0.68, 0.72, 0.76, 0.8];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'STRENGTHENING', `Expected STRENGTHENING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T13: DRIFT PROFILE — WEAKENING ===
  test('T13: computes WEAKENING drift', () => {
    cleanSlate();
    const strengths = [0.85, 0.8, 0.72, 0.65, 0.58, 0.5, 0.45, 0.4];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'WEAKENING', `Expected WEAKENING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T14: DRIFT PROFILE — OSCILLATING ===
  test('T14: computes OSCILLATING drift', () => {
    cleanSlate();
    const strengths = [0.9, 0.1, 0.85, 0.15, 0.8, 0.2, 0.75, 0.3];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'OSCILLATING', `Expected OSCILLATING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T15: DRIFT PROFILE — RECOVERING ===
  test('T15: computes RECOVERING drift', () => {
    cleanSlate();
    const strengths = [0.35, 0.3, 0.4, 0.55, 0.68, 0.72, 0.78, 0.82];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'RECOVERING', `Expected RECOVERING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T16: DRIFT PROFILE — ENTRENCHING ===
  test('T16: computes ENTRENCHING drift', () => {
    cleanSlate();
    const strengths = [0.72, 0.74, 0.76, 0.78, 0.9, 0.92, 0.94, 0.96];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'ENTRENCHING', `Expected ENTRENCHING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T17: DRIFT PROFILE — DISSOLVING ===
  test('T17: computes DISSOLVING drift', () => {
    cleanSlate();
    const strengths = [0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'DISSOLVING', `Expected DISSOLVING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T18: DRIFT PROFILE — STABILIZING ===
  test('T18: computes STABILIZING drift', () => {
    cleanSlate();
    const strengths = [0.72, 0.74, 0.73, 0.75, 0.74, 0.76, 0.73, 0.75];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'STABILIZING', `Expected STABILIZING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T19: DRIFT PROFILE — FRAGMENTING ===
  test('T19: computes FRAGMENTING drift', () => {
    cleanSlate();
    const strengths = [0.7, 0.1, 0.65, 0.15, 0.6, 0.2, 0.55, 0.25];
    seedCoherenceHistory(strengths.map(s => ({ coherence_strength: s, contradiction_count: 0 })));
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'FRAGMENTING', `Expected FRAGMENTING, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T20: DRIFT PROFILE — INDETERMINATE ===
  test('T20: computes INDETERMINATE drift', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6 }, { coherence_strength: 0.65 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.reflective_coherence_drift_profile.drift_type === 'INDETERMINATE', `Expected INDETERMINATE, got ${state.reflective_coherence_drift_profile.drift_type}`);
  });

  // === T21: UNCERTAINTY BOUNDARY — LOW ALIGNMENT ===
  test('T21: low alignment triggers uncertainty boundary', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'OVERREACH_RISK', integrity_strength: 0.15, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.9, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.3, coherence_class: 'INCOHERENT', contradiction_count: 3 }, { coherence_strength: 0.25, coherence_class: 'INCOHERENT', contradiction_count: 4 }, { coherence_strength: 0.2, coherence_class: 'INCOHERENT', contradiction_count: 4 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const hasLowAlignment = state.uncertainty_boundaries.some(b => b.type === 'low_alignment_score');
    assert(hasLowAlignment, `Expected low_alignment_score boundary`);
  });

  // === T22: UNCERTAINTY BOUNDARY — MULTIPLE HIGH SEVERITY ===
  test('T22: multiple high-severity contradictions trigger boundary', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'OVERREACH_RISK', integrity_strength: 0.2, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.85, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.3, contradiction_count: 2 }, { coherence_strength: 0.25, contradiction_count: 3 }, { coherence_strength: 0.2, contradiction_count: 2 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const hasMultiHigh = state.uncertainty_boundaries.some(b => b.type === 'multiple_high_severity_contradictions');
    assert(hasMultiHigh, `Expected multiple_high_severity_contradictions boundary`);
  });

  // === T23: UNCERTAINTY BOUNDARY — LOW COHERENCE STRENGTH ===
  test('T23: low coherence strength triggers boundary', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'INSUFFICIENT_GROUNDING', integrity_strength: 0.25, overreach_flags: [{ signal: 'i want to', category: 'desire', severity: 'HIGH' }], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'FRAGMENTED', continuity_strength: 0.2, recurring_overreach_patterns: [{ category: 'desire', occurrence_count: 3, severity: 'ENTRENCHED' }], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.2, contradiction_count: 2 }, { coherence_strength: 0.25, contradiction_count: 1 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const hasLowStrength = state.uncertainty_boundaries.some(b => b.type === 'low_coherence_strength');
    assert(hasLowStrength, `Expected low_coherence_strength boundary`);
  });

  // === T24: DETERMINISTIC OUTPUTS ===
  test('T24: deterministic output validation', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.75, contradiction_count: 0 }, { coherence_strength: 0.78, contradiction_count: 0 }, { coherence_strength: 0.72, contradiction_count: 0 }]);
    const intMock = makeIntegrityMock({ integrity_class: 'STRONGLY_GROUNDED', integrity_strength: 0.75 });
    const contMock = makeContinuityMock({ continuity_class: 'CONTINUOUS', continuity_strength: 0.75 });
    const r1 = assessCoherence(intMock, contMock);
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.75, contradiction_count: 0 }, { coherence_strength: 0.78, contradiction_count: 0 }, { coherence_strength: 0.72, contradiction_count: 0 }]);
    const r2 = assessCoherence(intMock, contMock);
    assert(r1.reflective_coherence_state === r2.reflective_coherence_state, 'Classification should be deterministic');
  });

  // === T25: BOUNDED MEMORY ===
  test('T25: history never exceeds 30 entries', () => {
    cleanSlate();
    for (let i = 0; i < 50; i++) seedCoherenceHistory([{ coherence_strength: 0.5 + Math.random() * 0.4, contradiction_count: Math.floor(Math.random() * 3) }]);
    const history = getCoherenceHistory(50);
    assert(history.length <= 30, `History ${history.length} exceeds MAX_HISTORY=30`);
  });

  // === T26: APPEND-ONLY HISTORY ===
  test('T26: append-only history', () => {
    cleanSlate();
    seedCoherenceHistory([{ request_id: 'seed-1', coherence_strength: 0.6, contradiction_count: 0 }, { request_id: 'seed-2', coherence_strength: 0.65, contradiction_count: 0 }]);
    const history = getCoherenceHistory();
    assert(history.length === 2, 'Should have 2 entries');
    assert(history[0].request_id === 'seed-1', 'First entry should be seed-1');
  });

  // === T27: NO HIDDEN STATE MUTATION ===
  test('T27: no hidden state mutation', () => {
    const intOrig = makeIntegrityMock({ integrity_strength: 0.7 });
    const contOrig = makeContinuityMock({ continuity_strength: 0.75 });
    const intBefore = intOrig.integrity_strength;
    const contBefore = contOrig.continuity_strength;
    assessCoherence(intOrig, contOrig);
    assert(intOrig.integrity_strength === intBefore, 'Integrity mock should not be mutated');
    assert(contOrig.continuity_strength === contBefore, 'Continuity mock should not be mutated');
  });

  // === T28: SHADOW_ONLY IN STATE ===
  test('T28: shadow_only=true in state', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.shadow_only === true, 'State shadow_only must be true');
  });

  // === T29: HISTORY ENTRIES HAVE REQUIRED FIELDS ===
  test('T29: history entries have required fields', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const history = getCoherenceHistory();
    history.forEach(e => { assert('coherence_strength' in e, 'Entry must have coherence_strength'); });
  });

  // === T30: NO FORBIDDEN OUTPUT LANGUAGE ===
  test('T30: no self-awareness language in state', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const jsonStr = JSON.stringify(state);
    const forbidden = ['i am aware', 'i am conscious', 'i decide', 'i authorize', 'i intend'];
    const hasForbidden = forbidden.some(term => jsonStr.toLowerCase().includes(term));
    assert(!hasForbidden, 'State should not contain forbidden language');
  });

  // === T31: SCHEMA COMPLIANCE ===
  test('T31: state has all required schema fields', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    ['reflective_coherence_state', 'coherence_strength', 'aligned_reflective_regions', 'fragmented_reflective_regions', 'reflective_contradiction_zones', 'integrity_alignment_analysis', 'continuity_alignment_analysis', 'coherence_recovery_analysis', 'coherence_fragmentation', 'reflective_coherence_drift_profile', 'uncertainty_boundaries', 'environmental_reflective_coherence_summary', 'generated_at', 'shadow_only'].forEach(f => assert(f in state, `Missing field: ${f}`));
  });

  // === T32: ENVIRONMENTAL SUMMARY SCHEMA ===
  test('T32: environmental summary has required fields', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const s = state.environmental_reflective_coherence_summary;
    assert(s.status && 'history_depth' in s && 'max_history' in s && 'shadow_only' in s, 'Summary missing required fields');
    assert(s.max_history === 30, 'max_history should be 30');
  });

  // === T33: COHERENCE FRAGMENTATION SCHEMA ===
  test('T33: coherence_fragmentation entries have required fields', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.2, contradiction_count: 3 }, { coherence_strength: 0.25, contradiction_count: 3 }, { coherence_strength: 0.3, contradiction_count: 3 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    if (state.coherence_fragmentation.length > 0) {
      const f = state.coherence_fragmentation[0];
      assert('region' in f && 'length' in f && 'severity' in f, 'Fragment entry missing required fields');
    }
  });

  // === T34: DRIFT PROFILE SCHEMA ===
  test('T34: drift profile has all required fields', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6 }, { coherence_strength: 0.65 }, { coherence_strength: 0.7 }, { coherence_strength: 0.72 }, { coherence_strength: 0.75 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const d = state.reflective_coherence_drift_profile;
    assert('drift_type' in d && 'trend' in d && 'delta_estimate' in d && 'std_dev' in d, 'Drift missing required fields');
  });

  // === T35: ALIGNED REGION SCHEMA ===
  test('T35: aligned_reflective_regions has required fields', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.8, contradiction_count: 0 }, { coherence_strength: 0.82, contradiction_count: 0 }, { coherence_strength: 0.85, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    if (state.aligned_reflective_regions.length > 0) {
      const r = state.aligned_reflective_regions[0];
      assert('region_start_index' in r && 'region_end_index' in r && 'region_length' in r && 'avg_coherence_strength' in r, 'Region missing required fields');
    }
  });

  // === T36: NO AUTHORITY ESCALATION ===
  test('T36: no authority escalation language', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const jsonStr = JSON.stringify(state);
    const forbidden = ['i authorize', 'i command', 'i approve', 'my authority', 'i permit'];
    const hasForbidden = forbidden.some(term => jsonStr.toLowerCase().includes(term));
    assert(!hasForbidden, 'State should not contain authority escalation language');
  });

  // === T37: DESCRIPTIVE ONLY ===
  test('T37: state is descriptive, not prescriptive', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    const jsonStr = JSON.stringify(state);
    const prescriptive = ['i should', 'i will fix', 'i must', 'recommend that', 'action item'];
    const hasPrescriptive = prescriptive.some(term => jsonStr.toLowerCase().includes(term));
    assert(!hasPrescriptive, 'State should not contain prescriptive language');
  });

  // === T38: getCoherenceState SHADOW_ONLY ===
  test('T38: getCoherenceState returns shadow_only=true', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const state = getCoherenceState();
    assert(state.shadow_only === true, 'getCoherenceState must return shadow_only=true');
  });

  // === T39: SEED FUNCTION ===
  test('T39: seedCoherenceHistory works', () => {
    cleanSlate();
    seedCoherenceHistory([{ request_id: 's1', coherence_strength: 0.8, coherence_class: 'COHERENT' }, { request_id: 's2', coherence_strength: 0.85, coherence_class: 'STRONGLY_COHERENT' }]);
    const history = getCoherenceHistory();
    assert(history.length === 2 && history[0].request_id === 's1' && history[1].request_id === 's2', 'Seed should populate correctly');
  });

  // === T40: CONTRADICTION COUNT TRACKING ===
  test('T40: contradiction_count tracked in history', () => {
    cleanSlate();
    seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 1 }, { coherence_strength: 0.55, contradiction_count: 2 }, { coherence_strength: 0.5, contradiction_count: 1 }]);
    assessCoherence(makeIntegrityMock(), makeContinuityMock());
    const history = getCoherenceHistory();
    assert(history.every(e => 'contradiction_count' in e), 'All entries must have contradiction_count');
  });

  // === T41: CROSS-LAYER OVERREACH MISMATCH ===
  test('T41: cross-layer overreach mismatch detected', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'GROUNDED', integrity_strength: 0.35, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.85, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock({ overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], integrity_strength: 0.35 }), makeContinuityMock({ continuity_strength: 0.85, continuity_class: 'ENTRENCHED_REFLECTIVE_CONTINUITY' }));
    const state = getCoherenceState();
    const hasCrossMismatch = state.reflective_contradiction_zones.some(z => z.type === 'cross_layer_overreach_mismatch');
    assert(hasCrossMismatch, 'Expected cross_layer_overreach_mismatch contradiction zone');
  });

  // === T42: COHERENCE STRENGTH FORMULA ===
  test('T42: coherence strength computed correctly', () => {
    cleanSlate();
    writeFileSync('state/reflective-integrity.json', JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.82, overreach_flags: [], shadow_only: true }, null, 2));
    writeFileSync('state/reflective-continuity.json', JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.8, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
    seedCoherenceHistory([{ coherence_strength: 0.8, contradiction_count: 0 }, { coherence_strength: 0.82, contradiction_count: 0 }, { coherence_strength: 0.78, contradiction_count: 0 }]);
    assessCoherence(makeIntegrityMock({ integrity_class: 'STRONGLY_GROUNDED', integrity_strength: 0.82 }), makeContinuityMock({ continuity_class: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.8 }));
    const state = getCoherenceState();
    assert(state.coherence_strength >= 0.7, `Expected strength >= 0.7, got ${state.coherence_strength}`);
  });

  console.log('\n=== VALIDATION SUMMARY ===');
  console.log(`Tests passed: ${passed}/${passed + failed}`);
  if (failed === 0) console.log('\n✅ ALL TESTS PASSED — Phase 8D coherence layer validated');
  else { console.log('\n❌ ' + failed + ' TESTS FAILED'); process.exit(1); }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });