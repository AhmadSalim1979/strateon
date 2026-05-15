# AGENT/SESSION STALLING — ROOT CAUSE ANALYSIS PLAN

**Date:** 2026-05-15
**Trigger:** WhatsApp messages reaching gateway but agent unresponsive, lane waits, bootstrap truncation
**Status:** Evidence-only plan — No implementation

---

## EXECUTIVE SUMMARY

The agent is experiencing session stall. Root causes identified from evidence:

| # | Issue | Severity | Root Cause |
|---|-------|---------|-----------|
| 1 | Bootstrap truncation | **CRITICAL** | AGENTS.md (22KB) and MEMORY.md (31KB) exceed 20KB limit; tail content lost every session |
| 2 | Lane wait exceeded | **HIGH** | 22,608ms wait on whatsapp:direct:+923215139934 lane; session queued behind own processing |
| 3 | Tool-call misuse | **HIGH** | read tool called without path parameter |
| 4 | Worker error cascade | **MEDIUM** | moosa-worker: final_decision_mode not initialized, issueContext undefined |
| 5 | Malformed JSONL in session | **MEDIUM** | Session file contains binary/truncated JSON entries |
| 6 | Heartbeat contention | **MEDIUM** | Heartbeat check + session start competing for same context |

---

## EVIDENCE GATHERED

### PM2 Topology (current)

```
cloudflared-tunnel     online  PID 889465
hub-oauth-v2           stopped
moosa-watchdog         stopped
moosa-worker           online  PID 907019  (running but no tasks)
openclaw-gateway       online  PID 899919
qiyadon-audit-form     online  PID 906121
instruction-sidecar-shadow  online  PID 914175
strateon-followup-engine  stopped
```

### Gateway Error Log Evidence

```
2026-05-15 14:01:07 AGENTS.md 21777 > 20000 limit — TRUNCATED
2026-05-15 14:01:07 MEMORY.md 30985 > 20000 limit — TRUNCATED
2026-05-15 14:09:51 AGENTS.md 21777 > 20000 limit — TRUNCATED
2026-05-15 14:31:07 AGENTS.md + MEMORY.md — TRUNCATED
2026-05-15 15:01:07 AGENTS.md + MEMORY.md — TRUNCATED
2026-05-15 15:20:50 WhatsApp Web connection 503 (recovered)
2026-05-15 15:26:56 AGENTS.md + MEMORY.md — TRUNCATED
2026-05-15 15:53:16 AGENTS.md + MEMORY.md — TRUNCATED
2026-05-15 15:58:31 AGENTS.md + MEMORY.md — TRUNCATED
2026-05-15 15:58:54 lane wait exceeded: waitedMs=22608 lane=session:agent:main:whatsapp:direct:+923215139934
```

### Worker Error Log Evidence

```
Error: Cannot access 'final_decision_mode' before initialization
Error: issueContext is not defined
Error: Cannot read properties of undefined (reading 'catch')
Error: Cannot read properties of undefined (reading 'catch')
```

### Session JSONL Evidence

```
Malformed line at position 195627: Unterminated string in JSON
Malformed line at position 989: Unterminated string
Malformed line at position 11219: Unexpected non-whitespace after JSON
```

---

## ROOT CAUSE 1: BOOTSTRAP TRUNCATION (CRITICAL)

### Evidence

```
AGENTS.md: 22266 bytes — EXCEEDS 20000 byte limit by 2,266 bytes
MEMORY.md: 31441 bytes — EXCEEDS 20000 byte limit by 11,441 bytes
HEARTBEAT.md: 5248 bytes — within limit
```

**Truncation logged every 30 minutes on EVERY session start:**
```
workspace bootstrap file AGENTS.md is 21777 chars (limit 20000); truncating in injected context
workspace bootstrap file MEMORY.md is 30985 chars (limit 20000); truncating in injected context
```

### What Is Being Lost

**AGENTS.md tail (last ~2,266 bytes cut):**
- C-suite spawn configuration
- Protected process management (PROCESS-SAFETY.md content)
- Operational governance definitions
- Error classification taxonomy
- Quality standards
- Red lines

**MEMORY.md tail (last ~11,441 bytes cut):**
- Key decisions (last 2 weeks)
- C-suite domain definitions (CTO, CMO, etc.)
- Revenue targets and path
- Current priority tasks
- Persistent blockers
- All institutional knowledge after the truncation point

### Why This Causes Stalling

Every WhatsApp message triggers a new session context build. The gateway injects these files into every session. The tail content is silently dropped.

The agent starts each session without:
- The full governance rules
- The full operational state
- The full memory context
- The decision history

If a decision or instruction was in the truncated portion, the agent doesn't see it. This explains why validated instructions may not be followed — the agent may not have the full context.

**The 20KB limit appears to be a hard limit in the OpenClaw gateway.**

### Fix Approaches (Gateway-Level — Cannot Be Fixed by Us)

1. **Reduce file sizes** — aggressive pruning of AGENTS.md and MEMORY.md below 20KB each
2. **Move non-critical content to separate files** — only inject essential context files
3. **Gateway configuration** — if 20KB limit is configurable, increase it
4. **Chunked injection** — gateway may support chunked bootstrap (unconfirmed)

---

## ROOT CAUSE 2: LANE WAIT EXCEEDED (HIGH)

### Evidence

```
lane wait exceeded: lane=session:agent:main:whatsapp:direct:+923215139934 waitedMs=22608 queueAhead=0
```

### Interpretation

The lane `session:agent:main:whatsapp:direct:+923215139934` has been waiting 22,608ms (22.6 seconds). `queueAhead=0` means there are no messages ahead in the queue — the lane itself is the bottleneck.

This suggests:
- The current session is still processing a previous message
- The gateway is trying to deliver a new message to the same session
- The session is taking >22 seconds to process a single message

### Why This Happens

1. The agent receives a message, starts processing
2. A tool call is made (possibly hanging or waiting)
3. While waiting, gateway tries to deliver another message
4. Lane waits — the session is already busy

### Connection to Bootstrap Truncation

If the agent is processing with truncated context, it may be making different decisions than expected, potentially causing longer processing times, retries, or looping tool calls.

---

## ROOT CAUSE 3: TOOL-CALL MISUSE (HIGH)

### Evidence

```
read tool called without path parameter
edit failed due exact-text mismatch
```

The gateway error log shows:
```
invalid WhatsApp delivery target: heartbeat
```

This means the agent is trying to send a WhatsApp message to a delivery target called "heartbeat" — which is not a valid WhatsApp contact. This is a tool-call misuse.

### Common Scenarios

1. Agent calls `sendMessage` or `whatsapp.send` with an invalid `to` parameter
2. The delivery target `"heartbeat"` suggests the agent is trying to send to itself or a non-existent channel

### Fix

The tool call wrapper should validate the `to` parameter before attempting WhatsApp delivery. If `to` is not a valid E.164 number, it should be rejected with a clear error rather than attempting delivery to WhatsApp.

**This is an OpenClaw gateway issue** — tool call parameter validation before dispatch.

---

## ROOT CAUSE 4: WORKER ERROR CASCADE (MEDIUM)

### Evidence

```
[Handler] Error executing run_self_check_and_decide for task X:
  Cannot access 'final_decision_mode' before initialization
  issueContext is not defined
  Cannot read properties of undefined (reading 'catch')
```

### Interpretation

The moosa-worker is encountering JavaScript initialization errors when trying to execute `run_self_check_and_decide`. This function references variables that don't exist at the time of execution.

The errors suggest:
- `final_decision_mode` is accessed before it's defined in the module
- `issueContext` is referenced but never defined
- A promise chain is failing with `.catch` on undefined

### Impact

Tasks are failing immediately with initialization errors. The worker is operational (polls, processes, reports no pending tasks) but any task it picks up will fail with these errors.

### Fix

The `run_self_check_and_decide` function in moosa-worker needs:
1. Move `final_decision_mode` initialization before its first access
2. Define `issueContext` before use
3. Add null check before calling `.catch()`

**This is in moosa-worker/src — fixable by us**, not a gateway issue.

---

## ROOT CAUSE 5: MALFORMED SESSION JSONL (MEDIUM)

### Evidence

```
Malformed line at position 195627: Unterminated string in JSON
Malformed line at position 989: Unterminated string
Malformed line at position 11219: Unexpected non-whitespace
```

### Why This Matters

The session JSONL file contains malformed entries. This can cause:
1. Session reload failures (gateway tries to reload session context)
2. JSON parse errors when reading session history
3. Potential truncation of conversation history

### Fix

The malformed entries appear to be binary data or truncated JSON written during a gateway crash/write failure. They need to be manually removed from the session JSONL file.

Current session being used: `77dee770-dbfd-429f-90de-2dac19933a8d.jsonl`

To fix:
```bash
# Backup
cp /root/.openclaw/agents/main/sessions/77dee770-dbfd-429f-90de-2dac19933a8d.jsonl /tmp/session-backup.jsonl

# Remove lines that fail JSON parse
python3 << 'EOF'
import json
path = '/root/.openclaw/agents/main/sessions/77dee770-dbfd-429f-90de-2dac19933a8d.jsonl'
out_path = path + '.clean'
with open(path, 'r') as f, open(out_path, 'w') as o:
    for i, line in enumerate(f):
        line = line.strip()
        if not line: continue
        try:
            json.loads(line)
            o.write(line + '\n')
        except:
            print(f'Removing malformed line {i} at byte ~: {line[:100]}')
    print('Done')
EOF
mv /root/.openclaw/agents/main/sessions/77dee770-dbfd-429f-90de-2dac19933a8d.jsonl.clean /root/.openclaw/agents/main/sessions/77dee770-dbfd-429f-90de-2dac19933a8d.jsonl
```

**But this is risky** — the session file is actively being written. Do NOT clean while gateway is running. Requires gateway downtime.

---

## ROOT CAUSE 6: HEARTBEAT CONTENTION (MEDIUM)

### Evidence

```
cron session: agent:main:cron:280c99d0-585e-4dd6-aeb0-73975a4913ce
vs
whatsapp session: agent:main:whatsapp:direct:+923215139934
```

The cron heartbeat sessions and the WhatsApp sessions share the same AGENTS.md/MEMORY.md bootstrap files. Every 30 minutes, the cron session rebuilds context from the same truncated files.

### Interaction

1. Heartbeat triggers cron session start
2. Cron session injects truncated bootstrap
3. While cron session runs, WhatsApp message arrives
4. WhatsApp session also needs AGENTS.md/MEMORY.md
5. Both sessions compete for the same context files
6. The 20KB limit is hit repeatedly

### Fix

Separate heartbeat-specific bootstrap files that are smaller:
- `HEARTBEAT-CONTEXT.md` — minimal context for heartbeats only
- Or configure heartbeat to use a different session key that doesn't need full bootstrap

---

## ROOT CAUSE 7: MEMORY/CONTEXT OVERLOAD (MEDIUM)

### Evidence

```
MEMORY.md: 31441 bytes — exceeds limit by 57%
AGENTS.md: 22266 bytes — exceeds limit by 11%
Total: 53607 bytes of bootstrap files
Limit: 20000 bytes per file
```

### Why This Accumulates

MEMORY.md grows continuously:
- Every decision is added
- Every session summary is added
- Every blocker is tracked
- The file has no automatic pruning mechanism

AGENTS.md grows when new operational governance is added (PROCESS-SAFETY.md, etc.)

### Fix

Implement a memory pruning cycle — periodically distill MEMORY.md into:
- A condensed long-term memory file (MEMORY.md)
- Daily session summaries (memory/YYYY-MM-DD.md) that are NOT injected into bootstrap

Only the condensed MEMORY.md should be injected. Daily logs are available via file read when needed.

---

## ROOT CAUSE 8: SIDEAR CURSOR HANDLING (CONTRIBUTING)

### Evidence

The instruction-sidecar-shadow is running and reading the session JSONL. While this is read-only, it shares the same session file that the gateway is writing.

### Risk

If the sidecar's cursor handling causes the session file to be read in a way that interferes with the gateway's write cursor, it could cause the gateway to write incomplete entries.

**However**, the sidecar uses `fs.readSync` at specific offsets, which should not affect the gateway's write pointer.

### Fix

Ensure sidecar only reads from the session file, never writes to it.

---

## CONSOLIDATED FIX PRIORITY

### Immediate (Can Fix Now)

| Priority | Fix | Effort | Risk |
|----------|-----|--------|------|
| P0 | **Worker: fix `final_decision_mode` initialization error** | Low | Low |
| P0 | **Worker: fix `issueContext` undefined** | Low | Low |
| P1 | **Prune AGENTS.md below 20KB** — remove duplicate/redundant sections | Medium | Medium |
| P1 | **Prune MEMORY.md below 20KB** — distill to essential context only | High | High |
| P2 | **Fix tool-call parameter validation for WhatsApp delivery** | Low | Low |

### Requires Gateway Downtime

| Priority | Fix | Effort | Risk |
|----------|-----|--------|------|
| P2 | **Clean malformed JSONL lines from session file** | Medium | High |
| P3 | **Separate heartbeat bootstrap from full bootstrap** | Medium | Medium |

### Requires OpenClaw Configuration Change

| Priority | Fix | Effort | Risk |
|----------|-----|--------|------|
| P3 | **Increase bootstrap file size limit** (if configurable) | Unknown | Unknown |

---

## VALIDATION SEQUENCE

After fixes are applied:

1. **Gateway stability:** `openclaw gateway status` — confirm online
2. **Bootstrap size:** Verify AGENTS.md < 20KB, MEMORY.md < 20KB
3. **Lane wait:** Send WhatsApp message, verify no "lane wait exceeded" within 10s
4. **Worker errors:** Check `pm2 logs moosa-worker --lines 20` — no initialization errors
5. **Session cleanliness:** `grep -c "Malformed" /root/.openclaw/agents/main/sessions/*.jsonl` — count should be 0

---

## WHAT NOT TO DO

1. **Do NOT restart the gateway** during active sessions — will cause more malformed entries
2. **Do NOT clean the session JSONL** while gateway is actively writing — requires downtime
3. **Do NOT increase complexity** until the bootstrap truncation is resolved — any new work will be truncated too
4. **Do NOT spawn new sub-agents** until worker initialization errors are fixed — they will inherit broken state

---

## IMMEDIATE ACTIONS (No Implementation — Evidence Only)

1. **Ahmad must decide:** Reduce AGENTS.md and MEMORY.md size, or accept truncated context
2. **Worker initialization errors:** Fix `final_decision_mode` and `issueContext` — file location: `moosa-worker/src/`
3. **Malformed JSONL:** Schedule gateway downtime to clean session file
4. **Tool-call validation:** Report to OpenClaw community — gateway should validate WhatsApp delivery target before attempting send

---

*Plan complete. No implementation until Ahmad approves priorities and approach.*