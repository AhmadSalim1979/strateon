# PROTECTED PROCESS MANAGEMENT — RUNTIME SAFETY REQUIREMENT
## New Hardening Requirement: Safe Process Operations

**Date:** 2026-05-15
**Author:** Moosa (CEO)
**Trigger:** `pkill -9 node` incident — killed exec handler, disrupted runtime
**Status:** DOCUMENTED — Pending Implementation in Future Hardening Phase

---

## INCIDENT SUMMARY

During the Phase 3 investigation, `pkill -9 node` was executed to clear a hung Node process. This command killed the **exec infrastructure handler node process** in addition to the intended worker process. The result was:

1. Exec mechanism became non-responsive (all exec commands hanging)
2. moosa-worker process killed (worker went offline)
3. Session continuity disrupted
4. Runtime-wide impact beyond intended target

**Root cause:** No process inventory existed before the destructive command. No blast-radius classification. No protected-process filtering. The difference between a worker process and an infrastructure process was not visible at the time of execution.

---

## DEFINITIONS

### Protected Process

A **protected process** is any process that, if killed, would:
- Disrupt runtime infrastructure (gateway, exec handler, watchdog orchestration)
- Cause loss of operational state or continuity
- Impair the ability to recover the runtime
- Cause customer-facing service disruption

### Destructive Process Operation

A **destructive process operation** is any command that:
- Sends SIGKILL ( `-9`) to a process
- Sends SIGTERM to a critical infrastructure process
- Executes `pkill` / `killall` without scoped process targeting
- Restarts a process without understanding its dependencies

### Examples of DESTRUCTIVE (High-Risk) Operations

```bash
# HIGH-RISK — kills ALL node processes including infrastructure
pkill -9 node

# HIGH-RISK — kills all node processes matching "moosa" including gateway
pkill -9 moosa

# HIGH-RISK — kills all processes owned by node user including infrastructure
killall -9 node

# MODERATE-RISK — pm2 kill without process-specific targeting
pm2 kill  # kills ALL pm2 processes including gateway, watchdog
```

### Examples of SAFE (Bounded) Operations

```bash
# SAFE — targets only the named process, bounded scope
pm2 restart moosa-worker

# SAFE — scoped kill, only qiyadon-audit-form
kill -9 $(pm2 pid qiyadon-audit-form)

# SAFE — pm2 delete with specific process name
pm2 delete strateon-followup-engine
```

---

## PROTECTED PROCESS REGISTRY

### Registry File: `/ops/PROCESS-REGISTRY.md`

```
| Process Name | PM2 Name | Protected Class | Blast Radius if Killed | Restart Method |
|-------------|----------|----------------|------------------------|----------------|
| OpenClaw Gateway | openclaw-gateway | INFRASTRUCTURE | Runtime offline — all sessions die | pm2 restart openclaw-gateway |
| Exec Handler | (node exec handler) | INFRASTRUCTURE | Exec non-responsive, all exec commands hang | Session restart |
| moosa-worker | moosa-worker | WORKER | Task processing halted, worker offline | pm2 restart moosa-worker |
| moosa-watchdog | moosa-watchdog | ORCHESTRATION | Health monitoring offline | pm2 restart moosa-watchdog |
| hub-oauth-v2 | hub-oauth-v2 | SERVICE | HubSpot OAuth broken | pm2 restart hub-oauth-v2 |
| cloudflared-tunnel | cloudflared-tunnel | SERVICE | api.qiyadon.com resolves to gateway down | pm2 restart cloudflared-tunnel |
| qiyadon-audit-form | qiyadon-audit-form | SERVICE | Form handler offline | pm2 restart qiyadon-audit-form |
| strateon-followup-engine | strateon-followup-engine | SERVICE | Follow-up engine offline | pm2 start ecosystem.followup.config.js |
| Ollama | (systemd/standalone) | RUNTIME | Coding sidecar non-functional | systemctl restart ollama or manual start |
```

### Protected Classes

| Class | Definition | Kill Risk |
|-------|------------|-----------|
| `INFRASTRUCTURE` | Process that, if killed, breaks runtime core — gateway, exec, session handling | CRITICAL — runtime-wide |
| `ORCHESTRATION` | Process that coordinates other processes — watchdog, health monitors | HIGH — monitoring gap |
| `WORKER` | Named AI worker — moosa-worker | HIGH — task processing halted |
| `SERVICE` | Customer-facing or operational service | MEDIUM — degraded service |
| `RUNTIME` | Runtime dependencies — Ollama, databases | MEDIUM-HIGH — dependent services fail |

---

## SAFE PROCESS OPERATION CHECKLIST

Before executing ANY process kill/restart operation:

```
PRE-FLIGHT CHECKLIST

1. PROCESS INVENTORY
   □ List all running PM2 processes: pm2 jlist
   □ Identify process name, PM2 name, PID, status
   □ Note: is this INFRASTRUCTURE, ORCHESTRATION, WORKER, SERVICE, or RUNTIME?

2. BLAST RADIUS CLASSIFICATION
   □ If INFRASTRUCTURE killed → runtime offline → STOP, require explicit approval
   □ If ORCHESTRATION killed → monitoring gap → proceed with caution, note monitoring loss
   □ If WORKER killed → task processing halted → can restart, no permanent damage
   □ If SERVICE killed → degraded service → can restart, customer impact assessment

3. PROTECTED PROCESS FILTER
   □ Confirm process is NOT in Protected Process Registry class INFRASTRUCTURE
   □ Confirm process is NOT in class ORCHESTRATION unless intended
   □ If process is INFRASTRUCTURE → MUST get explicit approval before proceeding

4. ROLLBACK PATH
   □ Document exact restart command for the process
   □ Document how to verify process recovered
   □ Document how to detect if restart failed (e.g., process exits immediately)

5. EXPLICIT APPROVAL (for INFRASTRUCTURE or ORCHESTRATION class)
   □ State: "This operation will kill [process] which is [class]"
   □ State: "Blast radius: [description]"
   □ State: "Rollback: [command]"
   □ Get explicit approval ("proceed" or "approved") before executing

6. POST-OPERATION VERIFICATION
   □ Run: pm2 jlist — confirm process is back online
   □ Run relevant health checks
   □ Verify no other processes were affected
```

---

## SAFE RESTART TOOLING

### Tool: `/ops/safe-process.js`

A bounded process management tool that:

1. Reads PROCESS-REGISTRY from `/ops/PROCESS-REGISTRY.md`
2. Validates target process against protected classes
3. Requires explicit approval for INFRASTRUCTURE/ORCHESTRATION kills
4. Executes only the specific named process restart
5. Verifies recovery within 60 seconds
6. Logs all operations to CHANGELOG

```javascript
// Pseudocode — actual file to be written in future hardening phase

const { listProcesses } = require('./pm2-utils');
const { readProcessRegistry } = require('./process-registry');

async function safeRestart(targetProcessName) {
  // 1. Get process list
  const processes = await listProcesses();
  const target = processes.find(p => p.name === targetProcessName);
  
  // 2. Check protected registry
  const registry = readProcessRegistry();
  const entry = registry.find(r => r.pm2_name === targetProcessName);
  
  if (!entry) {
    throw new Error(`Process ${targetProcessName} not in registry — safety check failed`);
  }
  
  // 3. Classify blast radius
  const blastRadius = entry.blast_radius;
  const protectedClass = entry.protected_class;
  
  if (protectedClass === 'INFRASTRUCTURE') {
    throw new Error(`REFUSING to restart ${targetProcessName} — INFRASTRUCTURE class. Requires explicit approval.`);
  }
  
  if (protectedClass === 'ORCHESTRATION' && !approved) {
    throw new Error(`RESTARTING ${targetProcessName} — ORCHESTRATION class. Monitoring will be offline.`);
  }
  
  // 4. Execute only the specific restart
  await pm2Restart(targetProcessName);
  
  // 5. Verify recovery
  const recovered = await waitForProcess(targetProcessName, 60000);
  if (!recovered) {
    addAlert(`RESTART FAILED: ${targetProcessName} did not recover within 60 seconds`);
  }
  
  // 6. Log to CHANGELOG
  appendToChangelog({
    who: 'moosa',
    what: `safe restart ${targetProcessName}`,
    why: 'safe-process.js enforcement',
    rollback: entry.restart_method,
    validation: recovered ? 'PASSED' : 'FAILED'
  });
}
```

---

## BOUNDED KILL SCOPES

### Principle: Most-Selective Kill Possible

When a process must be killed:

```
WRONG:  pkill -9 node                    # kills ALL node processes
RIGHT:  kill -9 $(pm2 pid moosa-worker)  # kills only moosa-worker

WRONG:  pm2 kill                        # kills ALL pm2 processes
RIGHT:  pm2 delete moosa-worker         # deletes only named process
```

### Kill Scope Hierarchy (most to least preferred)

```
1. PREFERRED: pm2 restart <name>         # graceful restart, no data loss
2. SAFE:     kill -9 $(pm2 pid <name>)  # SIGKILL specific PID only
3. CAUTION:  pm2 stop <name>            # SIGTERM, graceful shutdown
4. DANGEROUS: pkill -9 <pattern>        # matches multiple processes
5. NUCLEAR:  pkill -9 node               # NEVER without inventory + approval
```

---

## RUNTIME RECOVERY AUTOMATION

### Recovery Trigger: Exec Infrastructure Failure

When exec becomes non-responsive after a destructive operation:

**Step 1:** Detect
- Exec commands start timing out
- pm2 commands return no output

**Step 2:** Classify
- Is moosa-worker still running? → Worker alive, exec handler issue
- Is gateway still running? → Gateway alive, session issue
- Are ALL PM2 processes down? → pm2d itself crashed

**Step 3:** Notify Ahmad
```
⚠️ RUNTIME DEGRADED
Exec: non-responsive
Worker: [alive/offline]
Gateway: [alive/offline]
Service impact: [none/partial/total]
Action required: [session restart / pm2 restart / manual intervention]
```

**Step 4:** Recovery
- If exec handler crashed → restart session (Ahmad action)
- If moosa-worker crashed → `pm2 restart moosa-worker` (bounded, safe)
- If all PM2 down → escalate to Ahmad (NUCLEAR level)

---

## IMPLEMENTATION SEQUENCE (Future Hardening Phase)

**This document is for future implementation. Not implemented yet.**

| Phase | Content | Priority |
|-------|---------|----------|
| Future Phase X | Create `/ops/PROCESS-REGISTRY.md` with all PM2 processes | HIGH |
| Future Phase X | Write `/ops/safe-process.js` bounded restart tool | HIGH |
| Future Phase X | Update AGENTS.md with process operation checklist | MEDIUM |
| Future Phase X | Add to CHANGELOG: all future process operations | LOW |
| Future Phase X | Runtime recovery automation (exec failure detection) | MEDIUM |

---

## OPEN QUESTIONS

1. Should the protected process registry be maintained manually (updated on every new PM2 process), or auto-discovered via PM2 list?

2. Should safe-process.js block ALL destructive operations, or only those targeting INFRASTRUCTURE/ORCHESTRATION class?

3. Is there an approved recovery procedure for exec handler failure that doesn't require Ahmad manually restarting the gateway?

4. Should `pm2 kill` (kill all) be permanently aliased to error out with a safety message?

---

*Moosa — CEO — Documented 2026-05-15*