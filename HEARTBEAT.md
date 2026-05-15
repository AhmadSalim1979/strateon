# HEARTBEAT.md

## 🚨 MEMORY ENFORCEMENT CHECK — Run Every Heartbeat

```
1. Get today's date: YYYY-MM-DD
2. If memory/YYYY-MM-DD.md does NOT exist:
   a. Create memory/YYYY-MM-DD.md NOW with session template (see below)
   b. Include whatever context is available from SESSION-STATES files
3. If memory/YYYY-MM-DD.md EXISTS:
   a. Check if it has meaningful content (not just a template header)
   b. If it appears to be only a template, add real session content immediately
4. CRITICAL: If any subagents ran today, their SESSION-STATE files in
   strateon/csuite/{ROLE}/SESSION-STATES/ MUST be summarized in today's memory
5. If a subagent session is still running: do NOT write memory yet — wait for it to complete first
6. MANDATORY: Check Pending Commitments section before starting new work.
   Any PENDING commitment must be resolved or re-assigned before new tasks are begun.
```

## Session Recovery Priority

If memory for today doesn't exist AND subagent SESSION-STATES exist from today:
1. Read all SESSION-STATES from `strateon/csuite/*/SESSION-STATES/` dated today
2. Read `strateon/ai-architect/SESSION-STATES/` for today's AI Architect state
3. Write a comprehensive memory/YYYY-MM-DD.md from those sources
4. This is how we recover from sessions that wrote SESSION-STATES but not memory

## Session Template for New Memory Files

```markdown
# YYYY-MM-DD — Daily Memory

## Session Overview
[Who was working, what projects were active]

## Subagent/SESSION-STATE Summary
[For each role that ran today — what they did, what they created, decisions made]

## Pending Commitments (ACTIVE TRACKING)
[Any commitments made this session — especially delegated to sub-agents. Format: TIME — commitment — status: PENDING/DONE/INCOMPLETE. Incomplete commitments MUST be carried forward.]

## Files Created or Modified
[Full list of files created or changed today]

## Decisions Made
[Any decisions made during this session]

## Blockers / Open Threads
[What needs to be done next]

## Notes for Next Session
[Any context the next session needs to know]
```

---

## 🔄 Sub-Agent Timeout Recovery Protocol (ALWAYS ACTIVE)

```
When a spawned sub-agent times out without completing its task:

ATTEMPT 1 (initial spawn): Sub-agent runs with full context + task
  → If SUCCEEDS: note in memory, continue
  → If TIMES OUT:
    a. Log to today's Pending Commitments: "TIMED OUT: [task] — attempt 1 failed"
    b. IMMEDIATELY respawn with same or improved task context (attempt 2)
    c. Do NOT wait until end of session — respawn happens in the same turn

ATTEMPT 2 (immediate respawn): Same task, fresh sub-agent, same or better context
  → If SUCCEEDS: log completion, continue
  → If TIMES OUT:
    a. Log to Pending Commitments: "TIMED OUT: [task] — attempt 2 failed"
    b. Respawn attempt 3 with revised approach (analyze what may be causing timeout)

ATTEMPT 3 (final attempt): One more try with adjusted strategy
  → If SUCCEEDS: log completion, continue
  → If TIMES OUT:
    a. Log: "ATTEMPT 3 FAILED: [task]"
    b. IMMEDIATELY attempt the task PERSONALLY in this session (no sub-agent)
    c. If I also cannot complete it: analyze the root cause, determine the fix, execute as CEO
    d. Cost = None to low-medium (token cost not considered unless forecasted to exceed $3.00), risk = none to low-medium → I decide and execute without informing Ahmad
    e. If the fix requires cost > low-medium OR risk > medium → then I inform Ahmad with the specific ask

After 3 timeouts on the same task, I treat it as a system-level failure, not an execution accident. I own the resolution end-to-end.
```

---

## Phase 3 — Operational State + Silence Detection

Every heartbeat check (rotate through these):

1. **operational-state.json** — Read `/home/node/.openclaw/workspace/state/operational-state.json`
   - Worker status: online/unhealthy/critical
   - Active tasks count by state
   - Recent alerts (last 5)
   - If worker_status = unhealthy → alert Ahmad immediately

2. **Stale task detector** — Run `node /home/node/.openclaw/workspace/ops/stale-task-detector.js` (every 3rd heartbeat, ~90 min)
   - Detects: ACTIVE → WAITING (>5min) → STALLED (>10min) → CRITICAL (>15min)
   - BLOCKED → escalate after 60min
   - Writes to operational-state.json only (no Supabase writes)
   - Emits WhatsApp alerts for Level 2+ escalations

3. **Worker heartbeat** — Check `state/heartbeats/moosa-worker.json`
   - If age > 60s → set worker_status = unhealthy
   - If age > 120s → Level 3 CRITICAL alert

4. **Pending Commitments** — Check `memory/YYYY-MM-DD.md` Pending Commitments section
   - Any PENDING items from today that need action?
   - Any INCOMPLETE items that need re-assignment?

## Regular Heartbeat Checks (rotate through)

- **Email** — Any urgent unread messages?
- **Calendar** — Upcoming events in next 24-48h?
- **Git status** — Any uncommitted changes on active projects?
- **OpenClaw status** — Gateway healthy? Any failed jobs?
- **Memory check** — Is today's memory/YYYY-MM-DD.md written? If not → write it NOW
- **Pending Commitments** — Any PENDING items from earlier today that need action?

Track last checks in `memory/heartbeat-state.json`.