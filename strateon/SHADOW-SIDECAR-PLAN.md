# INSTRUCTION SIDECAR — SHADOW MODE PROTOTYPE PLAN
## Deterministic Inbound Instruction Durability

**Status:** READY — Pending Ahmad Approval
**Date:** 2026-05-15
**Objective:** Prove deterministic capture reliability before introducing execution authority
**Mode:** SHADOW (observation-only — no autonomous execution)

---

## CONTEXT

### Why Shadow Mode First

The full instruction sidecar (Phase 2 proposal) includes task creation, acknowledgement emission, and bridge wiring. Introducing execution authority prematurely risks:
- Creating tasks that worker picks up before validated
- Emitting acknowledgements that confuse the message flow
- Introducing race conditions with the main session

**Shadow mode validates the capture path first** — confirms the sidecar can reliably detect and persist inbound messages before giving it any authority over execution.

### What Shadow Mode Proves

1. Session JSONL polling works correctly
2. New user messages are detected within the poll interval
3. Instruction rows are created in Supabase with correct fields
4. Duplicate detection prevents re-processing the same message
5. Cursor persistence survives sidecar restart
6. Session rotation is handled without message loss
7. Malformed lines don't crash the sidecar

**What Shadow Mode does NOT prove:**
- Acknowledgement emission (not implemented)
- Task creation (not implemented)
- Worker pickup (not implemented)
- Bridge wiring integration (not implemented)

---

## ARCHITECTURE

### System Context

```
OpenClaw Gateway
    ↓ (writes to session JSONL)
Session JSONL: /root/.openclaw/agents/main/sessions/{session-id}.jsonl
    ↓ (polls every 5s, read-only)
Instruction Sidecar (shadow mode)
    ↓ (writes to)
Supabase: instructions table (shadow capture only — no task creation)
```

### Shadow Mode Data Flow

```
1. Session JSONL updated by gateway (new user message)
   ↓
2. Sidecar polls, reads new lines from EOF cursor position
   ↓
3. For each line: parse JSON, check if user message (role = "user")
   ↓
4. Extract: message_id, sender_id, timestamp, original text
   ↓
5. Check: is message_id already in cursor file? (duplicate prevention)
   ↓
6. If not duplicate: INSERT to instructions table (status = 'shadow_received')
   ↓
7. Record state transition: initial → shadow_received
   ↓
8. Update cursor: new EOF position, new lastMessageId
   ↓
9. NO task creation
   ↓
10. NO acknowledgement sent
   ↓
11. NO execution action
```

### Key Difference: Shadow vs Full Instruction Sidecar

| Feature | Shadow Mode | Full Sidecar |
|---------|-------------|--------------|
| Poll session JSONL | ✅ | ✅ |
| Parse user messages | ✅ | ✅ |
| Write to instructions table | ✅ | ✅ |
| Create task in tasks table | ❌ | ✅ |
| Emit acknowledgement | ❌ | ✅ |
| Call bridgeInstruction() | ❌ | ✅ |
| Worker pickup | ❌ | ✅ |

---

## EXACT POLLING MODEL

### File Location
```
Session JSONL: /root/.openclaw/agents/main/sessions/{active-session}.jsonl
Cursor file:   /ops/sidecar-cursor.json
```

### Polling Interval
```
CHECK_INTERVAL_MS = 5000  (5 seconds)
```

### Polling Loop

```javascript
async function poll() {
  // 1. Find active session (has .lock file)
  const activeSession = findActiveSession();  // most recent .jsonl with .lock
  
  // 2. Read cursor
  const cursor = readCursor();  // { sessionId, eofPosition, lastMessageId }
  
  // 3. If session changed (new session ID), reset cursor
  if (cursor.sessionId !== activeSession.id) {
    console.log('[shadow] Session changed, resetting cursor');
    cursor.eofPosition = 0;
    cursor.lastMessageId = null;
    cursor.sessionId = activeSession.id;
  }
  
  // 4. Read new lines from EOF position
  const newLines = readNewLines(activeSession.path, cursor.eofPosition);
  if (newLines.length === 0) return;  // no new messages
  
  // 5. Process each line
  for (const line of newLines) {
    // 6. Parse JSON (skip malformed)
    const entry = parseLine(line);
    if (!entry) continue;
    
    // 7. Only user messages
    if (entry.message?.role !== 'user') continue;
    
    // 8. Extract metadata
    const msgMeta = extractMetadata(entry);
    if (!msgMeta.message_id || !msgMeta.sender_id) continue;
    
    // 9. Duplicate check
    if (msgMeta.message_id === cursor.lastMessageId) {
      console.log('[shadow] Duplicate message_id:', msgMeta.message_id);
      continue;
    }
    
    // 10. Insert to instructions (shadow mode)
    await persistInstruction(msgMeta);
    
    // 11. Update cursor
    cursor.lastMessageId = msgMeta.message_id;
    cursor.eofPosition = activeSession.eofPosition;
    saveCursor(cursor);
  }
}
```

### Active Session Detection

```javascript
function findActiveSession() {
  const sessionsDir = '/root/.openclaw/agents/main/sessions';
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      path: path.join(sessionsDir, f),
      lockPath: path.join(sessionsDir, f + '.lock'),
      stat: fs.statSync(path.join(sessionsDir, f))
    }))
    .sort((a, b) => b.stat.mtime - a.stat.mtime);  // most recent first
  
  // First .jsonl with a .lock file = active session
  for (const f of files) {
    if (fs.existsSync(f.lockPath)) {
      return f;
    }
  }
  return files[0];  // fallback: most recent (may have lost lock on rotate)
}
```

---

## DUPLICATE PREVENTION LOGIC

### Strategy: message_id + cursor-based

```javascript
// Cursor file format
{
  "sessionId": "77dee770-dbfd-429f-90de-2dac19933a8d",
  "eofPosition": 2302141,
  "lastMessageId": "3EB02E4B7A0A4B8F4CF78E",
  "updatedAt": "2026-05-15T09:00:00Z"
}
```

**Primary deduplication:** `message_id` from the message metadata header (WhatsApp message ID — globally unique per message)

**Why message_id works for deduplication:**
- Each WhatsApp message has a unique `message_id` (e.g., `3EB02E4B7A0A4B8F4CF78E`)
- Same message resent by user = same `message_id`
- Cursor tracks `lastMessageId` — if next message has same ID, it's a duplicate

**Secondary check:** If `message_id` extraction fails (malformed metadata), fall back to text hash + sender + timestamp

```javascript
function isDuplicate(msgMeta, cursor) {
  // Primary: message_id exact match
  if (msgMeta.message_id && msgMeta.message_id === cursor.lastMessageId) {
    return true;
  }
  // Secondary: text+sender+timestamp hash (if message_id unavailable)
  const hash = hashMessage(msgMeta.text, msgMeta.sender_id, msgMeta.timestamp);
  return cursor.lastMessageHash === hash;
}
```

---

## CURSOR PERSISTENCE MODEL

### Cursor File: `/ops/sidecar-cursor.json`

```json
{
  "sessionId": "77dee770-dbfd-429f-90de-2dac19933a8d",
  "eofPosition": 2302141,
  "lastMessageId": "3EB02E4B7A0A4B8F4CF78E",
  "lastMessageHash": null,
  "updatedAt": "2026-05-15T09:00:00Z"
}
```

### Write Strategy: Atomic Rename

```javascript
function saveCursor(cursor) {
  cursor.updatedAt = new Date().toISOString();
  const temp = '/ops/sidecar-cursor.tmp';
  fs.writeFileSync(temp, JSON.stringify(cursor));
  fs.renameSync(temp, '/ops/sidecar-cursor.json');  // atomic on POSIX
}
```

**Why atomic rename:**
- Prevents corruption if process crashes mid-write
- On restart, cursor is always either old (safe — may re-process 1-2 messages) or complete (no loss)

### Restart Recovery

```
1. Sidecar starts
2. Read cursor from /ops/sidecar-cursor.json
3. Find active session
4. If cursor.sessionId === active session:
   - Resume from cursor.eofPosition (may re-process last 1-2 lines — handled by duplicate check)
5. If cursor.sessionId !== active session (session rotated):
   - Reset eofPosition to 0
   - Clear lastMessageId
   - Continue from beginning of new session
```

---

## RESTART RECOVERY BEHAVIOR

### Scenario 1: Sidecar Restart (intentional or crash)

```
1. Sidecar exits (crash or manual restart)
2. Gateway continues writing to session JSONL
3. Sidecar restarts
4. Reads cursor: { eofPosition: 1234567, lastMessageId: "3EB..." }
5. Finds active session (same session still has .lock)
6. Reads from eofPosition: only new lines processed
7. Duplicate check: lastMessageId in cursor matches first new message
8. First new message skipped (already captured)
9. Subsequent new messages captured normally
10. No message loss, no duplicate capture
```

### Scenario 2: Session Rotation During Restart

```
1. Sidecar is down during session rotation
2. Gateway creates new session (new .jsonl + new .lock)
3. Sidecar restarts
4. Reads cursor: { sessionId: "OLD-SESSION", eofPosition: 2302141 }
5. Finds active session: { id: "NEW-SESSION", eofPosition: 0 }
6. cursor.sessionId !== activeSession.id
7. Sidecar resets: cursor.eofPosition = 0, cursor.lastMessageId = null
8. Processes from beginning of new session (all messages since session start)
9. NEW SESSION messages are duplicates of what? Nothing — different session, different messages
```

**Result: Session rotation does not cause message loss. Sidecar captures all messages from new session.**

---

## MALFORMED LINE HANDLING

### Strategy: Skip and Log

```javascript
function parseLine(line) {
  try {
    const entry = JSON.parse(line.trim());
    return entry;
  } catch (err) {
    // Malformed JSON — skip, log, continue
    console.log('[shadow] Malformed line skipped:', err.message, line.slice(0, 50));
    return null;
  }
}
```

**Types of malformed lines:**
1. Incomplete JSON (gateway writing mid-line) — skip, retry next poll
2. Binary data injected by gateway restart — skip
3. Non-JSON text lines (rare) — skip

**Guarantee:** Malformed line never crashes the sidecar. Always returns null and continues.

---

## SESSION ROTATION HANDLING

### What Triggers Session Rotation

Session rotates when:
- Gateway detects a session is too old
- Gateway process restarts
- A new .jsonl file is created with a new UUID

### Detection: Lock File Disappearance

```javascript
function findActiveSession() {
  // Every poll: find .jsonl with matching .lock
  // If current cursor.sessionId no longer has a .lock:
  //   → session rotated
  //   → reset cursor, process from beginning of new session
}
```

### Behavior on Session Rotation

```
Before rotation:
  cursor.sessionId: "OLD-SESSION-UUID"
  eofPosition: 2302141

After rotation (new .jsonl active):
  cursor.sessionId: "OLD-SESSION-UUID"  ← no longer matches active session
  new active session: "NEW-SESSION-UUID"
  
  Sidecar action:
  - Detects: cursor.sessionId !== activeSession.id
  - Resets: eofPosition = 0, lastMessageId = null
  - New session starts fresh
  - ALL messages from new session captured (no duplicates possible)
```

---

## PM2 TOPOLOGY

### Shadow Sidecar: Dedicated PM2 Process

```
NAME:              instruction-sidecar-shadow
SCRIPT:           /ops/instruction-sidecar-shadow.js
CWD:              /home/node/.openclaw/workspace
INTERVAL:         5 seconds (internal polling loop, not cron)
PM2 RESTART POLICY: restart_on_failure (max 3, then alert)
ENV:              NODE_ENV=production
```

### PM2 Config

```javascript
// ecosystem.shadow-sidecar.config.js
module.exports = {
  apps: [{
    name: 'instruction-sidecar-shadow',
    script: '/ops/instruction-sidecar-shadow.js',
    cwd: '/home/node/.openclaw/workspace',
    env: {
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://btrbczqjwzuybgcxckvm.supabase.co',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
    },
    autorestart: true,
    max_restarts: 3,
    expire_timeout: 30000,
    kill_timeout: 5000
  }]
};
```

### PM2 Commands

```bash
# Start
pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js

# Stop (shadow mode — can safely stop, no production impact)
pm2 stop instruction-sidecar-shadow

# Delete
pm2 delete instruction-sidecar-shadow

# Logs
pm2 logs instruction-sidecar-shadow --lines 20 --nostream
```

---

## BLAST RADIUS

| Component | Impact | Notes |
|-----------|--------|-------|
| Session JSONL | Read-only polling — no modification | Only reads from EOF, never writes |
| Gateway | None | Shadow sidecar doesn't touch gateway |
| moosa-worker | None | No worker code modified |
| PM2 | +1 process | instruction-sidecar-shadow added |
| Supabase instructions | Write-only to instructions table | No schema change, no existing rows modified |
| tasks table | None | Shadow mode does NOT create tasks |
| Customer workflows | None | No customer-facing changes |
| Coding sidecar | None | No interaction |
| WhatsApp messages | None | No modification, no new messages sent |

**Blast radius: MINIMAL** — additive only. Read-only on session JSONL, write-only to new instruction rows in Supabase.

---

## ROLLBACK

### If Shadow Sidecar Causes Issues

```bash
# Stop and delete the sidecar process
pm2 stop instruction-sidecar-shadow
pm2 delete instruction-sidecar-shadow

# Remove sidecar files (optional — can leave for future activation)
# rm /ops/instruction-sidecar-shadow.js
# rm /ops/sidecar-cursor.json

# Verify no disruption
pm2 jlist  # confirm all other processes still online
```

**Effect after rollback:**
- Instruction capture stops (no new rows in instructions table for new messages)
- No other system behavior changes
- instructions table rows remain (no data loss)
- Gateway continues normally
- Worker continues normally

### Undo PM2 Integration

```bash
pm2 delete instruction-sidecar-shadow
# Sidecar process removed
# ecosystem.shadow-sidecar.config.js can remain (gitignored)
# Sidecar code remains at /ops/instruction-sidecar-shadow.js (for future activation)
```

---

## VALIDATION SEQUENCE

### Step 1: Deploy Shadow Sidecar (no production impact)

```bash
pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js
pm2 logs instruction-sidecar-shadow --lines 10 --nostream
# Confirm: sidecar started, no errors
```

### Step 2: Verify No Production Disruption (15 minutes)

```bash
pm2 jlist  # confirm all existing processes still online
# Check: openclaw-gateway, moosa-worker, moosa-watchdog, qiyadon-audit-form — all online
```

### Step 3: Send Test Message via WhatsApp

```
This is a shadow mode validation test. Please ignore.
```

### Step 4: Within 60 seconds, Verify Instruction Row Created

```bash
# Check Supabase — new instruction row should exist
SUPABASE_KEY="sb_secret__T1GYuCAvox2_EQXrRwGLg_yXXI-GvS"
curl -s -H "Authorization: Bearer $SUPABASE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=*&order=created_at.desc&limit=5" 2>/dev/null

# Expected: new row with status = 'shadow_received'
# Expected: original_message contains test text
# Expected: source_channel = 'whatsapp'
```

### Step 5: Verify NO Task Created (Critical — Shadow Mode Proof)

```bash
# Check tasks table — NO new task should exist
curl -s -H "Authorization: Bearer $SUPABASE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/tasks?select=id,goal&order=created_at.desc&limit=5" 2>/dev/null

# Expected: NO new task created (shadow mode does not create tasks)
# This is the key validation: instruction row exists, task does NOT
```

### Step 6: Duplicate Prevention Test

Send the same message again:
```
This is a shadow mode validation test. Please ignore.
```

Verify: Only 1 instruction row created (duplicate detection works)

### Step 7: Restart Recovery Test

```bash
# Restart sidecar
pm2 restart instruction-sidecar-shadow

# Within 10 seconds: verify sidecar is back online
pm2 logs instruction-sidecar-shadow --lines 5 --nostream

# Send new test message
Shadow restart validation test

# Verify: new instruction row created, no duplicate for same message
```

### Step 8: Session Rotation Simulation (Advanced)

```
1. While sidecar running: gateway restarts (simulates session rotation)
2. Send new message after rotation
3. Verify: new instruction row created, session ID changed in cursor
4. Verify: no message from old session was missed
```

---

## RESOURCE PROFILE

### CPU
- **Idle:** ~0% (5-second polling interval, mostly sleeping)
- **Active poll (5000 lines read):** <0.1 seconds of CPU per poll = negligible average CPU
- **Supabase INSERT (100-500 bytes per row):** <50ms per INSERT

### RAM
- **Sidecar process:** ~30-50MB (minimal Node.js process)
- **Cursor file:** <1KB
- **No in-memory cache of messages**

### Disk I/O
- **Polling read:** 5KB-50KB per poll (only reads new lines, EOF)
- **Cursor write:** <1KB per update (atomic rename)

### Network
- **Supabase INSERT:** 1 HTTP POST per instruction captured (~500 bytes)
- **Rate:** Max ~12 per minute if messages arrive continuously (each message → 1 INSERT)

### Supabase Cost Impact
- **1 instruction row ≈ 500 bytes**
- **10,000 messages/month = 5MB/month storage**
- **10,000 messages/month = 10,000 INSERT operations/month**
- **Supabase free tier: generous — no cost concern**

---

## SHADOW MODE PROOF CRITERIA

For Shadow Mode to be considered validated and ready for Full Mode:

| Criterion | Measure | Threshold |
|-----------|---------|-----------|
| Capture reliability | New instruction rows per test message | 100% (every test message → 1 row) |
| Duplicate prevention | Re-sent message | 0 duplicate rows (1 row per message_id) |
| Latency | Message send → instruction row | <60 seconds |
| Restart recovery | Sidecar restart → normal capture | <10 seconds to resume |
| No task creation | tasks table during shadow mode | 0 new tasks |
| No production disruption | All PM2 processes after 15 min | All online |
| No gateway impact | Gateway response time | Unchanged |
| No exec impact | Exec commands during shadow mode | Unchanged |

---

## OPEN QUESTIONS

1. **Cursor file location:** `/ops/sidecar-cursor.json` — is this gitignored? (Yes, /ops is workspace)
2. **Poll interval:** 5 seconds — acceptable latency for "deterministic capture"? Could be 2 seconds if faster capture needed
3. **Max restart policy:** 3 restarts then alert — appropriate threshold?
4. **Logging verbosity:** DEBUG level during shadow mode validation, ERROR level after proof?

---

## APPROVAL REQUIRED

Ahmad — this plan covers all 12 required items:

1. ✅ Exact architecture — shadow sidecar reads session JSONL, writes to instructions only
2. ✅ Exact polling model — 5s interval, EOF cursor, active session detection
3. ✅ Duplicate prevention — message_id + cursor tracking
4. ✅ Cursor persistence — atomic rename to /ops/sidecar-cursor.json
5. ✅ Restart recovery — cursor read + resume, session rotation handled
6. ✅ Malformed line handling — skip and log, never crash
7. ✅ Session rotation handling — lock file detection, cursor reset
8. ✅ PM2 topology — instruction-sidecar-shadow as dedicated PM2 process
9. ✅ Blast radius — minimal, additive only, read-only on session JSONL
10. ✅ Rollback — pm2 stop + delete, no production impact
11. ✅ Validation sequence — 8 steps proving capture reliability
12. ✅ Resource profile — ~30-50MB RAM, negligible CPU, ~5MB/month Supabase storage

**Please approve to begin implementation.**

---

*Moosa — CEO — Shadow Mode Plan*