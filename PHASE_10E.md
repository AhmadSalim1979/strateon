# PHASE 10E — Deferred Work Queue & Revisit Discipline

**Date:** 2026-04-18
**Status:** Implemented and validated

---

## A. Deferred Work Model

**New file:** `src/handlers/deferred-work.js`

A structured deferred-work layer that stores issues not selected as current top priority.

### Deferred Item Schema

```javascript
{
  deferred_id:        string,   // unique ID (deferred_<timestamp>_<random>)
  deferred_issue_id:  string,   // stable identifier (pattern key or description)
  deferred_reason:    string,   // why it was deferred
  deferred_category:  string,   // from DEFERRED_CATEGORY
  deferred_priority:  number,   // priority score at time of deferral
  deferred_at:        string,   // ISO timestamp
  deferred_at_relative_cycles: number,  // cycle count when deferred
  revisit_after:      number,   // absolute cycle count when revisit is due
  max_cycles:         number,   // hard expiry limit
  cycles_deferred:    number,   // current cycle count (incremented each tick)
  revisit_status:     string,   // from REVISIT_STATUS
  last_revisited_at:  string,   // ISO timestamp of last surfacing
  revisit_count:      number,   // number of times surfaced
  description:        string,   // human-readable description
  related_pattern:    string,   // pattern memory_key if any
  recommended_action: string,   // action that was deferred
  promotion_reason:   string,   // set on promotion
  suppression_reason: string,   // set on suppression
  promoted_at:        string,   // ISO timestamp
  resolved_at:         string,   // ISO timestamp
  last_refreshed_at:   string,   // ISO timestamp of last deduplication refresh
}
```

### Revisit Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Not yet revisited, within window |
| `revisited` | Surfaced and reviewed this cycle |
| `promoted` | Elevated to active priority |
| `resolved` | Suppressed — underlying issue gone |
| `expired` | Past max_cycles, removed from active queue |

### Deferred Categories & Windows

| Category | Revisit After | Max Cycles |
|----------|--------------|-----------|
| `housekeeping` | 12 cycles (~1h) | 36 |
| `weak_initiative` | 6 cycles (~30min) | 24 |
| `stability_deferred` | 3 cycles | 12 |
| `recurring_deferral` | 4 cycles | 16 |
| `low_priority` | 8 cycles (~40min) | 32 |

---

## B. Revisit Rules

1. **tickRevisitClock()** is called each cycle and increments `cycles_deferred` for all pending/revisited items
2. Items that reach `cycles_deferred >= revisit_after` appear in `getRevisitCandidates()`
3. Items that exceed `max_cycles` are automatically marked `expired`
4. Deduplication: adding an item with an existing `deferred_issue_id` refreshes it rather than creating a duplicate
5. Revisit candidates are surfaced in decision output — they do not auto-execute

---

## C. Queue Discipline

- **Bounded:** `getDeferredQueue()` returns max 20 items (oldest by cycles_deferred within priority band)
- **Deduplicated:** `deferred_issue_id` is the dedup key; pending/revisited items with the same ID are refreshed rather than duplicated
- **Auditable:** Every state change (promote/suppress/expire/revisit) records timestamp and reason
- **No silent vanishing:** Items are never deleted without a status; cleanup preserves promoted/resolved items for 10 cycles for audit

---

## D. Output Requirements

Decision output now includes:

```javascript
{
  deferred_issues_queue: [...],   // full bounded queue (max 20)
  deferred_work_summary: {
    total_items, pending, revisited,
    promoted, resolved, expired, last_updated
  },
  revisit_candidates: {
    due_for_revisit: [...],       // items now eligible for revisit
    recently_surfaced: [...],     // items surfaced this cycle
    revisit_summary: string,
  }
}
```

In prioritization output:
```javascript
{
  deferred_issues: [...],        // short list for this cycle
  deferred_issues_queue: [...],   // full queue (from deferred-work)
  deferred_work_summary: {...},   // queue statistics
  // revisit_candidates also included at decision level
}
```

---

## E. Promotion / Revisit Logic

### A deferred item may be **promoted** if:
- Top-priority issue resolves (operator-promoted)
- Revisit timer expires (becomes due_for_revisit)
- Deferred issue worsens (detected by pattern memory)
- Deferred issue becomes blocking

Functions: `promoteDeferredItem(deferredId, reason)`, `promoteByIssueId(issueId, reason)`

### A deferred item may **remain deferred** if:
- Stronger issue still active
- Signal remains weak
- No meaningful change occurred

### A deferred item may be **suppressed** only if:
- Underlying issue is truly gone (confirmed by system state)
- `suppression_reason` is recorded (required)

Functions: `suppressDeferredItem(deferredId, reason)`, `suppressByIssueId(issueId, reason)`

---

## F. Validation Results

| # | Requirement | Result |
|---|-------------|--------|
| V1 | Deferred issue remains visible after deferral | ✅ Added item visible in queue with PENDING status |
| V2 | Deferred issue is revisited later, not forgotten | ✅ After 12 ticks, item appears in `due_for_revisit` |
| V3 | Deferred issue is not resurfaced too aggressively | ✅ Only surfaces when `cycles_deferred >= revisit_after` (not on every cycle) |
| V4 | Deferred issue can be promoted when active issue clears | ✅ `promoteDeferredItem()` → status=PROMOTED, promotion_reason recorded |
| V5 | Deferred issue can be suppressed when no longer relevant | ✅ `suppressDeferredItem()` → status=RESOLVED, suppression_reason recorded |
| V6 | Queue is bounded and deduplicated | ✅ 25 adds → 20 items max; duplicate issue_id → refreshed, not duplicated |
| V7 | No approval-gating or execution changes occur | ✅ No execution logic introduced; approval-gating unchanged |

---

## G. Examples

### Example: Deferred issue later promoted

> "Stale failed-delivery cleanup was deferred because worker instability was higher priority. Revisit window of 12 cycles elapsed. Top-priority issue (worker instability) resolved. Item surfaced as `due_for_revisit`. Operator approves promotion. Status changes to `promoted`, `promotion_reason: 'Worker instability resolved — now revisiting'`."

```javascript
// Deferred at cycle 0
addDeferredItem({
  deferred_issue_id: 'stale_failed_delivery_cleanup',
  deferred_reason: 'Worker instability was higher priority',
  deferred_category: 'housekeeping',
  deferred_priority: 0.35,
  description: 'Stale failed delivery queue cleanup',
  recommended_action: 'clear_failed_delivery_queue',
});
// Revisit window: 12 cycles

// At cycle 12 — surfaces as due_for_revisit
// Operator approves promotion →

promoteDeferredItem(deferredId, 'Worker instability resolved — now revisiting');
// → revisit_status: 'promoted', promotion_reason: 'Worker instability resolved — now revisiting', promoted_at: <timestamp>
```

### Example: Deferred issue later suppressed

> "Weak WhatsApp reconnect signal was deferred as `weak_initiative`. After 3 cycles the underlying WhatsApp session naturally recovered and returned to stable state. No operator action needed. Item was suppressed with `suppression_reason: 'WhatsApp session self-recovered — signal no longer relevant'`."

```javascript
// Deferred at cycle 0
addDeferredItem({
  deferred_issue_id: 'whatsapp_reconnect_weak_signal',
  deferred_reason: 'Signal too weak — monitoring for recurrence before acting',
  deferred_category: 'weak_initiative',
  deferred_priority: 0.25,
  description: 'Weak WhatsApp reconnect signal',
  recommended_action: 'verify_whatsapp_delivery_channel',
});

// After 3 cycles, pattern memory confirms WhatsApp is stable
// Operator or automated signal triggers suppression

suppressDeferredItem(deferredId, 'WhatsApp session self-recovered — signal no longer relevant');
// → revisit_status: 'resolved', suppression_reason: 'WhatsApp session self-recovered — signal no longer relevant', resolved_at: <timestamp>
```

---

## Final Assessment

**Does MOOSA now manage deferred work like a disciplined operator?**

Yes. The deferred-work layer adds three disciplines that were previously absent:

1. **Visibility without noise:** Deferred issues are stored with full provenance and surfaced only when their revisit window expires — not on every cycle. The queue is always accessible via `getDeferredQueue()`, and revisit candidates appear in decision output.

2. **Time-bounded revisit:** Each category has a defined revisit window. Items are not indefinitely forgotten. After `max_cycles` they expire automatically.

3. **Auditable promotion and suppression:** Any transition from PENDING/REVISITED to PROMOTED or RESOLVED requires an explicit reason. The audit trail (promotion_reason, suppression_reason, timestamps) is permanent for 10 cycles post-resolution.

**What is preserved from prior phases:**
- Approval gating: unchanged, no auto-execution introduced
- Proposal/token enforcement: unchanged
- Execution feedback and adaptation: unchanged
- Strategic planning and decision: unchanged

**Net effect:** MOOSA has moved from:
> "I know what is not top priority right now."
to:
> "I keep track of what can wait, revisit it properly, and know when it matters again."

---

## Files Modified

- `src/handlers/deferred-work.js` — new
- `src/handlers/priority-manager.js` — imports deferred-work, emits deferred_issues_queue + deferred_work_summary
- `src/handlers/run_self_check_and_decide.js` — calls tickRevisitClock(), emits revisit_candidates, prioritization includes deferred queue

## State File

- `state/deferred-work.json` — persisted deferred queue