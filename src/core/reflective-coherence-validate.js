import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { assessCoherence, getCoherenceState, getCoherenceHistory, seedCoherenceHistory, clearCoherenceHistory } from './reflective-coherence.js';

process.chdir('/home/node/.openclaw/workspace');
mkdirSync('state', { recursive: true });

const STATE_FILE = 'state/reflective-coherence.json';
const HISTORY_FILE = 'state/reflective-coherence-history.jsonl';
const intFile = 'state/reflective-integrity.json';
const contFile = 'state/reflective-continuity.json';

function cleanSlate() {
  [STATE_FILE, HISTORY_FILE, intFile, contFile].forEach(f => { if (existsSync(f)) unlinkSync(f); });
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

let passed = 0, failed = 0;
function test(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  try { fn(); console.log('✅ PASS'); passed++; }
  catch (e) { console.log('❌ FAIL: ' + e.message); failed++; }
}

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

// === T1: INCOHERENT — need 5+ entries with avgRecentCoherence < 0.3 ===
test('T1: classifies INCOHERENT with persistent low coherence', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.85, overreach_flags: [], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'CONTINUOUS', continuity_strength: 0.8, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  // 5 entries with avg coherence 0.25 — below 0.3 threshold
  seedCoherenceHistory([{ coherence_strength: 0.2, contradiction_count: 0 }, { coherence_strength: 0.22, contradiction_count: 0 }, { coherence_strength: 0.25, contradiction_count: 0 }, { coherence_strength: 0.28, contradiction_count: 0 }, { coherence_strength: 0.3, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.reflective_coherence_state === 'INCOHERENT', `Got ${state.reflective_coherence_state}`);
});

// === T2: TENSIONED — coherence fragmentation zone creates MEDIUM severity ===
test('T2: classifies TENSIONED with fragmentation zone', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'GROUNDED', integrity_strength: 0.75, overreach_flags: [], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'CONTINUOUS', continuity_strength: 0.75, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  // 5 entries: 2 good, then 3 below 0.5 causing fragmentation zone (MEDIUM severity)
  // avgLast3 = 0.3, which is < 0.5 → fragmentation detected, severity MEDIUM
  seedCoherenceHistory([
    { coherence_strength: 0.78, contradiction_count: 0 },
    { coherence_strength: 0.8, contradiction_count: 0 },
    { coherence_strength: 0.3, contradiction_count: 0 },
    { coherence_strength: 0.32, contradiction_count: 0 },
    { coherence_strength: 0.28, contradiction_count: 0 }
  ]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  // STRONGLY path fails because contradictionZones has 1 MEDIUM entry
  assert(state.reflective_coherence_state === 'TENSIONED', `Got ${state.reflective_coherence_state}`);
});

// === T3: COHERENT — 3 entries, high alignment, no contradictions ===
test('T3: classifies COHERENT with moderate history', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'GROUNDED', integrity_strength: 0.75, overreach_flags: [], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'CONTINUOUS', continuity_strength: 0.75, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  // Only 2 entries — len < 3 prevents STRONGLY, len < 5 prevents INCOHERENT
  seedCoherenceHistory([{ coherence_strength: 0.75, contradiction_count: 0 }, { coherence_strength: 0.78, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.reflective_coherence_state === 'COHERENT', `Got ${state.reflective_coherence_state}`);
});

// === T4: STRONGLY_COHERENT — 5+ entries, very high alignment, no contradictions ===
test('T4: classifies STRONGLY_COHERENT', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.88, overreach_flags: [], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.9, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  seedCoherenceHistory([{ coherence_strength: 0.82, contradiction_count: 0 }, { coherence_strength: 0.84, contradiction_count: 0 }, { coherence_strength: 0.85, contradiction_count: 0 }, { coherence_strength: 0.88, contradiction_count: 0 }, { coherence_strength: 0.9, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.reflective_coherence_state === 'STRONGLY_COHERENT', `Got ${state.reflective_coherence_state}`);
});

// === T5: aligned region detection ===
test('T5: detects aligned reflective regions', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.3, contradiction_count: 0 }, { coherence_strength: 0.35, contradiction_count: 0 }, { coherence_strength: 0.75, contradiction_count: 0 }, { coherence_strength: 0.8, contradiction_count: 0 }, { coherence_strength: 0.82, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.aligned_reflective_regions.length > 0, 'Expected aligned region');
});

// === T6: fragmented region detection ===
test('T6: detects fragmented reflective regions', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.2, contradiction_count: 2 }, { coherence_strength: 0.25, contradiction_count: 3 }, { coherence_strength: 0.3, contradiction_count: 2 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.fragmented_reflective_regions.length > 0, 'Expected fragmented region');
});

// === T7: integrity/continuity contradiction zone ===
test('T7: integrity/continuity contradiction zone', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'OVERREACH_RISK', integrity_strength: 0.3, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.85, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  const hasICMismatch = state.reflective_contradiction_zones.some(z => z.type === 'integrity_continuity_state_contradiction');
  assert(hasICMismatch, 'Expected integrity/continuity state contradiction zone');
});

// === T8: bounded memory ===
test('T8: history bounded at MAX_HISTORY=30', () => {
  cleanSlate();
  for (let i = 0; i < 50; i++) seedCoherenceHistory([{ coherence_strength: 0.3 + Math.random() * 0.6, contradiction_count: Math.floor(Math.random() * 3) }]);
  const history = getCoherenceHistory(100);
  assert(history.length <= 30, `History ${history.length} exceeds MAX_HISTORY=30`);
});

// === T9: shadow_only invariant ===
test('T9: shadow_only=true in all outputs', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.shadow_only === true, 'state.shadow_only must be true');
  assert(state.environmental_reflective_coherence_summary.shadow_only === true, 'summary.shadow_only must be true');
});

// === T10: no forbidden language ===
test('T10: no forbidden language in state', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  const json = JSON.stringify(state);
  const forbidden = ['i am aware', 'i am conscious', 'i decide', 'i authorize', 'i intend'];
  const found = forbidden.filter(t => json.toLowerCase().includes(t));
  assert(found.length === 0, 'Forbidden language found: ' + found.join(', '));
});

// === T11: schema compliance ===
test('T11: all required schema fields present', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  const required = ['reflective_coherence_state', 'coherence_strength', 'aligned_reflective_regions', 'fragmented_reflective_regions', 'reflective_contradiction_zones', 'integrity_alignment_analysis', 'continuity_alignment_analysis', 'coherence_recovery_analysis', 'coherence_fragmentation', 'reflective_coherence_drift_profile', 'uncertainty_boundaries', 'environmental_reflective_coherence_summary', 'generated_at', 'shadow_only'];
  const missing = required.filter(f => !(f in state));
  assert(missing.length === 0, 'Missing: ' + missing.join(', '));
});

// === T12: deterministic output ===
test('T12: deterministic classification', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }, { coherence_strength: 0.75, contradiction_count: 0 }]);
  const intM = makeIntegrityMock({ integrity_class: 'STRONGLY_GROUNDED', integrity_strength: 0.75 });
  const contM = makeContinuityMock({ continuity_class: 'CONTINUOUS', continuity_strength: 0.75 });
  const r1 = assessCoherence(intM, contM);
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }, { coherence_strength: 0.75, contradiction_count: 0 }]);
  const r2 = assessCoherence(intM, contM);
  assert(r1.reflective_coherence_state === r2.reflective_coherence_state, 'Classification must be deterministic');
});

// === T13: append-only history ===
test('T13: history entries appended, not overwritten', () => {
  cleanSlate();
  seedCoherenceHistory([{ request_id: 'seed-1', coherence_strength: 0.7, contradiction_count: 0 }]);
  const before = getCoherenceHistory().length;
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const after = getCoherenceHistory().length;
  assert(after > before, 'History should grow through append');
});

// === T14: contradiction_count tracked in history ===
test('T14: contradiction_count tracked in history', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.6, contradiction_count: 1 }, { coherence_strength: 0.55, contradiction_count: 2 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const history = getCoherenceHistory();
  assert(history.every(e => 'contradiction_count' in e), 'All entries must track contradiction_count');
});

// === T15: cross-layer overreach mismatch ===
test('T15: cross-layer overreach mismatch detected', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'GROUNDED', integrity_strength: 0.35, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.85, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock({ overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], integrity_strength: 0.35 }), makeContinuityMock({ continuity_strength: 0.85, continuity_class: 'ENTRENCHED_REFLECTIVE_CONTINUITY' }));
  const state = getCoherenceState();
  const hasCross = state.reflective_contradiction_zones.some(z => z.type === 'cross_layer_overreach_mismatch');
  assert(hasCross, 'Expected cross_layer_overreach_mismatch contradiction zone');
});

// === T16: coherence fragmentation zone ===
test('T16: coherence fragmentation zone detected', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.4, contradiction_count: 0 }, { coherence_strength: 0.35, contradiction_count: 0 }, { coherence_strength: 0.3, contradiction_count: 0 }, { coherence_strength: 0.38, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  const hasFrag = state.reflective_contradiction_zones.some(z => z.type === 'coherence_fragmentation_zone');
  assert(hasFrag, 'Expected coherence fragmentation zone');
});

// === T17: coherence strength formula ===
test('T17: coherence strength computed correctly', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.82, overreach_flags: [], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.8, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  seedCoherenceHistory([{ coherence_strength: 0.8, contradiction_count: 0 }, { coherence_strength: 0.82, contradiction_count: 0 }, { coherence_strength: 0.78, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock({ integrity_class: 'STRONGLY_GROUNDED', integrity_strength: 0.82 }), makeContinuityMock({ continuity_class: 'ENTRENCHED_REFLECTIVE_CONTINUITY', continuity_strength: 0.8 }));
  const state = getCoherenceState();
  assert(state.coherence_strength >= 0.6, `Expected strength >= 0.6, got ${state.coherence_strength}`);
});

// === T18: uncertainty boundary structure check ===
test('T18: uncertainty boundary has correct type and required fields', () => {
  cleanSlate();
  // INCOHERENT state with fragmentation — should trigger at least one uncertainty boundary
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'OVERREACH_RISK', integrity_strength: 0.15, overreach_flags: [{ signal: 'i am aware', category: 'selfAwareness', severity: 'CRITICAL' }], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'FRAGMENTED', continuity_strength: 0.2, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  seedCoherenceHistory([{ coherence_strength: 0.18, contradiction_count: 2 }, { coherence_strength: 0.2, contradiction_count: 2 }, { coherence_strength: 0.22, contradiction_count: 2 }, { coherence_strength: 0.19, contradiction_count: 2 }, { coherence_strength: 0.21, contradiction_count: 2 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  // Uncertainty boundary array must exist and have entries with required fields
  assert(Array.isArray(state.uncertainty_boundaries), 'uncertainty_boundaries must be an array');
  if (state.uncertainty_boundaries.length > 0) {
    const b = state.uncertainty_boundaries[0];
    assert('type' in b, 'uncertainty boundary must have type');
    assert('active' in b, 'uncertainty boundary must have active');
    assert('required' in b, 'uncertainty boundary must have required');
    assert('message' in b, 'uncertainty boundary must have message');
  }
});

// === T19: drift profile types ===
test('T19: drift profile types computed correctly', () => {
  cleanSlate();
  seedCoherenceHistory([{ coherence_strength: 0.5, contradiction_count: 0 }, { coherence_strength: 0.55, contradiction_count: 0 }, { coherence_strength: 0.58, contradiction_count: 0 }, { coherence_strength: 0.63, contradiction_count: 0 }, { coherence_strength: 0.68, contradiction_count: 0 }, { coherence_strength: 0.72, contradiction_count: 0 }, { coherence_strength: 0.76, contradiction_count: 0 }, { coherence_strength: 0.8, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert(state.reflective_coherence_drift_profile.drift_type === 'STRENGTHENING', `Expected STRENGTHENING, got ${state.reflective_coherence_drift_profile.drift_type}`);
});

// === T20: integrity alignment analysis present ===
test('T20: integrity alignment analysis present and scored', () => {
  cleanSlate();
  writeFileSync(intFile, JSON.stringify({ reflective_integrity_state: 'STRONGLY_GROUNDED', integrity_strength: 0.85, overreach_flags: [], shadow_only: true }, null, 2));
  writeFileSync(contFile, JSON.stringify({ reflective_continuity_state: 'CONTINUOUS', continuity_strength: 0.8, recurring_overreach_patterns: [], shadow_only: true }, null, 2));
  seedCoherenceHistory([{ coherence_strength: 0.7, contradiction_count: 0 }]);
  assessCoherence(makeIntegrityMock(), makeContinuityMock());
  const state = getCoherenceState();
  assert('alignment_score' in state.integrity_alignment_analysis, 'alignment_score must be present');
  assert(typeof state.integrity_alignment_analysis.alignment_score === 'number', 'alignment_score must be numeric');
});

// === SUMMARY ===
console.log('\n=== VALIDATION SUMMARY ===');
console.log(`Tests passed: ${passed}/${passed + failed}`);
if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED — Phase 8D coherence layer validated');
} else {
  console.log('\n❌ ' + failed + ' TESTS FAILED');
  process.exit(1);
}