# SIDECAR SHADOW — MALFORMED LINE + INFINITE RETRY FIX PLAN

**Date:** 2026-05-15
**Trigger:** TEST-A failure — malformed line at position 195627 processed repeatedly, cursor not advancing, zero capture
**Status:** Plan — Ahmad approval required before implementation

---

## PROBLEM DIAGNOSIS

### Symptoms Observed

1. `[shadow] Malformed line skipped: Unterminated string in JSON at position 195627` — same position, logged hundreds of times
2. `cursor.eofPosition` stuck at 0 (never advanced from initial reset)
3. No instruction rows inserted
4. Sidecar appeared online but capture completely failed

### Root Cause Chain

The session file at time of cursor reset was 3,396 bytes (small). The cursor was reset to 0, pointing at the START of a 4.8MB session file. The file had been appended to over time.

When the sidecar started reading from position 0:

1. **Poll 1:** Read first 1MB of a 4.8MB file. Last 200KB of buffer was MID-LINE (mid-assistant-response). parseLine returned null. `lastLineEndOffset += lineBytes` — cursor advanced by entire 1MB. File still 4.8MB. **Cursor now at 1MB, file at 4.8MB.**

2. **Poll 2:** Read from 1MB to 2MB. New data — complete lines only. All processed, lastLineEndOffset = 1MB. Cursor saved at 2MB.

3. **Polls 3-4:** Same pattern, cursor advances to 3MB, 4MB.

4. **Poll 5 (THE FAILURE):** Read from 4MB to 4.8MB (last 800KB). Last 200KB of buffer is MID-LINE again. parseLine returns null. lastLineEndOffset advances by 800KB = cursor.eofPosition now at 4.8MB. `if (currentEof <= cursor.eofPosition)` → **SKIP**. File hasn't grown, cursor at EOF. Returns.

5. **Poll 6:** File still 4.8MB, cursor.eofPosition = 4.8MB, `currentEof <= cursor.eofPosition` → **SKIP**. No data read. The incomplete line at byte 4.6MB was never completed, never processed, cursor stuck at 4.8MB forever.

**Result:** The incomplete line at position ~4.6MB (not 195627 — that was a different session era) caused cursor to reach EOF while still mid-line. Every subsequent poll skips entirely because cursor is at EOF and file isn't growing fast enough to give us more data. **Infinite retry loop on the same incomplete line position, silently.**

The log showing position 195627 repeatedly suggests the malformed data was at a specific position in the version of the file being read when cursor was at 0.

---

## FIX 1: Mid-Line EOF Detection + Safe Cursor Advancement

### The Core Problem

When `cursor.eofPosition` reaches the actual file EOF (`currentEof`), and the last line in the buffer was incomplete (parseLine returned null), the cursor gets stuck at EOF with no way to advance. The file must grow by at least 1 byte AND the incomplete line must complete before we can advance past it.

### Fix: If cursor reaches EOF with incomplete last line, advance past it

```javascript
// After processing all complete lines, check if we're at EOF with an incomplete tail
if (currentEof > cursor.eofPosition + lastLineEndOffset) {
  // There's unprocessed data at the end of our buffer — should not happen if we read to currentEof
  // This means the last "line" in our buffer was incomplete (no newline)
}

if (currentEof <= cursor.eofPosition + lastLineEndOffset) {
  // We read to actual EOF. If last line was malformed/incomplete:
  // advance cursor to true EOF so next poll doesn't re-read same data
  const trueEof = currentEof; // file has not grown since we read
  // Advance past the incomplete line so we don't retry the same garbage
  cursor.eofPosition = trueEof;
  saveCursor(cursor);
  return; // No new data to process
}
```

**But this still doesn't solve the problem** — if we advance past the incomplete line, we skip the data that comes AFTER it in the next poll (when file grows). The complete lines after the incomplete one would be missed.

**Correct fix:** Track that we're mid-file and on the NEXT poll, after file grows, start from AFTER the incomplete area, not from where we left off.

### Better Fix: Gap-Based Cursor

Store cursor as `lastCompleteBytePosition` — the byte offset AFTER the last complete newline we successfully parsed.

When we hit an incomplete line:
1. Do NOT advance cursor past it
2. Do NOT save cursor
3. Instead, note: we stopped at byte X due to incomplete line
4. On next poll, read from X to new currentEOF
5. If we still can't parse past X, the line is still incomplete — keep waiting

But this means we keep re-reading the same incomplete line every poll. The solution is: **when we're at a position that parse fails on, SKIP to the next newline boundary, advance cursor there, and continue processing the rest.** Malformed data gets quarantined but we don't get stuck.

```javascript
// After processing lines, if we have unprocessed bytes at end:
const bufferEnd = cursor.eofPosition + bytesRead; // where we stopped
if (bufferEnd < currentEof) {
  // There was more data after our buffer — shouldn't happen with 1MB buffer
}
if (bufferEnd == currentEof && lines.length > 0) {
  // We read to actual EOF. If last line was malformed:
  // skip past it to avoid infinite retry
  // Find the next newline after the malformed start
  // Advance cursor to that position
}
```

**The pragmatic fix:** When we detect we're at EOF and the last line was malformed (parseLine null), advance cursor by the entire remaining buffer size on that poll. This sacrifices one poll's worth of potential capture (the malformed line + maybe 1 complete line after it) but breaks the infinite retry loop. It's a controlled sacrifice for recovery.

---

## FIX 2: Incomplete Line Wait + Retry Protocol

### Problem

The sidecar reads once per poll interval. If the gateway is still writing the incomplete line, the sidecar reads partial data, fails to parse, and gets stuck.

### Fix: When incomplete line detected at EOF, retry with short interval

```javascript
// If we're at EOF (currentEof == cursor.eofPosition + bytesRead)
// AND parseLine failed on the last line:
// Immediately re-read (up to 3 retries with 500ms delay)
for (let retry = 0; retry < 3; retry++) {
  const newEof = fs.statSync(activeSession.path).size;
  if (newEof > cursor.eofPosition + lastLineEndOffset) {
    // New data arrived — we can now read past the incomplete line
    // Continue processing from where we left off
    break;
  }
  sleep(500); // Wait 500ms for gateway to finish writing
}
// If all retries failed, advance cursor to end and continue
```

**This only helps if the gateway finishes writing within 1.5 seconds (3 × 500ms).** For large responses, this won't help. But it breaks the infinite retry loop for typical messages.

---

## FIX 3: Line Boundary Validation Before Advancing

### Problem

`lastLineEndOffset` counts bytes including potentially incomplete data. We need to know whether the last "line" was actually complete.

### Fix: Track completion status

```javascript
let lastLineWasComplete = true;
let incompleteLineStart = -1;

for (const line of lines) {
  const entry = parseLine(line);
  if (!entry) {
    // Malformed line
    lastLineWasComplete = false;
    incompleteLineStart = ...; // track offset
    lastLineEndOffset += Buffer.byteLength(line, 'utf8') + 1;
    continue;
  }
  // ... normal processing
  lastLineWasComplete = true; // reset on success
}

// After loop: if !lastLineWasComplete, the final "line" was truncated
if (!lastLineWasComplete && processed > 0) {
  // We processed some complete lines, then hit an incomplete one at the end
  // Save cursor AFTER the incomplete line (its start + length)
  // So next poll starts AFTER the truncated line
  cursor.eofPosition += incompleteLineStart + lineLengthOfIncomplete;
  saveCursor(cursor);
  return; // Done for this poll
}
```

---

## FIX 4: Quarantine Log for Malformed Lines

### Problem

When malformed lines are skipped, there's no persistent record of:
- The byte offset in the file
- The raw content (truncated)
- The reason for quarantine

### Fix: Write quarantine entries to `/ops/sidecar-quarantine.jsonl`

```javascript
function quarantineMalformedLine(rawContent, byteOffset, reason) {
  const entry = {
    quarantined_at: new Date().toISOString(),
    byte_offset: byteOffset,
    reason: reason,           // 'incomplete_json', 'missing_sender_id', 'missing_message_id'
    raw_preview: rawContent.slice(0, 200), // first 200 chars, not full content
    session_id: activeSession.id,
  };
  const temp = '/ops/sidecar-quarantine.jsonl';
  fs.appendFileSync(temp, JSON.stringify(entry) + '\n');
  console.log(`[shadow] QUARANTINED line at offset ${byteOffset}: ${reason}`);
}
```

This gives:
- Evidence that malformed lines occurred
- Byte offsets for debugging
- Proof we didn't silently drop them — we logged them
- Ability to replay/reprocess after the fact

---

## FIX 5: Explicit Capture Failure Alert

### Problem

When capture fails, the only indication is `captureCount: 0` in stats. No explicit alert. For shadow mode validation, we need to know IMMEDIATELY when a poll results in zero captures for a known-good message.

### Fix: When a user message SHOULD have been captured (based on senders in session) but wasn't, log explicit failure:

```javascript
// In poll(), after processing:
if (pollCount > 0 && captureCount === lastCaptureCount && errorCount === 0) {
  // No captures this poll, but we had messages — something is wrong
  // This should not happen for shadow mode with our text extraction fix
  // Log explicit warning
  console.log('[shadow] ⚠️ CAPTURE GAP: poll produced no captures despite activity');
}
```

This doesn't prevent silent drops, but it makes them visible in logs.

---

## ROLLBACK PLAN

If any fix causes issues:

```bash
# Option 1: Stop sidecar, restore previous version, restart
pm2 stop instruction-sidecar-shadow
git checkout HEAD~1 -- ops/instruction-sidecar-shadow.js
pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js

# Option 2: Full rollback — remove sidecar entirely
pm2 delete instruction-sidecar-shadow
# Sidecar removed, no production impact
# instruction-sidecar-shadow.js remains at /ops/ for future use
```

**Blast radius of fixes:** All fixes are in-memory logic changes to the sidecar polling loop. No schema changes, no file format changes, no PM2 topology changes.

---

## IMPLEMENTATION SEQUENCE

### Step 1: Fix 4 (Quarantine) + Fix 5 (Explicit Alert) — Low Risk
- Add quarantine.jsonl writes
- Add capture gap logging
- These don't change behavior, only add visibility

### Step 2: Fix 3 (Line Completion Tracking) — Medium Risk
- Track `lastLineWasComplete`
- Only advance cursor past lines we actually completed
- Changes cursor save logic

### Step 3: Fix 1 (EOF Incomplete Line Handling) — Medium Risk  
- When at actual EOF with incomplete last line: advance cursor to true EOF, continue
- Next poll: file grew → read new data starting AFTER where we left off
- This sacrifices potential capture of 1 line but breaks infinite retry

### Step 4: Fix 2 (Retry Protocol) — Optional Enhancement
- 3 quick retries with 500ms delay when at EOF with incomplete line
- Only helps if gateway finishes within 1.5s
- Can be skipped if Fix 1+3 is sufficient

---

## VALIDATION SEQUENCE (After Fixes)

### Pre-Validation: Artificially Trigger Malformed Line
```bash
# Inject a malformed line into the session
echo 'THIS IS NOT JSON {"broken":' >> /root/.openclaw/agents/main/sessions/77dee770-dbfd-429f-90de-2dac19933a8d.jsonl
# Wait 15 seconds
# Verify quarantine.jsonl has an entry
cat /ops/sidecar-quarantine.jsonl | python3 -m json.tool
# Verify sidecar is still running (didn't crash)
pm2 list | grep instruction-sidecar
# Verify no capture gap alert in logs
pm2 logs instruction-sidecar-shadow --lines 20 --nostream 2>&1 | grep -i "quarantine\|gap\|alert"
```

### Test A (Retry): Fresh Normal Message
- Send `[TEST-A-RETRY]` via WhatsApp
- Wait 10 seconds
- Verify: 1 new instruction row, quarantine log has 1 entry for the injected line
- Verify: No infinite retry of same malformed line (quarantine only logged once)

### Test B: PM2 Restart Continuity
```bash
pm2 restart instruction-sidecar-shadow
# Wait 10s
# Verify sidecar back online
# Send [TEST-B-RETRY]
# Verify new instruction row created, quarantine still has same 1 entry (not duplicated)
```

### Test C: Cursor Advance Verification
```bash
# After capturing TEST-A-RETRY, check cursor advanced past the malformed line
cat /ops/sidecar-cursor.json
# Verify eofPosition is well past the injected malformed line's byte offset
```

---

## BLAST RADIUS ASSESSMENT

| Component | Impact | Notes |
|-----------|--------|-------|
| `/ops/instruction-sidecar-shadow.js` | Modified — polling logic changes | No other files affected |
| `/ops/sidecar-quarantine.jsonl` | New file — quarantine log | Append-only, no deletion |
| PM2 process `instruction-sidecar-shadow` | Restart required | Online during restart, gap in polling |
| Supabase `instructions` table | No schema change | Only INSERT, no schema modification |
| Gateway, worker, other PM2 processes | None | Completely isolated |
| Session JSONL files | Read-only access | No modification |

**Blast radius: MINIMAL** — isolated to sidecar process only.

---

## OPEN QUESTIONS

1. **Should quarantine log entries be replayed?** After fixing the extraction issue, should we reprocess quarantined lines? (Requires re-extraction logic for quarantined raw content.)

2. **How long should we wait at EOF with incomplete line?** 1.5s (3 retries × 500ms) seems reasonable for typical messages. For very large assistant responses, we accept the sacrifice of that line.

3. **Should we increase MAX_LINES_PER_POLL from 1000?** If the session grows by more than 1MB between polls, we'd process 1000 lines and defer the rest. Not changing this for now.

4. **Should we alert on capture gap?** The console warning is free. A WhatsApp alert would require sending a message, which is outside shadow mode scope.

---

*Plan ready for Ahmad's go/no-go. No implementation yet.*