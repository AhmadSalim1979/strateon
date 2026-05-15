# Sidecar Architecture Investigation
## Deterministic Instruction Capture — Phase 2 Sidecar Feasibility

**Date:** 2026-05-15
**Status:** Investigation Complete — Architecture Proposed
**Author:** Moosa (CEO)

---

## EXACT FILES/LOGS INSPECTED

| File/Directory | Purpose | Relevant for Capture? |
|---------------|---------|----------------------|
| `/root/.openclaw/openclaw.json` | OpenClaw Gateway configuration | No — config only |
| `/root/.openclaw/logs/config-audit.jsonl` | Config audit events only | No — not message content |
| `/root/.openclaw/logs/config-health.json` | Config health status | No |
| `/root/.openclaw/cron/runs/*.jsonl` | Cron run logs | No — not message content |
| `/root/.openclaw/media/inbound/` | Inbound media files (images, PDFs) | Partial — attachments only, not text |
| `/root/.openclaw/agents/main/sessions/*.jsonl` | **Active chat session logs** | **YES — contains all inbound messages** |
| `/root/.openclaw/agents/main/sessions/*.lock` | Active writer lock file | Yes — indicates active session |
| `/root/.openclaw/workspace/state/heartbeats/` | Worker heartbeat files | No — operational, not message content |
| `/home/node/.openclaw/workspace/state/` | Workspace state files | No |

---

## WHAT I FOUND

### 1. Session JSONL — Primary Message Store

**Location:** `/root/.openclaw/agents/main/sessions/`

**Format:** JSONL — one JSON object per line, one line per event

**Sample user message entry (parsed from most recent session `77dee770-dbfd-429f-90de-2dac19933a8d.jsonl`):**

```json
{
  "type": "message",
  "id": "dee84dbc",
  "parentId": "0e34f37f",
  "timestamp": "2026-05-15T06:40:15.743Z",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Conversation info (untrusted metadata):\n```json\n{\n  \"message_id\": \"3EB02E4B7A0A4B8F4CF78E\",\n  \"sender_id\": \"+923215139934\",\n  \"sender\": \"Ahmad Salim\"\n}\n```\n\nSender (untrusted metadata):\n...\n\nMoosa,\n\nPhase 2 is..."
      }
    ],
    "details": {}
  }
}
```

**Fields available per message:**
| Field | Value | Captureable? |
|-------|-------|-------------|
| `id` | Internal message ID (dee84dbc) | Yes |
| `timestamp` | ISO 8601 (2026-05-15T06:40:15.743Z) | Yes |
| `message.role` | "user" for inbound | Yes |
| `message.content[].text` | Full message text including metadata header | Yes |
| `message_id` (in text) | WhatsApp message ID (3EB02E4B7A0A4B8F4CF78E) | Yes — parse from text |
| `sender_id` (in text) | Phone number (+923215139934) | Yes — parse from text |
| `sender` (in text) | Name (Ahmad Salim) | Yes — parse from text |
| `parentId` | Thread parent message ID | Yes |

### 2. Active Session Detection

```
File: 77dee770-dbfd-429f-90de-2dac19933a8d.jsonl
Size: 2,302,141 bytes
Lines: 393
Modified: 2026-05-15 08:48:01 (active — this session)
Lock: exists (pid 889449, created 2026-05-15T06:44:53.216Z)
```

**The lock file indicates the gateway process is actively writing to this file.** The file is actively growing — new messages append new lines.

### 3. No Dedicated Message Storage

There is no separate WhatsApp message database, inbox, or message queue. Messages arrive via OpenClaw Gateway and are written directly to the session JSONL as chat history. The session JSONL IS the message store.

---

## SIDE CAR ARCHITECTURE — PROPOSED

### Concept: Session JSONL Polling Sidecar

A lightweight Node.js process that:

1. **Polls the active session JSONL file** every 5 seconds
2. **Reads only new lines** (tracks EOF position in a cursor file)
3. **Identifies user messages** (role = "user")
4. **Extracts** sender_id, message_id, timestamp, text from the metadata header in the text content
5. **Calls `bridgeInstruction()`** to create durable instruction row
6. **Sends acknowledgement** via OpenClaw's sendWhatsApp handler

### File: `/ops/instruction-sidecar.js`

```javascript
// Pseudocode — actual file to be written after approval

const FS = require('fs');
const PATH = require('path');

// State
let cursorFile = '/ops/sidecar-cursor.json';  // { sessionId, eofPosition, lastMessageId }
let cursor = { sessionId: null, eofPosition: 0, lastMessageId: null };

// Poll interval: 5 seconds
const POLL_INTERVAL_MS = 5000;

async function poll() {
  // 1. Find active session (most recent .jsonl with .lock file)
  const activeSession = findActiveSession();
  if (!activeSession) return;
  
  // 2. Read new lines from EOF position
  const newLines = readNewLines(activeSession, cursor.eofPosition);
  if (newLines.length === 0) return;
  
  // 3. For each new user message
  for (const line of newLines) {
    const entry = JSON.parse(line);
    if (entry.type !== 'message' || entry.message?.role !== 'user') continue;
    
    // 4. Extract metadata from text content
    const parsed = parseMetadata(entry);
    if (!parsed.message_id || !parsed.sender_id) continue;
    
    // 5. Duplicate detection — check lastMessageId
    if (parsed.message_id === cursor.lastMessageId) {
      console.log('[sidecar] Duplicate message_id:', parsed.message_id);
      continue;
    }
    
    // 6. Call bridgeInstruction
    const { bridgeInstruction } = require('./instruction-bridge.js');
    const result = await bridgeInstruction(
      parsed.text,
      'whatsapp',
      parsed.sender_id
    );
    
    // 7. Update cursor
    cursor.lastMessageId = parsed.message_id;
    cursor.eofPosition = activeSession.eofPosition;
    cursor.sessionId = activeSession.id;
    saveCursor(cursor);
    
    // 8. Emit acknowledgement (see risk #3)
    if (result.success) {
      await emitAcknowledgement(parsed.sender_id, result.instruction_id);
    }
  }
}

function parseMetadata(entry) {
  // Parse from message.content[0].text
  // Text format: "Conversation info (untrusted metadata):\n```json\n{\"message_id\": \"...\", \"sender_id\": \"...\"}```\n..."
  const text = entry.message?.content?.[0]?.text || '';
  const msgIdMatch = text.match(/"message_id":\s*"([^"]+)"/);
  const senderIdMatch = text.match(/"sender_id":\s*"([^"]+)"/);
  const senderMatch = text.match(/"sender":\s*"([^"]+)"/);
  
  return {
    message_id: msgIdMatch?.[1] || null,
    sender_id: senderIdMatch?.[1] || null,
    sender: senderMatch?.[1] || null,
    text: extractBodyText(text),  // strip metadata header
    timestamp: entry.timestamp
  };
}
```

### Cursor File Format

```json
{
  "sessionId": "77dee770-dbfd-429f-90de-2dac19933a8d",
  "eofPosition": 2302141,
  "lastMessageId": "3EB02E4B7A0A4B8F4CF78E",
  "updatedAt": "2026-05-15T08:48:00Z"
}
```

### Duplicate Detection Strategy

1. **Primary:** `message_id` from WhatsApp metadata — guaranteed unique per message
2. **Secondary:** If `message_id` unavailable, use `sender_id + timestamp + text_hash`
3. **Cursor file** maintains `lastMessageId` — if next message_id equals lastMessageId, skip

### Acknowledgement Emission — Risk #3

The sidecar cannot directly send WhatsApp acknowledgements via the same mechanism as the main session (OpenClaw Gateway internal). 

**Proposed approach:**
- The `sendWhatsApp` handler from the moosa-worker is a Node.js module that calls OpenClaw CLI
- The sidecar can import and call `sendWhatsApp()` directly
- Risk: this may not work outside the moosa-worker's authenticated context

**Alternative:** The sidecar writes to a `pending_acks` table in Supabase, and the main session (or a separate acknowledgement emitter) processes it. But this adds complexity.

**Most reliable:** The sidecar imports the OpenClaw CLI send functionality and calls it directly. This needs validation.

---

## RISKS

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | JSONL is actively written — partial line read on poll | Medium | Read line-by-line, only commit cursor after complete JSON parse. On parse failure, retry next poll. |
| 2 | Active session switches (new .jsonl file created) | Low | Detect via .lock file disappearance. On new session detected, reset cursor to 0. |
| 3 | Cannot send WhatsApp acknowledgement from sidecar context | **High** | Import and call sendWhatsApp from moosa-worker. If fails, write to `pending_acks` Supabase table for main session to process. |
| 4 | message_id parsing from text is fragile | Medium | Regex parse of JSON metadata block. Validate format: "3EB..." pattern. If parse fails, fall back to text hashing. |
| 5 | Sidecar crashes/stops — no automatic restart | Medium | PM2 managed process with auto-restart. Log all failures to Supabase. |
| 6 | Gateway writes large batch — cursor falls behind | Low | On each poll, read until EOF (no artificial limit). Accept that during heavy traffic the acknowledgement may be delayed. |
| 7 | Lock file conflicts with gateway writer | Low | Read-only on JSONL. Only write to cursor.json (separate file). Never write to .jsonl or .lock. |

---

## ROLLBACK PLAN

**If sidecar causes issues:**

```bash
# Stop sidecar PM2 process
pm2 stop instruction-sidecar

# Remove from PM2
pm2 delete instruction-sidecar

# Remove sidecar files
rm /ops/instruction-sidecar.js

# Cursor file can remain or be deleted
rm /ops/sidecar-cursor.json
```

**Existing instruction rows in Supabase remain** — no data loss.

**Effect on message capture:** If sidecar stops, no new instruction rows created until sidecar restarts or alternative implemented.

---

## VALIDATION PLAN

### Before Deployment

1. Verify active session file has `.lock` present
2. Verify cursor.json starts empty
3. Verify `instruction-bridge.js` module is present and functional

### After Deployment

1. **Send test message via WhatsApp:**
   ```
   Phase 2 sidecar validation test — please ignore
   ```

2. **Within 10 seconds, verify:**
   - `instructions` table has new row (sidecar picked it up)
   - `original_message` matches exactly
   - `source_channel = 'whatsapp'`
   - `state_transitions` has at least 1 entry
   - `cursor.json` updated with new `eofPosition` and `lastMessageId`

3. **Send second test (different text):**
   - Verify new row created (not duplicate — different message_id)
   - Verify `lastMessageId` in cursor updated

4. **Send third test (same text as first):**
   - Verify row NOT created (duplicate message_id detected)
   - `lastMessageId` unchanged

5. **Restart sidecar:**
   ```bash
   pm2 restart instruction-sidecar
   ```
   - Verify cursor is read correctly
   - Verify no duplicate rows created
   - Verify no messages missed during restart

6. **Verify worker still functioning:**
   ```bash
   pm2 logs moosa-worker --lines 10 --nostream
   ```
   Worker running, tasks being processed normally.

---

## FINAL CLASSIFICATION

### **[FEASIBLE]**

The session JSONL contains all required information for deterministic instruction capture:
- sender_id ✅
- message_id ✅  
- timestamp ✅
- message text ✅
- channel (whatsapp) ✅

A read-only sidecar can poll the active session JSONL, parse new user messages, and call `bridgeInstruction()` to create durable instruction rows.

**Key condition:** Acknowledgement emission (item 5 in requirements) is technically possible but carries risk #3 — the sendWhatsApp mechanism is designed for the moosa-worker's context, not an independent sidecar. This needs validation testing before declaring fully functional.

**Immediate next step:** Write and deploy sidecar in test mode, validate WhatsApp acknowledgement emission.

---

## ALTERNATIVE CONSIDERED BUT REJECTED

**Option: Polling OpenClaw Gateway API**  
The Gateway runs on port 18789. Could the sidecar poll the gateway for new messages?

```
file: /root/.openclaw/openclaw.json
finding: gateway.auth.token = "37dcfaf0997133014f59a5c164b1fb5463fe1ad664b5775ffa30495ae67a1e29"

Risk: The gateway API is internal to OpenClaw — message history endpoint not documented or confirmed as external API.
Instead: Session JSONL is a known, accessible file. Proven to contain complete message history.
Decision: Use session JSONL polling. More reliable than undocumented API.
```

---

## OPEN QUESTION

**Whether sidecar can emit WhatsApp acknowledgements** — needs live test to confirm.

The sidecar can write to the `instructions` table (proven in Phase 1). The question is whether it can call `sendWhatsApp()` successfully outside the moosa-worker's authenticated context.

**If sendWhatsApp fails from sidecar:**
- Write acknowledgement to `pending_acks` Supabase table
- Main session (me) processes pending acks on next heartbeat
- Or: Ahmad approves a simpler approach — I emit acknowledgements directly, sidecar only handles instruction capture

---

*Moosa — CEO — Sidecar Architecture Investigation Complete*