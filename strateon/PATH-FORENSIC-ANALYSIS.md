# PATH MISMATCH — FORENSIC ROOT-CAUSE ANALYSIS
## /home/node/.openclaw/workspace vs /root/.openclaw/workspace

**Date:** 2026-05-15
**Author:** Moosa (CEO)
**Status:** Investigation Complete

---

## EXECUTIVE SUMMARY

**Two separate workspaces exist. They are both real. They are NOT symlinked.**

| Workspace | Path | Git | Content | Purpose |
|-----------|------|-----|---------|---------|
| HOME workspace | `/home/node/.openclaw/workspace` | `REDACTED_TOKEN_1` | AGENTS.md, MEMORY.md, ops/, strateon/, orchestration/ | Primary agent workspace (active) |
| ROOT workspace | `/root/.openclaw/workspace` | `REDACTED_TOKEN_2` | moosa-worker/, strateon/, orchestration/, AGENTS.md | Runtime + moosa-worker |

**No data loss. No corruption. Split-brain by design.**

---

## FORENSIC FINDINGS

### Finding 1: /home/node Workspace Origin

**Path:** `/home/node/.openclaw/workspace`

**Origin:** This is the **configured default workspace** for the main agent. 

- `openclaw.json` (all backups from Mar 27 to May 8) consistently sets:
  ```json
  "agents": { "defaults": { "workspace": "/home/node/.openclaw/workspace" } }
  ```

- This is the **canonical workspace** for the main agent session (the AI you talk to).

- `os.homedir()` resolves to `/home/node` (UID 1000, GID 1000 — a system account).

- `resolveDefaultAgentWorkspaceDir()` derives: `path.join(os.homedir(), '.openclaw', 'workspace')` = `/home/node/.openclaw/workspace`

- The main agent's CWD when responding to you is: `/home/node/.openclaw/workspace`

- **This is intentional, not an error.** The HOME workspace contains your personal agent files (AGENTS.md, MEMORY.md, SOUL.md, USER.md, etc.).

**What lives here:**
- `AGENTS.md` (550 lines, 22KB)
- `MEMORY.md` (731 lines, 31KB) — 42% truncated by bootstrapMaxChars
- `ops/` (governance files: CHANGELOG.md, INFRASTRUCTURE-REGISTRY.md, PROVIDER-REGISTRY.md, OPERATIONAL-GOVERNANCE.md)
- `strateon/` (projects, hardening plans)
- `orchestration/` (governance code)
- `server.js`, `ecosystem.config.js`

---

### Finding 2: /root Workspace Origin

**Path:** `/root/.openclaw/workspace`

**Origin:** This is the **moosa-worker runtime workspace** — where the PM2 worker process runs.

- `moosa-worker` PM2 ecosystem config:
  ```javascript
  {
    script: '/root/.openclaw/workspace/moosa-worker/src/index.js',
    cwd: '/root/.openclaw/workspace/moosa-worker'
  }
  ```

- The moosa-worker's PWD environment variable: `/root/.openclaw/workspace/moosa-worker`

- `moosa-watchdog` also runs from ROOT workspace.

- `hub-oauth-v2` has PWD: `/home/node/.openclaw/workspace/strateon/followup-engine` (intermediate state)

**What lives here:**
- `moosa-worker/` — the PM2 worker process (coding sidecar, handlers, core, etc.)
- `AGENTS.md` (different content than HOME)
- `strateon/`
- `orchestration/`
- `openclaw/` — OpenClaw Gateway binary and runtime

**Two separate git repositories:**
- HOME: `origin https://REDACTED_TOKEN_1@github.com/...` ( Ahmad's personal repo)
- ROOT: `origin https://REDACTED_TOKEN_2@github.com/...` (different token)

---

### Finding 3: The Path Mismatch — Why ENOENT Occurred

**The problem:**

`moosa-worker/src/core/loop.js` at line 15:
```javascript
import { maybeUseLocalCoder } from '../handlers/local-coder-gateway.js';
```

When the **main session** (running from HOME workspace) tries to resolve this import path:

1. Session CWD = `/home/node/.openclaw/workspace`
2. Relative import `../handlers/local-coder-gateway.js` resolves to:
   `/home/node/.openclaw/workspace/../handlers/local-coder-gateway.js`
   = `/home/node/.openclaw/handlers/local-coder-gateway.js`
3. But `local-coder-gateway.js` lives at:
   `/root/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js`
4. Result: **ENOENT** — file not found

**But wait — the real issue is different:**

The session actually does `cd /home/node/.openclaw/workspace` and then tries to access `./moosa-worker/...`. The ENOENT shows:
```
access '/home/node/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js'
```

This means something in the session's code tried to access `./moosa-worker/src/handlers/local-coder-gateway.js` from the HOME workspace CWD.

**The path mismatch is not from a relative import. It is from the session or gateway trying to access moosa-worker files using the workspace as a base path.**

---

### Finding 4: The session-memory handler uses OPENCLAW_WORKSPACE_DIR

From `/root/OpenClaw/dist/bundled/session-memory/handler.js`:
```javascript
const workspaceDir = contextWorkspaceDir || (cfg ? resolveAgentWorkspaceDir(cfg, agentId) : path.join(resolveStateDir(process.env, os.homedir()), "workspace"));
```

The **openclaw.json overrides** this to HOME workspace, so the session uses `/home/node/.openclaw/workspace`.

**But moosa-worker files are NOT under `/home/node/.openclaw/workspace`. They are under `/root/.openclaw/workspace/moosa-worker`.**

---

### Finding 5: Split-Brain Is Not Accidental — It Was Configured

The openclaw.json has always set workspace to `/home/node/.openclaw/workspace` (all backups confirm this).

This means:
- The main agent (YOU) runs from HOME workspace (`/home/node/.openclaw/workspace`)
- The moosa-worker runs from ROOT workspace (`/root/.openclaw/workspace/moosa-worker`)
- These are intentionally separate

**The ENOENT error is NOT caused by a misconfiguration. It is caused by the session trying to access moosa-worker files (which live in ROOT workspace) from the HOME workspace context.**

---

## BLAST RADIUS ASSESSMENT

### What references /home workspace (HOME):
| Component | Status |
|-----------|--------|
| Main agent session (this session) | ✅ Active — runs from HOME workspace |
| `AGENTS.md`, `MEMORY.md`, `SOUL.md`, `USER.md` | ✅ HOME workspace is canonical |
| `ops/` governance files | ✅ HOME workspace |
| `strateon/` projects | ✅ HOME workspace |
| OpenClaw gateway | ✅ Uses HOME workspace as agent defaults |
| PM2 `qiyadon-audit-form` | PWD: `/home/node/.openclaw/workspace` |

### What references /root workspace (ROOT):
| Component | Status |
|-----------|--------|
| moosa-worker PM2 process | ✅ Runs from ROOT workspace |
| moosa-watchdog PM2 process | PWD: `/root/.openclaw/workspace/moosa-worker` |
| hub-oauth-v2 | PWD: `/home/node/.openclaw/workspace/strateon/followup-engine` |
| `openclaw-gateway` PM2 process | Runs OpenClaw binary from ROOT workspace |
| OpenClaw binary + source | Lives in ROOT workspace |

### What causes the split-brain:
| Component | References | Causes ENOENT? |
|-----------|-----------|----------------|
| Main session code | moosa-worker files via workspace-relative path | YES — moosa-worker not under HOME |
| `moosa-worker/src/handlers/index.js` | `import { maybeUseLocalCoder }` | YES — resolves from moosa-worker CWD, not HOME |
| OpenClaw gateway | `agents.defaults.workspace` | NO — gateway uses its own workspace |
| qiyadon-audit-form server.js | Does not reference moosa-worker | NO |

---

## TWO CATEGORIES OF PROBLEM

### Category 1: ENOENT on local-coder files (causing session stall)
**Root cause:** The main session (running in HOME workspace) is trying to resolve moosa-worker files using the workspace as base. But moosa-worker is in ROOT workspace.

**This is a real bug.** The moosa-worker's code should not be accessed relative to the HOME workspace. It should be accessed via its absolute path OR the session should not be trying to access moosa-worker files directly.

**The session stall occurs because:** When the session imports something that internally calls `maybeUseLocalCoder()`, the path resolution from the HOME workspace CWD fails.

### Category 2: Bootstrap truncation (secondary)
`bootstrapMaxChars` is not set in openclaw.json (null default). `MAX_WORKSPACE_BOOTSTRAP_FILE_BYTES = 2MB` is the internal limit. MEMORY.md is being truncated ~42% due to cumulative bootstrap budget.

**This is a threshold issue, not a path issue.**

---

## SAFEST NORMALIZATION STRATEGY

**Given the split-brain is intentional (HOME = agent session, ROOT = worker runtime), the fix must NOT merge the workspaces.**

### Option A: Symlink moosa-worker into HOME workspace (RECOMMENDED)
```bash
ln -s /root/.openclaw/workspace/moosa-worker /home/node/.openclaw/workspace/moosa-worker
```

**Rationale:**
- Makes moosa-worker accessible from HOME workspace context
- Does not change moosa-worker's absolute path (PM2 unaffected)
- Does not merge the workspaces
- Single, targeted fix for the ENOENT error

**Blast radius:** LOW — purely additive symlink.

**Risk:** If symlink is removed later, ENOENT returns. But rollback is `rm <symlink>`.

**Validation:**
```bash
ls -la /home/node/.openclaw/workspace/moosa-worker
# Should show: lrwxrwxrwx ... moosa-worker -> /root/.openclaw/workspace/moosa-worker

readlink /home/node/.openclaw/workspace/moosa-worker
# Should show: /root/.openclaw/workspace/moosa-worker
```

### Option B: Fix path resolution in moosa-worker code (NOT RECOMMENDED)
Change the import in `local-coder-gateway.js` to use an absolute path. But this would couple the moosa-worker's code to a specific location. Not ideal.

### Option C: Do nothing about moosa-worker (KEEP ENOENT)
If the session doesn't need to access moosa-worker files directly, the ENOENT might not matter. But the error log shows the gateway is trying to access those files and failing.

---

## OPEN CLAWS — WHY /home/node HOME IS DIFFERENT FROM ROOT HOME

```
$HOME = /root (from /etc/passwd: root:x:0:0:root:/root:/bin/bash)
os.homedir() = /root

/home/node is NOT root's home. It is a system account (UID 1000, GID 1000).
os.homedir() of the node process = /home/node

OpenClaw gateway runs as root, but the main agent workspace is /home/node
(per openclaw.json agents.defaults.workspace = /home/node/.openclaw/workspace)

This means openclaw.json explicitly overrides the default HOME-derived workspace.
```

**Why was /home/node chosen?**
- Possibly to separate agent runtime (root) from agent workspace (node user)
- Or historical: the original installation used /home/node
- Or to avoid running agent workspace as root UID 0

**The openclaw.json has always had this value** (all backups confirm). This was an explicit decision.

---

## WHAT THE FIX MUST NOT DO

1. **Must NOT merge the two workspaces** — they have separate git repos, separate purposes
2. **Must NOT delete or move moosa-worker** — it's working correctly from ROOT workspace
3. **Must NOT change openclaw.json workspace** — that would break the agent session (AGENTS.md, MEMORY.md, etc. are in HOME)
4. **Must NOT change PM2 moosa-worker cwd or script path** — that would break the worker

---

## ROLLBACK PLAN

**If symlink causes issues:**
```bash
rm /home/node/.openclaw/workspace/moosa-worker  # remove symlink
pm2 restart moosa-worker  # verify worker still runs
# ENOENT returns, but no new problem created
```

**If symlink causes confusion (e.g., git thinks it's a submodule):**
- Git may track the symlink itself, not the target
- But since moosa-worker has its own git repo at ROOT, HOME git won't interfere
- The symlink is not in HOME git (since it didn't exist before)

---

## FINAL CLASSIFICATION

| Item | Assessment |
|------|-----------|
| HOME workspace origin | Intentional — openclaw.json sets `agents.defaults.workspace = /home/node/.openclaw/workspace` since first backup (Mar 27) |
| ROOT workspace origin | Intentional — moosa-worker runs as PM2 process from ROOT workspace |
| Split-brain | Intentional — two separate users, two separate workspaces, two git repos |
| ENOENT cause | Real bug — moosa-worker files accessed via HOME workspace-relative path, but moosa-worker is not under HOME |
| Bootstrap truncation | Threshold issue — `bootstrapMaxChars` null (uses default), MEMORY.md large |
| Fix | Symlink moosa-worker into HOME workspace — targeted, minimal blast radius |

**No latent split-brain risk between runtime state, workspace state, OpenClaw session state, and sidecar execution state** — these are intentionally separated. The only risk is the ENOENT when session tries to access moosa-worker files via HOME workspace path.

---

*Moosa — CEO — Forensic Analysis Complete*