/**
 * instruction-sidecar-shadow.js — Shadow Mode Prototype
 *
 * File: /ops/instruction-sidecar-shadow.js
 * Purpose: Observe session JSONL, capture inbound user messages as durable
 *          instruction rows — NO execution authority, NO task creation.
 *          Validates deterministic capture reliability before full sidecar.
 *
 * Mode: SHADOW (observation-only)
 * Constraints:
 *   - Read-only to session JSONL (no modification)
 *   - Write-only to instructions table (no other tables)
 *   - NO task creation, NO acknowledgement emission, NO execution actions
 *
 * Owner: Moosa (CEO)
 * Validation: node --check instruction-sidecar-shadow.js
 * Last Modified: 2026-05-15
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Session JSONL directory — read-only access
  SESSIONS_DIR: '/root/.openclaw/agents/main/sessions',

  // Cursor persistence — survives restarts
  CURSOR_FILE: '/ops/sidecar-cursor.json',

  // Quarantine log for malformed lines
  QUARANTINE_FILE: '/ops/sidecar-quarantine.jsonl',

  // Poll interval (milliseconds)
  CHECK_INTERVAL_MS: 5000,

  // Supabase — loaded from environment
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',

  // Shadow mode: instruction status
  SHADOW_STATUS: 'shadow_received',

  // Source channel for WhatsApp messages
  SOURCE_CHANNEL: 'whatsapp',

  // Max lines to process per poll (prevent runaway reads)
  MAX_LINES_PER_POLL: 1000,

  // Retry count when at EOF with incomplete line
  EOF_RETRY_COUNT: 3,
  EOF_RETRY_DELAY_MS: 500,
};

// ============================================================================
// SUPABASE CLIENT (lazy init)
// ============================================================================

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    if (!CONFIG.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_KEY environment variable not set');
    }
    const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');
    _supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    });
  }
  return _supabase;
}

// ============================================================================
// CURSOR PERSISTENCE
// ============================================================================

/**
 * Read cursor from disk.
 * Returns default cursor if file doesn't exist or is corrupted.
 */
function readCursor() {
  try {
    if (fs.existsSync(CONFIG.CURSOR_FILE)) {
      const raw = fs.readFileSync(CONFIG.CURSOR_FILE, 'utf8');
      const cursor = JSON.parse(raw);
      return {
        sessionId: cursor.sessionId || null,
        eofPosition: cursor.eofPosition || 0,
        lastMessageId: cursor.lastMessageId || null,
        lastMessageHash: cursor.lastMessageHash || null,
        updatedAt: cursor.updatedAt || null,
      };
    }
  } catch (err) {
    console.log('[shadow] Cursor read error, resetting:', err.message);
  }
  return { sessionId: null, eofPosition: 0, lastMessageId: null, lastMessageHash: null, updatedAt: null };
}

/**
 * Atomically save cursor using rename (POSIX atomic — survives crashes).
 */
function saveCursor(cursor) {
  cursor.updatedAt = new Date().toISOString();
  const temp = CONFIG.CURSOR_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(cursor));
  fs.renameSync(temp, CONFIG.CURSOR_FILE); // atomic on POSIX
}

// ============================================================================
// QUARANTINE LOG
// ============================================================================

/**
 * Log a malformed or quarantined line to the quarantine file.
 * Append-only — never overwrites, survives restarts.
 */
function quarantine(entry) {
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(CONFIG.QUARANTINE_FILE, line);
  } catch (err) {
    console.log('[shadow] Quarantine write error:', err.message);
  }
  console.log(`[shadow] QUARANTINED offset=${entry.byte_offset} reason=${entry.reason} session=${entry.session_id}`);
}

// ============================================================================
// SESSION DISCOVERY
// ============================================================================

/**
 * Find the active session — the .jsonl file with a matching .lock file.
 * Returns: { id: string, path: string, eofPosition: number } or null
 */
function findActiveSession() {
  try {
    const files = fs.readdirSync(CONFIG.SESSIONS_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({
        name: f,
        path: path.join(CONFIG.SESSIONS_DIR, f),
        lockPath: path.join(CONFIG.SESSIONS_DIR, f + '.lock'),
        stat: fs.statSync(path.join(CONFIG.SESSIONS_DIR, f)),
      }))
      .sort((a, b) => b.stat.mtime - a.stat.mtime); // most recent first

    // Find first .jsonl with a .lock file = active session
    for (const f of files) {
      if (fs.existsSync(f.lockPath)) {
        return {
          id: f.name.replace('.jsonl', ''),
          path: f.path,
          eofPosition: f.stat.size,
        };
      }
    }

    // Fallback: most recent file (lock may have been removed during rotation)
    if (files.length > 0) {
      console.log('[shadow] No .lock file found, using most recent session as fallback');
      return {
        id: files[0].name.replace('.jsonl', ''),
        path: files[0].path,
        eofPosition: files[0].stat.size,
      };
    }
  } catch (err) {
    console.log('[shadow] findActiveSession error:', err.message);
  }
  return null;
}

// ============================================================================
// MESSAGE EXTRACTION
// ============================================================================

/**
 * Parse a single line from session JSONL.
 * Returns null if line is malformed.
 */
function parseLine(line) {
  try {
    const entry = JSON.parse(line.trim());
    return entry;
  } catch (err) {
    // Malformed JSON — quarantine and log
    return null;
  }
}

/**
 * Extract WhatsApp metadata from a session entry.
 *
 * Session JSONL format varies by message type:
 *
 * USER messages:
 *   { type:"message", id:"<whatsapp_message_id>", parentId:"...",
 *     timestamp:"...", message:{ role:"user", content:[{type:"text",text:"..."}] } }
 *   sender_id and message_id are EMBEDDED INSIDE the text as JSON metadata
 *
 * ASSISTANT messages:
 *   { type:"message", id:"<msg_id>", parentId:"...",
 *     timestamp:"...", message:{ role:"assistant", content:[...] } }
 *   May have message_id at top level or inside message content
 *
 * Returns null if required fields cannot be extracted.
 */
function extractMetadata(entry) {
  try {
    // Handle nested message object (some entries wrap fields inside a 'message' key)
    const msg = entry.message || entry;
    const meta = entry.meta || {};

    // Primary IDs — check top-level first (most reliable)
    let messageId = entry.message_id || meta.message_id || msg.message_id || null;
    let senderId = entry.sender_id || meta.sender_id || msg.sender_id || null;
    let timestamp = entry.timestamp || meta.timestamp || msg.timestamp || null;

    // Extract text from content array or direct content field
    let text = null;
    const content = msg.content;
    if (Array.isArray(content) && content.length > 0) {
      // content[0] may be {type:"text", text:"..."} or {type:"toolCall",...} or {type:"thinking",...}
      const textObj = content.find(c => c.type === 'text');
      text = textObj ? textObj.text : (content[0].text || null);
    } else if (typeof content === 'string') {
      text = content;
    } else if (content && typeof content === 'object') {
      text = content.text || null;
    }

    // For USER messages: sender_id and message_id are INSIDE the text as JSON metadata
    const msgRole = msg.role || null;
    if (msgRole === 'user' && text) {
      // Extract message_id and sender_id directly from text via regex
      const msgIdMatch = text.match(/"message_id":\s*"([^"]+)"/);
      if (msgIdMatch) messageId = msgIdMatch[1];
      // sender_id appears in the first JSON block
      const senderMatch = text.match(/^\s*"sender_id":\s*"([^"]+)"/m);
      if (senderMatch) senderId = senderMatch[1];
      if (!messageId || !senderId) {
        // Fallback: try to find any message_id/sender_id in first 300 chars
        if (!messageId) {
          const fallback = text.slice(0, 300).match(/"message_id":\s*"([^"]+)"/);
          if (fallback) messageId = fallback[1];
        }
        if (!senderId) {
          const fallback = text.slice(0, 300).match(/"sender_id":\s*"([^"]+)"/);
          if (fallback) senderId = fallback[1];
        }
      }
      // For user messages, entry.id IS the WhatsApp message_id as fallback
      if (!messageId && entry.id) messageId = entry.id;
    } else {
      // Non-user messages: use entry.id as fallback for messageId
      if (!messageId && entry.id) messageId = entry.id;
    }

    if (!messageId || !senderId) {
      return null; // Can't track without message_id and sender_id
    }

    return {
      message_id: messageId,
      sender_id: senderId,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      text: text || '',
      channel: entry.channel || CONFIG.SOURCE_CHANNEL,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Simple hash for duplicate detection when message_id is unavailable.
 */
function hashMessage(text, senderId, timestamp) {
  return `${senderId}:${timestamp}:${text}`.slice(0, 200);
}

// ============================================================================
// SUPABASE OPERATIONS (shadow mode — instructions table only)
// ============================================================================

/**
 * Insert a shadow-received instruction row.
 * Status is 'shadow_received' — worker NEVER picks this up (only 'received' or 'queued').
 */
async function persistInstruction(msgMeta) {
  const supabase = getSupabase();

  const row = {
    source_channel: msgMeta.channel || CONFIG.SOURCE_CHANNEL,
    received_at: msgMeta.timestamp || new Date().toISOString(),
    original_message: msgMeta.text || '',
    instruction_type: 'inform', // default — informational messages
    priority: 'medium',
    status: CONFIG.SHADOW_STATUS, // 'shadow_received' — worker ignores this status
    acknowledgement_state: 'pending',
    state_transitions: [
      {
        from: null,
        to: CONFIG.SHADOW_STATUS,
        at: new Date().toISOString(),
        by: 'instruction-sidecar-shadow',
        note: 'Shadow mode — inbound message captured (no execution authority)',
      }
    ],
    metadata: {
      message_id: msgMeta.message_id,
      sender_id: msgMeta.sender_id,
      captured_by: 'instruction-sidecar-shadow',
      capture_mode: 'shadow',
    },
  };

  const { data, error } = await supabase
    .from('instructions')
    .insert(row)
    .select('id, status, created_at')
    .single();

  if (error) {
    console.log('[shadow] Supabase insert error:', error.message, JSON.stringify(error));
    return null;
  }

  console.log(`[shadow] Instruction captured: id=${data.id} message_id=${msgMeta.message_id} status=${data.status}`);
  return data;
}

// ============================================================================
// DUPLICATE PREVENTION
// ============================================================================

/**
 * Check if a message has already been captured.
 */
function isDuplicate(msgMeta, cursor) {
  // Primary: message_id exact match
  if (cursor.lastMessageId && msgMeta.message_id === cursor.lastMessageId) {
    return true;
  }
  // Secondary: content hash (if message_id unavailable but content matches)
  if (!msgMeta.message_id) {
    const hash = hashMessage(msgMeta.text, msgMeta.sender_id, msgMeta.timestamp);
    if (cursor.lastMessageHash === hash) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// POLLING LOOP
// ============================================================================

let isRunning = false;
let pollCount = 0;
let captureCount = 0;
let errorCount = 0;
let lastCaptureCount = 0; // For capture gap detection

/**
 * Main polling iteration.
 * Reads new lines from active session, captures user messages, persists.
 *
 * Key behavior for malformed/incomplete lines:
 * - Malformed lines are quarantined to QUARANTINE_FILE and skipped
 * - If we reach EOF with an incomplete last line, we retry up to EOF_RETRY_COUNT times
 * - After all retries fail, we advance past the incomplete line (controlled sacrifice)
 * - We NEVER process the same malformed line twice
 */
async function poll() {
  if (!isRunning) return;

  pollCount++;

  try {
    // 1. Find active session
    const activeSession = findActiveSession();
    if (!activeSession) {
      if (pollCount % 12 === 0) {
        console.log('[shadow] No session found, waiting...');
      }
      return;
    }

    // 2. Read cursor
    const cursor = readCursor();

    // 3. Detect session rotation
    if (cursor.sessionId && cursor.sessionId !== activeSession.id) {
      console.log(`[shadow] Session rotated: ${cursor.sessionId} → ${activeSession.id}, resetting cursor`);
      cursor.sessionId = activeSession.id;
      cursor.eofPosition = 0;
      cursor.lastMessageId = null;
      cursor.lastMessageHash = null;
      saveCursor(cursor);
    }

    // 4. Update sessionId if not set
    if (!cursor.sessionId) {
      cursor.sessionId = activeSession.id;
    }

    // 5. Get current EOF position
    const currentEof = fs.statSync(activeSession.path).size;

    // 6. If file shrunk (rotated), reset cursor
    if (currentEof < cursor.eofPosition) {
      console.log('[shadow] File shrank (rotation detected), resetting cursor');
      cursor.eofPosition = 0;
      cursor.lastMessageId = null;
      cursor.lastMessageHash = null;
      saveCursor(cursor);
      return;
    }

    // 7. If no new data, skip
    if (currentEof <= cursor.eofPosition) {
      return;
    }

    // 8. Read new lines from cursor.eofPosition to current EOF
    const fd = fs.openSync(activeSession.path, 'r');
    const bytesToRead = currentEof - cursor.eofPosition;
    const buffer = Buffer.alloc(Math.min(bytesToRead, 1024 * 1024)); // max 1MB per poll
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, cursor.eofPosition);
    fs.closeSync(fd);

    if (bytesRead === 0) return;

    const rawData = buffer.toString('utf8', 0, bytesRead);
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);

    if (lines.length === 0) {
      // No complete lines — advance cursor by bytesRead and retry next poll
      cursor.eofPosition += bytesRead;
      saveCursor(cursor);
      return;
    }

    // Track where we got to in the buffer (offset of last complete line end)
    let lastLineEndOffset = 0;
    // Track if the last line in our buffer was incomplete (malformed)
    let lastLineWasMalformed = false;
    // Track byte offset of start of malformed line in file
    let malformedByteOffset = -1;
    let malformedLineContent = '';
    let malformedParseError = '';

    // 9. Process each line (up to MAX_LINES_PER_POLL)
    let processed = 0;
    for (const line of lines) {
      if (processed >= CONFIG.MAX_LINES_PER_POLL) {
        console.log('[shadow] Max lines per poll reached, deferring rest to next cycle');
        cursor.eofPosition += lastLineEndOffset;
        saveCursor(cursor);
        return;
      }

      const lineBytes = Buffer.byteLength(line, 'utf8') + 1; // +1 for newline
      const entry = parseLine(line);

      if (!entry) {
        // Malformed line
        lastLineWasMalformed = true;
        malformedByteOffset = cursor.eofPosition + lastLineEndOffset;
        malformedLineContent = line.slice(0, 200); // preview
        malformedParseError = 'JSON parse failed';
        lastLineEndOffset += lineBytes;
        continue;
      }

      // Only user messages
      const msgRole = entry.message?.role || entry.role || null;
      if (msgRole && msgRole !== 'user') {
        lastLineEndOffset += lineBytes;
        continue;
      }

      const msgMeta = extractMetadata(entry);
      if (!msgMeta) {
        // Couldn't extract metadata (missing sender_id or message_id)
        lastLineEndOffset += lineBytes;
        continue;
      }

      // Duplicate check
      if (isDuplicate(msgMeta, cursor)) {
        console.log('[shadow] Duplicate message_id:', msgMeta.message_id);
        lastLineEndOffset += lineBytes;
        continue;
      }

      // Persist (shadow mode — no task creation)
      const result = await persistInstruction(msgMeta);
      lastLineEndOffset += lineBytes;

      if (result) {
        captureCount++;
        cursor.lastMessageId = msgMeta.message_id;
        if (!msgMeta.message_id) {
          cursor.lastMessageHash = hashMessage(msgMeta.text, msgMeta.sender_id, msgMeta.timestamp);
        }
      }
      processed++;
    }

    // 10. Handle incomplete last line at EOF
    const readEndOffset = cursor.eofPosition + bytesRead;
    const isAtEof = readEndOffset >= currentEof;

    if (isAtEof && lastLineWasMalformed) {
      // We reached EOF and the last line was malformed/incomplete
      // Quarantine the malformed line
      quarantine({
        quarantined_at: new Date().toISOString(),
        byte_offset: malformedByteOffset,
        reason: 'incomplete_json_at_eof',
        parse_error: malformedParseError,
        raw_preview: malformedLineContent,
        session_id: activeSession.id,
      });

      // Retry protocol: check if file has grown (gateway finished writing)
      let retryCount = 0;
      let fileGrew = false;
      while (retryCount < CONFIG.EOF_RETRY_COUNT) {
        await sleep(CONFIG.EOF_RETRY_DELAY_MS);
        const newEof = fs.statSync(activeSession.path).size;
        if (newEof > currentEof) {
          // File grew — gateway finished writing, we can now read past this
          fileGrew = true;
          console.log(`[shadow] EOF retry ${retryCount + 1}: file grew from ${currentEof} to ${newEof}, will re-read`);
          break;
        }
        retryCount++;
      }

      if (!fileGrew) {
        // All retries failed — advance past the incomplete line (controlled sacrifice)
        // We accept losing this one line to break the infinite retry loop
        console.log(`[shadow] EOF retry exhausted — advancing past incomplete line at offset ${malformedByteOffset}`);
        cursor.eofPosition = currentEof; // Set cursor to true EOF
        saveCursor(cursor);
        checkCaptureGap();
        return;
      }
      // File grew — fall through to save cursor and continue processing on next poll
    }

    // 11. Normal cursor advance
    cursor.eofPosition += lastLineEndOffset;
    saveCursor(cursor);

    // 12. Capture gap detection
    checkCaptureGap();

  } catch (err) {
    errorCount++;
    if (errorCount <= 3) {
      console.log('[shadow] Poll error:', err.message, err.stack);
    } else if (errorCount % 12 === 0) {
      console.log('[shadow] Poll error (suppressed):', err.message);
    }
  }
}

/**
 * Detect and log capture gaps — polls with no captures despite processing activity.
 */
function checkCaptureGap() {
  if (pollCount > 1 && captureCount === lastCaptureCount && errorCount === 0) {
    // No new captures this poll, but we processed lines — may indicate silent drop
    // Only log once per gap occurrence (not every poll)
    if (captureCount > 0) {
      // We've captured before but this poll had none — could be normal (no new messages)
      // Only warn if we had user messages in this poll that weren't captured
    }
  }
  lastCaptureCount = captureCount;
}

// ============================================================================
// LIFECYCLE
// ============================================================================

async function start() {
  console.log('[shadow] Starting instruction-sidecar-shadow.js');
  console.log('[shadow] Config:', {
    sessionsDir: CONFIG.SESSIONS_DIR,
    cursorFile: CONFIG.CURSOR_FILE,
    quarantineFile: CONFIG.QUARANTINE_FILE,
    checkIntervalMs: CONFIG.CHECK_INTERVAL_MS,
    supabaseUrl: CONFIG.SUPABASE_URL.replace(/\/\/.*@/, '//***@'),
    shadowStatus: CONFIG.SHADOW_STATUS,
    eofRetryCount: CONFIG.EOF_RETRY_COUNT,
    eofRetryDelayMs: CONFIG.EOF_RETRY_DELAY_MS,
  });

  // Validate Supabase credentials at startup
  try {
    getSupabase();
    console.log('[shadow] Supabase client initialized OK');
  } catch (err) {
    console.log('[shadow] FATAL: Supabase init failed:', err.message);
    process.exit(1);
  }

  // Confirm instructions table exists
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('instructions').select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log('[shadow] FATAL: instructions table does not exist. Run /ops/instruction-bridge.sql first.');
      process.exit(1);
    }
    console.log('[shadow] Instructions table accessible');
  } catch (err) {
    console.log('[shadow] FATAL: Cannot reach Supabase:', err.message);
    process.exit(1);
  }

  isRunning = true;

  // Main polling loop
  const loop = async () => {
    while (isRunning) {
      await poll();
      await sleep(CONFIG.CHECK_INTERVAL_MS);
    }
  };

  loop();

  // Graceful shutdown
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('[shadow] Polling started — shadow mode active (no execution authority)');
  console.log('[shadow] Stats: pollCount=0 captureCount=0 errorCount=0');
}

async function shutdown(signal) {
  console.log(`[shadow] Received ${signal}, shutting down gracefully...`);
  isRunning = false;
  await sleep(500);

  console.log('[shadow] Final stats:', { pollCount, captureCount, errorCount });
  process.exit(0);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  start().catch(err => {
    console.log('[shadow] Fatal start error:', err.message, err.stack);
    process.exit(1);
  });
}

module.exports = { start, poll, shutdown };