## Phase 2C — Epistemic Arbitration Layer

### File to Modify
`/root/.openclaw/workspace/moosa-worker/src/core/beliefs.js`

### Context
The beliefs module is SHADOW-ONLY and NON-AUTHORITATIVE. It tracks epistemic observations about world model entities. Phase 2C adds arbitration: managing uncertainty when multiple beliefs conflict, propagating uncertainty through lineage chains, and scoring belief stability.

### Read First
Read `/root/.openclaw/workspace/moosa-worker/src/core/beliefs.js` fully before starting. It is ~1000 lines, ES module.

### Phase 2C Features to Append

Do NOT remove or refactor existing Phase 2A/2B code. Only append new features.

---

### Feature 1: Belief Conflict Arbitration

When two beliefs about the same entity+aspect coexist (both `active`), the arbitration rules resolve which one "wins" observationally:

```javascript
// Arbitration winner logic (applied when multiple active beliefs exist for same entity+aspect)
function arbitrateBeliefConflict(beliefA, beliefB) {
  // Rule 1: Higher source authority tier wins (lower tier number = higher authority)
  const tierA = beliefA.source_authority_tier ?? 7;
  const tierB = beliefB.source_authority_tier ?? 7;
  if (tierA !== tierB) return tierA < tierB ? beliefA : beliefB;
  
  // Rule 2: Higher confidence band wins
  const CONFIDENCE_RANK = { CONFIRMED: 5, LIKELY: 4, UNCERTAIN: 3, UNLIKELY: 2, CONTRADICTED: 1, EXPIRED: 0 };
  const rankA = CONFIDENCE_RANK[beliefA.confidence] ?? 0;
  const rankB = CONFIDENCE_RANK[beliefB.confidence] ?? 0;
  if (rankA !== rankB) return rankA > rankB ? beliefA : beliefB;
  
  // Rule 3: Newer timestamp wins
  const timeA = new Date(beliefA.updated_at).getTime();
  const timeB = new Date(beliefB.updated_at).getTime();
  return timeA > timeB ? beliefA : beliefB;
}
```

On each `updateBeliefsFromWorldModel()` call, after creating/updating beliefs, run `resolveBeliefConflicts(beliefs_obj)` — for each entity+aspect pair with multiple active beliefs, mark the losing belief `status: 'superseded'` with `superseded_at` timestamp.

---

### Feature 2: Multi-Source Corroboration

When a belief has evidence from MULTIPLE independent sources (e.g., `pm2 jlist` AND `/proc/{pid}/stat`), boost its confidence:

```javascript
// In createBelief(), after setting confidence:
function boostConfidenceForCorroboration(belief) {
  const sources = belief.evidence_sources || [];
  const uniqueSourceTypes = new Set(sources.map(s => {
    for (const [tier, info] of Object.entries(SOURCE_AUTHORITY_HIERARCHY)) {
      if (s && s.includes(info.name)) return info.name;
    }
    return 'fallback';
  }));
  
  if (uniqueSourceTypes.size >= 3 && belief.confidence !== 'CONFIRMED') {
    belief.confidence = 'CONFIRMED';
    belief.corroborated = true;
    belief.corroborated_at = new Date().toISOString();
    // Extend TTL to 1 hour for corroborated beliefs
    belief.expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  } else if (uniqueSourceTypes.size >= 2 && belief.confidence === 'UNCERTAIN') {
    belief.confidence = 'LIKELY';
    belief.corroborated = true;
  }
  return belief;
}
```

Apply this after creating any new belief in `createBelief()` and after refreshing beliefs.

---

### Feature 3: Uncertainty Propagation Through Lineage Chains

When a belief in a lineage chain changes status, propagate the effect downstream:

```javascript
// When a belief is marked contradicted/expired/invalidated, propagate to ALL descendants
function propagateUncertainty(beliefs_obj, root_belief_id, reason) {
  const affected = [];
  let queue = [root_belief_id];
  const visited = new Set();
  
  while (queue.length > 0) {
    const current_id = queue.shift();
    if (visited.has(current_id)) continue;
    visited.add(current_id);
    
    for (const [bid, b] of Object.entries(beliefs_obj.beliefs)) {
      if (b.parent_belief_id === current_id && b.status === 'active') {
        b.status = reason === 'expired' ? 'superseded' : 'propagated_uncertainty';
        b.propagated_from = current_id;
        b.propagated_reason = reason;
        b.propagated_at = new Date().toISOString();
        affected.push(bid);
        queue.push(bid);
        
        appendEvent({
          ts: new Date().toISOString(),
          event: 'BELIEF_UNCERTAINTY_PROPAGATED',
          belief_id: bid,
          entity_id: b.entity_id,
          propagated_from: current_id,
          reason,
          mode: 'SHADOW',
        });
      }
    }
  }
  
  return affected;
}
```

Call this in `updateBeliefsFromWorldModel()` when marking any belief `contradicted` or `expired`.

---

### Feature 4: Belief Stability Scoring

Each belief gets a `stability_score` (0.0–1.0) — how stable is this belief over time:

```javascript
function computeStabilityScore(beliefs_obj, belief) {
  const lineage = getBeliefLineage(belief.belief_id); // existing export
  const lineageDepth = lineage.length;
  
  // More generations = more vetted through contradictions = higher stability
  const depthScore = Math.min(lineageDepth / 5, 1.0) * 0.3;
  
  // CONFIRMED beliefs are most stable
  const confidenceScore = (belief.confidence === 'CONFIRMED') ? 0.4 : 
                         (belief.confidence === 'LIKELY') ? 0.25 : 
                         (belief.confidence === 'UNCERTAIN') ? 0.1 : 0.0;
  
  // Active for longer = more stable (if consistently confirmed)
  const ageMs = Date.now() - new Date(belief.created_at).getTime();
  const ageScore = Math.min(ageMs / (24 * 60 * 60 * 1000), 1.0) * 0.2; // max 20% from age
  
  // High-authority source = more stable
  const sourceScore = ((7 - (belief.source_authority_tier || 7)) / 6) * 0.1;
  
  const score = Math.min(depthScore + confidenceScore + ageScore + sourceScore, 1.0);
  return Math.round(score * 100) / 100;
}
```

Add `stability_score` field to each belief. Update it on every `updateBeliefsFromWorldModel()` call. Also add:

```javascript
export function getStabilityScore(belief_id) {
  const beliefs_obj = loadBeliefs();
  const belief = beliefs_obj.beliefs[belief_id];
  if (!belief) return null;
  return computeStabilityScore(beliefs_obj, belief);
}

export function getMostStableBeliefs(entity_id, n = 3) {
  const beliefs = getActiveBeliefsForEntity(entity_id);
  return beliefs
    .map(b => ({ ...b, stability_score: computeStabilityScore(loadBeliefs(), b) }))
    .sort((a, b) => b.stability_score - a.stability_score)
    .slice(0, n);
}
```

---

### Feature 5: Temporal Coherence Checks

Check that beliefs about an entity don't violate temporal logic:

```javascript
// Temporal coherence rules:
// 1. Entity cannot go online before it went offline (if we know both)
// 2. PID cannot change without a restart (if we track PID history)
// 3. health_score cannot jump >0.5 in one cycle without explanation

function checkTemporalCoherence(beliefs_obj, entity_id, newBelief) {
  const issues = [];
  const belief_ids = beliefs_obj.belief_index[entity_id]?.belief_ids || [];
  
  // Get belief history for this entity+aspect, sorted oldest-first
  const history = belief_ids
    .map(bid => beliefs_obj.beliefs[bid])
    .filter(Boolean)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  if (newBelief.aspect === 'status') {
    // Check for impossible transitions
    const statusHistory = history.filter(b => b.aspect === 'status');
    const lastStatus = statusHistory[statusHistory.length - 1]?.content?.status;
    const newStatus = newBelief.content?.status;
    
    // Cannot go online if never went offline in a clean way first (unless it's the first belief)
    if (newStatus === 'online' && lastStatus === 'online') {
      issues.push({ type: 'redundant_transition', severity: 'low', detail: 'status already online' });
    }
  }
  
  if (newBelief.aspect === 'health_score') {
    // Check for sharp drops or jumps
    const lastHealth = history.filter(b => b.aspect === 'health_score').pop();
    if (lastHealth) {
      const prev = lastHealth.content?.health_score || 0;
      const next = newBelief.content?.health_score || 0;
      const jump = Math.abs(next - prev);
      if (jump > 0.5) {
        issues.push({ type: 'sharp_health_jump', severity: 'medium', detail: `health jumped ${jump} in one cycle` });
      }
    }
  }
  
  return issues;
}
```

When temporal incoherence is detected, mark the belief `status: 'temporal_anomaly'` but do NOT delete or suppress — log the anomaly. Add:

```javascript
export function getTemporalAnomalies(entity_id) {
  const beliefs_obj = loadBeliefs();
  return Object.values(beliefs_obj.beliefs).filter(b => b.status === 'temporal_anomaly');
}
```

---

### Feature 6: Deferred-Resolution State for Unresolved Contradictions

When a contradiction is detected but the evidence is insufficient to resolve it (e.g., equal authority, equal confidence, conflicting timestamps):

```javascript
// In updateBeliefsFromWorldModel(), when detectContradiction fires but confidence/authority are equal:
// Instead of immediately marking one contradicted, mark both as DEFERRED
function markDeferredResolution(beliefs_obj, beliefA_id, beliefB_id) {
  const now = new Date().toISOString();
  for (const bid of [beliefA_id, beliefB_id]) {
    const b = beliefs_obj.beliefs[bid];
    if (!b) continue;
    b.status = 'deferred_resolution';
    b.deferred_at = now;
    b.deferred_reason = 'unresolved_contradiction';
    
    appendEvent({
      ts: now,
      event: 'BELIEF_DEFERRED',
      belief_id: bid,
      entity_id: b.entity_id,
      aspect: b.aspect,
      mode: 'SHADOW',
    });
  }
}
```

`DEFERRED_RESOLUTION` status means: "two beliefs disagree, we can't yet determine which is right, so both are held as active-pending-resolution." Once new evidence arrives that breaks the tie (different source authority or confidence), the deferred belief with lower standing is marked `superseded`.

Add:
```javascript
export function getDeferredBeliefs() {
  const beliefs_obj = loadBeliefs();
  return Object.values(beliefs_obj.beliefs).filter(b => b.status === 'deferred_resolution');
}
```

---

### Feature 7: Full Epistemic Audit Trails

Every belief tracks a complete history of state transitions:

```javascript
// Add to createBelief():
// belief.audit_log = [{ ts, event, from_state, to_state, reason }]
function addAuditEntry(beliefs_obj, belief_id, event, from_state, to_state, reason = '') {
  const b = beliefs_obj.beliefs[belief_id];
  if (!b) return;
  if (!b.audit_log) b.audit_log = [];
  b.audit_log.push({
    ts: new Date().toISOString(),
    event,
    from_state,
    to_state,
    reason,
  });
}
```

Call `addAuditEntry()` on every state transition: CREATED → ACTIVE, ACTIVE → CONTRADICTED, ACTIVE → EXPIRED, ACTIVE → SUPERSEDED, ACTIVE → PROPAGATED_UNCERTAINTY, ACTIVE → DEFERRED_RESOLUTION, etc.

Export:
```javascript
export function getBeliefAuditLog(belief_id) {
  const beliefs_obj = loadBeliefs();
  const b = beliefs_obj.beliefs[belief_id];
  return b?.audit_log || [];
}
```

---

### Feature 8: Meta-Confidence Boundaries

Meta-confidence is how sure we are that our confidence bands are correct:

```javascript
// After each updateBeliefsFromWorldModel(), compute meta-confidence:
function computeMetaConfidence(beliefs_obj) {
  const beliefs = Object.values(beliefs_obj.beliefs).filter(b => b.status === 'active');
  const total = beliefs.length;
  if (total === 0) return { level: 'unknown', score: 0 };
  
  // What % of beliefs are CONFIRMED? High % = high meta-confidence
  const confirmedCount = beliefs.filter(b => b.confidence === 'CONFIRMED').length;
  const confirmedRatio = confirmedCount / total;
  
  // What % of beliefs have corroboration?
  const corroboratedCount = beliefs.filter(b => b.corroborated === true).length;
  const corroboratedRatio = corroboratedCount / total;
  
  // What % are EXPIRED or CONTRADICTED? High % = lower meta-confidence
  const failedCount = beliefs.filter(b => ['expired', 'contradicted', 'deferred_resolution'].includes(b.status)).length;
  const failureRatio = failedCount / total;
  
  // Meta-confidence score: 0.0 - 1.0
  const score = Math.round(Math.max(0, Math.min(1, 
    (confirmedRatio * 0.4) + 
    (corroboratedRatio * 0.3) + 
    ((1 - failureRatio) * 0.3)
  )) * 100) / 100;
  
  const level = score >= 0.8 ? 'high' : score >= 0.5 ? 'moderate' : score >= 0.2 ? 'low' : 'uncertain';
  
  return {
    level,
    score,
    confirmed_ratio: Math.round(confirmedRatio * 100) / 100,
    corroborated_ratio: Math.round(corroboratedRatio * 100) / 100,
    failure_ratio: Math.round(failureRatio * 100) / 100,
    active_belief_count: total,
    computed_at: new Date().toISOString(),
  };
}
```

Store this as `beliefs_obj.meta_confidence` and update on every save. Add:

```javascript
export function getMetaConfidence() {
  const beliefs_obj = loadBeliefs();
  return beliefs_obj.meta_confidence || { level: 'unknown', score: 0 };
}
```

Also add to `getBeliefMetrics()` return object: `meta_confidence_level`, `meta_confidence_score`, `meta_confidence_confirmed_ratio`.

---

### Integration Notes

1. In `updateBeliefsFromWorldModel()`, after all beliefs are processed:
   - Run `resolveBeliefConflicts(beliefs_obj)` — arbitration
   - Run `propagateUncertainty()` for any newly contradicted/expired beliefs
   - Call `checkTemporalCoherence()` per entity per new belief
   - Update `stability_score` for all active beliefs
   - Update `beliefs_obj.meta_confidence`

2. All events have `mode: "SHADOW"`.

3. No existing Phase 2A/2B exports are removed or renamed.

---

### Validation After Writing

1. `node --check` — must pass with 0 errors
2. `getDeferredBeliefs()` — returns array
3. `getTemporalAnomalies(entity_id)` — returns array  
4. `getMostStableBeliefs('moosa-worker', 3)` — returns top 3 most stable beliefs sorted
5. `getBeliefAuditLog(belief_id)` — returns array with transition history
6. `getMetaConfidence()` — returns `{ level, score, confirmed_ratio, ... }`
7. `getStabilityScore(belief_id)` — returns number 0.0–1.0
8. After running `updateBeliefsFromWorldModel()` with mock data, call `getBeliefMetrics()` — should include all Phase 2C fields
9. No existing Phase 2A/2B functionality broken

---

### Design Decisions to Document in Summary

- How deferred_resolution is resolved when new evidence arrives
- Whether temporal_anomaly beliefs are automatically expired
- Whether stability_score affects any other system (it must NOT — shadow only)