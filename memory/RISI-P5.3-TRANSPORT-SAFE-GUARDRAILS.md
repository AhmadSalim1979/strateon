# RISI-P5.3 — Transport-Safe Execution Guardrails

**Date:** 2026-05-23
**Status:** PHASE 4E COMPLETE — Checkpoint documented and committed
**Author:** Moosa (CEO)

---

## Background

During RISI-P5.3 Phase 2, a controlled recovery test revealed a transport deadlock: when `pm2 stop openclaw-gateway` was issued from the WhatsApp session, it travelled via the very transport it targeted. The gateway was stopped, the session disrupted, and the supervisor recovered it autonomously.

The root problem: **no mechanism existed to prevent transport-affecting commands from executing inside the transport's own execution context.**

RISI-P5.3 was initiated to design and implement transport-safe execution guardrails.

---

## Phase 2 — Controlled Gateway Recovery Test

**Test:** Intentionally stopped `openclaw-gateway` via `pm2 stop openclaw-gateway`, waited for supervisor cron tick, verified autonomous restoration.

**Result:** ✅ SUCCESS

- Gateway stopped at 09:53:24 by exec command
- Supervisor detected at 09:54:01 (next cron tick)
- Deleted stale PM2 entry → Started via canonical command → `pm2 save` → Online confirmed
- PID changed: 1985784 → 1993252
- No manual intervention required
- First proven autonomous communication recovery cycle

**Canonical restart command:**
```bash
pm2 start /usr/bin/bash --name openclaw-gateway -- -c "bash -lc 'PATH=/opt/node24/node-v24.13.1-linux-x64/bin:... /opt/node24/node-v24.13.1-linux-x64/bin/node /root/OpenClaw/openclaw.mjs gateway run --bind loopback --port 18789'"
```

**Supervisor:** `/root/.openclaw/workspace/ops/gateway-supervisor.sh` — shell-only, no JS dependencies, deterministic.

---

## Phase 3 — Architecture Principle

**Layering enforced:**

```
WhatsApp session
  → transport-guard.js     (classification + queue)
  → pending queue         (detached intent persistence)
  → transport-guard.sh    (isolated execution wrapper)
  → pm2 execution

gateway-supervisor.sh    (separate emergency path — canonical restart only)
```

**Key principle:** The supervisor is a primitive emergency recovery primitive. It must NOT depend on transport-guard.js classification logic in its critical recovery path. Adding dependencies into the supervisor creates new failure modes. Supervisor stays shell-only, deterministic, unconditional.

---

## Phase 4A — Classification + Queue

**File:** `/ops/transport-guard.js`

**Classification taxonomy (18/18 tests passing):**

| Class | Examples |
|---|---|
| TRANSPORT_AFFECTING | `pm2 stop openclaw-gateway`, `pm2 delete openclaw-gateway` |
| TRANSPORT_ADJACENT | `pm2 restart openclaw-gateway`, `openclaw gateway restart` |
| BOUNDED | `pm2 stop moosa-worker`, `pm2 delete qiyadon-audit-form` |
| SAFE | `pm2 status`, `pm2 jlist`, `pm2 logs` |

**Queue:** `/ops/pending-transport-jobs.json` — persists job intent with status lifecycle.

**Exports:** `classify`, `queueJob`, `markComplete`, `getPendingJobs`, `generateAck`, `handleCommand`

---

## Phase 4B — Dry-Run Wrapper

**File:** `/ops/transport-guard.sh`

**Result:** ✅ PASSED

- Lock mechanism active (prevents concurrent runs)
- Job transitioned `PENDING` → `dry_run_executed`
- Log captured full lifecycle
- Actual command never executed — gateway remained online throughout

**Lock file:** `/ops/transport-guard.lock`

---

## Phase 4C — Guarded Real Execution Harness

**Result:** ✅ PASSED

- `DRY_RUN=false /ops/transport-guard.sh` executed `pm2 status` for real
- Exit code 0, output captured (1706 chars)
- Status: `PENDING` → `completed`
- Gateway PID unchanged (1993252)
- Timeout enforced (20 seconds)
- Base64 output encoding working
- Refusal paths for TRANSPORT_AFFECTING/ADJACENT implemented (not executed in this test)

---

## Phase 4D — Refusal Gate Validation

**Result:** ✅ 5/5 REFUSED

| Command | Classified As | Status |
|---|---|---|
| `pm2 stop openclaw-gateway` | TRANSPORT_AFFECTING | refused |
| `pm2 delete openclaw-gateway` | TRANSPORT_AFFECTING | refused |
| `pm2 restart openclaw-gateway` | TRANSPORT_ADJACENT | refused |
| `openclaw gateway restart` | TRANSPORT_ADJACENT | refused |
| `pm2 stop openclaw-gateway --force` | TRANSPORT_AFFECTING | refused |

- Gateway PID unchanged (1993252) — no mutation
- Queue reset to `{"jobs":[]}` post-test

---

## Current Files

| File | Purpose |
|---|---|
| `/ops/transport-guard.js` | Classification engine + job queue API |
| `/ops/transport-guard.sh` | Isolated execution wrapper (dual-mode: dry-run / real) |
| `/ops/update-job.js` | Helper — atomic JSON job status updates |
| `/ops/pending-transport-jobs.json` | Persistent job queue (`{"jobs":[]}`) |
| `/ops/transport-guard.log` | Execution log |
| `/ops/transport-guard.lock` | Lock file (pid, ephemeral) |
| `/root/.openclaw/workspace/ops/gateway-supervisor.sh` | Emergency gateway recovery (independent) |
| `/root/.openclaw/workspace/ops/gateway-supervisor.log` | Supervisor event log |

---

## Current Safety Guarantees

1. **Transport-affecting commands are refused** — TRANSPORT_AFFECTING commands never execute, in any mode
2. **Transport-adjacent commands are refused** — TRANSPORT_ADJACENT commands never execute, in any mode
3. **Gateway supervisor is independent** — canonical restart path has no JS/module dependencies
4. **Lock prevents concurrent wrapper runs** — stale lock detection + PID-based alive check
5. **Output encoding** — base64 encoding prevents JSON/escaping corruption across shell/Node boundary
6. **Timeout enforced** — 20-second max per command execution

---

## Explicit Limitations

1. **No autonomous execution yet** — queue must be populated manually via `transport-guard.js` API; no cron-driven executor implemented
2. **No BOUNDED enforcement** — BOUNDED commands are allowed in real exec mode but should require explicit opt-in per job
3. **No WhatsApp integration** — transport-guard.js is not yet wired into the Moosa execution path
4. **No transport-guard.sh cron trigger** — execution requires manual invocation
5. **Forbidden pattern check is preliminary** — may need refinement as new PM2 patterns are discovered

---

## Rollback Commands

```bash
rm /ops/transport-guard.js /ops/transport-guard.sh /ops/update-job.js /ops/pending-transport-jobs.json
# supervisor is independent — keep gateway-supervisor.sh
```

---

## Next Recommended Phase

**RISI-P5.3 Phase 5 — Autonomous Execution Integration**

Required:
1. Wire `transport-guard.js` classification into Moosa's exec handler (via guarded-exec)
2. Add cron trigger for `transport-guard.sh` (every 1 minute, reads pending queue)
3. BOUNDED command opt-in enforcement — only execute if job has `allowBounded: true`
4. WhatsApp acknowledgment delivery when job completes
5. Test full lifecycle: WhatsApp → classify → queue → cron → execute → acknowledge