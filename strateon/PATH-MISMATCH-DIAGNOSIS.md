# Path Mismatch Diagnosis + Proposed Fix
## moosa-worker: /root vs /home Node Path Resolution

**Date:** 2026-05-15
**Severity:** HIGH — causing session stall
**Author:** Moosa (CEO)

---

## DIAGNOSIS

### Root Cause Confirmed

```
Main agent workspace (openclaw.json):     /home/node/.openclaw/workspace
moosa-worker actual location:             /root/.openclaw/workspace/moosa-worker
moosa-worker path session resolves:       /home/node/.openclaw/workspace/moosa-worker
RESULT:                                    DOES NOT EXIST → ENOENT
```

**Evidence:**
```
gateway log:  ENOENT: no such file or directory, access '/home/node/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js'
ls /home/node/.openclaw/workspace/moosa-worker/  → DOES NOT EXIST
ls /root/.openclaw/workspace/moosa-worker/src/handlers/  → local-coder-gateway.js local-coder.js local-coder-policy.js (EXISTS)
```

**openclaw.json configuration:**
```json
{
  "agents": {
    "defaults": {
      "workspace": "/home/node/.openclaw/workspace"
    },
    "list": [
      { "id": "main" }
    ]
  }
}
```

**PM2 moosa-worker configuration:**
```javascript
{
  name: 'moosa-worker',
  script: '/root/.openclaw/workspace/moosa-worker/src/index.js',  // ← correct path
  cwd: '/root/.openclaw/workspace/moosa-worker'                     // ← correct path
}
```

**Conclusion:** The main agent's workspace resolves to `/home/node/.openclaw/workspace`, but moosa-worker code is installed at `/root/.openclaw/workspace/moosa-worker`. When the main session (or any component resolving from agent workspace) tries to read moosa-worker files, it uses the wrong path and gets ENOENT.

### Session Stall Mechanism

1. Main session CWD = `/home/node/.openclaw/workspace`
2. OpenClaw gateway routes to main agent, resolves relative paths against workspace
3. moosa-worker code (from loop.js or other imports) attempts to read `../handlers/local-coder-gateway.js` relative to workspace
4. Resolved path: `/home/node/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js`
5. File doesn't exist → ENOENT error
6. Gateway logs "missing file: local-coder-gateway.js"
7. Session lane stalls, "no reply from agent"
8. `lane wait exceeded` logged (226589ms in most recent instance)

### Secondary Factor: AGENTS.md / MEMORY.md Truncation

From the startup message:
```
[Bootstrap truncation warning]
Some workspace bootstrap files were truncated before injection.
MEMORY.md: 30985 raw -> 18110 injected (~42% removed)
```

AGENTS.md and MEMORY.md are being truncated by OpenClaw's bootstrap system (`agents.defaults.bootstrapMaxChars`). This means the session is operating with incomplete governance context. This is a contributing factor to the stall — the session may be trying to resolve files it can't find because the context is incomplete.

**AGENTS.md size:** 550 lines (22KB) — not the cause of truncation
**MEMORY.md size:** 731 lines (31KB) — at threshold

The truncation warning says "some workspace bootstrap files were truncated" — this implies the files exist but are being cut. The truncation is likely cutting the MEMORY.md which has critical context (Vision, Mission, Phase status).

**This is separate from the path mismatch but compounds the stall behavior.**

---

## TWO INDEPENDENT ISSUES

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| Path mismatch | openclaw.json workspace = `/home/node/.openclaw/workspace`, moosa-worker at `/root/.openclaw/workspace/moosa-worker` | ENOENT on moosa-worker files → session stall |
| Bootstrap truncation | `bootstrapMaxChars` limit cutting MEMORY.md (~42% removed) | Incomplete governance context → degraded session behavior |

Both must be addressed. The path mismatch is the primary stall cause.

---

## PROPOSED FIX

### Primary Fix: Symlink moosa-worker Into Agent Workspace

```bash
ln -s /root/.openclaw/workspace/moosa-worker /home/node/.openclaw/workspace/moosa-worker
```

**What this does:**
- Creates `/home/node/.openclaw/workspace/moosa-worker` as a symlink to `/root/.openclaw/workspace/moosa-worker`
- When the main session resolves `moosa-worker/src/handlers/local-coder-gateway.js`, it finds the file via the symlink
- moosa-worker PM2 process is unaffected (it uses absolute path `/root/.openclaw/workspace/moosa-worker`)
- Coding sidecar files become accessible from both paths

**Files after symlink:**
```
/home/node/.openclaw/workspace/moosa-worker/       → symlink → /root/.openclaw/workspace/moosa-worker/
/root/.openclaw/workspace/moosa-worker/           → actual files
```

**Verification after symlink:**
```bash
ls -la /home/node/.openclaw/workspace/moosa-worker
# Should show: lrwxrwxrwx ... moosa-worker -> /root/.openclaw/workspace/moosa-worker

readlink /home/node/.openclaw/workspace/moosa-worker
# Should show: /root/.openclaw/workspace/moosa-worker

ls /home/node/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js
# Should show: exists (via symlink)
```

### Secondary Fix: Increase Bootstrap Max Chars

In openclaw.json, increase `bootstrapMaxChars` to prevent MEMORY.md truncation:

```json
{
  "agents": {
    "defaults": {
      "bootstrapMaxChars": 100000,
      "bootstrapTotalMaxChars": 200000
    }
  }
}
```

This is a configuration change to openclaw.json. Must restart openclaw-gateway after change.

---

## BLAST RADIUS ASSESSMENT

### Symlink (Primary Fix)

| Aspect | Impact |
|--------|--------|
| moosa-worker PM2 process | None — uses absolute path `/root/.openclaw/workspace/moosa-worker` |
| OpenClaw gateway | None — workspace path unchanged |
| Main session | Fixes ENOENT on moosa-worker files — resolves stall |
| Coding sidecar | Files remain at `/root/.openclaw/workspace/moosa-worker/` — accessible via both paths |
| Other agents | `musa-support` uses its own workspace — unaffected |
| Risk if reverted | Symlink removal → path error returns → stall resumes |

**Blast radius: LOW** — purely additive. No existing configuration changed. No data loss risk.

### Bootstrap Config Change (Secondary Fix)

| Aspect | Impact |
|--------|--------|
| Session startup | More context loaded → better governance availability |
| Memory usage | Slightly higher per-session memory (MEMORY.md fully loaded) |
| Gateway restart | Required — brief outage during restart |

**Blast radius: LOW** — configuration only.

---

## ROLLBACK PLAN

### If symlink causes issues:

```bash
# Remove symlink
rm /home/node/.openclaw/workspace/moosa-worker

# Verify moosa-worker still works (absolute path unaffected)
pm2 restart moosa-worker
pm2 logs moosa-worker --lines 5 --nostream
```

**After rollback:** ENOENT returns, session stall resumes (original problem). But no new problem created.

### If bootstrap config causes issues:

```bash
# Revert openclaw.json
git checkout -- openclaw.json

# Restart gateway
pm2 restart openclaw-gateway
```

**After rollback:** Truncation returns (original problem). No new problem created.

---

## IMPLEMENTATION SEQUENCE

1. **Create symlink** (no service interruption):
   ```bash
   ln -s /root/.openclaw/workspace/moosa-worker /home/node/.openclaw/workspace/moosa-worker
   ```

2. **Verify symlink resolves:**
   ```bash
   ls /home/node/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js
   ```

3. **Update openclaw.json** (bootstrap increase):
   ```json
   {
     "agents": {
       "defaults": {
         "bootstrapMaxChars": 100000,
         "bootstrapTotalMaxChars": 200000
       }
     }
   }
   ```

4. **Restart openclaw-gateway** (brief outage):
   ```bash
   pm2 restart openclaw-gateway
   ```

5. **Send test message via WhatsApp** — verify session responds within 2 minutes

---

## CONFIRMATION CHECKLIST BEFORE IMPLEMENTATION

- [ ] `ln -s /root/.openclaw/workspace/moosa-worker /home/node/.openclaw/workspace/moosa-worker` will create symlink (not copy)
- [ ] moosa-worker PM2 process uses absolute path — unaffected by symlink
- [ ] Coding sidecar files (`local-coder*.js`) will be accessible from both `/home/.../moosa-worker/` and `/root/.../moosa-worker/`
- [ ] Session stall is primarily caused by path mismatch (confirmed via gateway log ENOENT)
- [ ] Bootstrap truncation is secondary factor (separate from path mismatch)
- [ ] No other processes depend on `/home/node/.openclaw/workspace/moosa-worker` (confirmed — directory doesn't exist)

---

## WHAT THIS FIX DOES NOT ADDRESS

- Instruction bridge wiring (Phase 2) — still blocked pending sidecar implementation
- Delaware C-Corp, Stripe, VP Sales, HubSpot OAuth — human actions required
- Any other revenue blocker

---

*Moosa — CEO — Diagnosis Complete, Fix Proposed*