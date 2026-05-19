// MCAI Phase 3B — Verification Discipline Layer
// Evidence-attachment only. No planning, no execution authority.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = process.cwd();
const VLOG = path.join(BASE, 'state', 'verification-log.jsonl');
const SNAPSHOT_DIR = path.join(BASE, 'state', 'snapshots', 'daily');
const AUDIT = path.join(BASE, 'state', 'verification-audit.log');

// Verification status enum
const VSTATUS = {
  UNVERIFIED: 'UNVERIFIED',
  PARTIALLY_VERIFIED: 'PARTIALLY_VERIFIED',
  VERIFIED: 'VERIFIED',
  FAILED_VERIFICATION: 'FAILED_VERIFICATION',
  STALE_VERIFICATION: 'STALE_VERIFICATION'
};

// Evidence type enum — allowed sources only
const ETYPE = {
  PM2_OUTPUT: 'pm2_output',
  HEARTBEAT_FILE: 'heartbeat_file',
  WORLD_MODEL: 'world_model',
  BELIEF_REGISTRY: 'belief_registry',
  LOG_FILE: 'log_file',
  FILESYSTEM_CHECK: 'filesystem_check',
  API_RESPONSE: 'api_response',
  HUMAN_CONFIRMATION: 'human_confirmation'
};

// Default TTL per evidence type (ms)
const TTL_MAP = {
  [ETYPE.PM2_OUTPUT]:         24 * 60 * 60 * 1000,   // 24h
  [ETYPE.HEARTBEAT_FILE]:      60 * 60 * 1000,          // 1h
  [ETYPE.WORLD_MODEL]:         7 * 24 * 60 * 60 * 1000, // 7d
  [ETYPE.BELIEF_REGISTRY]:     7 * 24 * 60 * 60 * 1000, // 7d
  [ETYPE.LOG_FILE]:            24 * 60 * 60 * 1000,     // 24h
  [ETYPE.FILESYSTEM_CHECK]:     60 * 60 * 1000,          // 1h
  [ETYPE.API_RESPONSE]:         5 * 60 * 1000,            // 5m
  [ETYPE.HUMAN_CONFIRMATION]:   365 * 24 * 60 * 60 * 1000 // 1y — human confirms don't go stale fast
};

// Confidence band enum
const CBAND = {
  HIGH: 'HIGH',       // Direct evidence, immediate timestamp
  MEDIUM: 'MEDIUM',   // Indirect evidence or slight latency
  LOW: 'LOW'         // Heuristic or external source
};

// Deterministic verification ID
function mkVid(commitment_id, verification_method, verified_at) {
  return crypto.createHash('md5')
    .update(`${commitment_id}:${verification_method}:${verified_at}`)
    .digest('hex').slice(0, 12);
}

function readVLog() {
  if (!fs.existsSync(VLOG)) return [];
  const content = fs.readFileSync(VLOG, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map(JSON.parse);
}

function appendV(entry) {
  const fd = fs.openSync(VLOG, 'a');
  fs.writeSync(fd, JSON.stringify(entry) + '\n');
  fs.closeSync(fd);
}

function auditV(action, entry) {
  fs.appendFileSync(AUDIT, JSON.stringify({
    ts: new Date().toISOString(),
    action,
    entry
  }) + '\n');
}

// 1. Create verification record
function createVerification({ commitment_id, verification_method, evidence = [], verifier = 'SYSTEM', confidence_band = CBAND.MEDIUM, verification_status = VSTATUS.UNVERIFIED, notes = '' }) {
  if (!Object.values(VSTATUS).includes(verification_status)) {
    throw new Error(`Invalid verification_status: ${verification_status}`);
  }
  if (!Object.values(ETYPE).includes(verification_method)) {
    throw new Error(`Invalid verification_method: ${verification_method}`);
  }
  for (const ev of evidence) {
    if (!Object.values(ETYPE).includes(ev.evidence_type)) {
      throw new Error(`Invalid evidence_type: ${ev.evidence_type}`);
    }
    if (!ev.evidence_content && !ev.evidence_ref) {
      throw new Error('Evidence must have either evidence_content or evidence_ref');
    }
  }

  const verified_at = new Date().toISOString();
  const verification_id = mkVid(commitment_id, verification_method, verified_at);

  const entry = {
    type: 'VERIFICATION',
    verification_id,
    commitment_id,
    verified_at,
    verification_method,
    evidence, // array of { evidence_type, evidence_content, evidence_ref }
    verifier,
    confidence_band,
    verification_status,
    notes,
    // TTL computed from evidence type with longest TTL as cap
    expires_at: computeExpiry(verification_method)
  };

  appendV(entry);
  auditV('VERIFICATION_CREATED', entry);
  return verification_id;
}

function computeExpiry(verification_method) {
  const ttl = TTL_MAP[verification_method] || (60 * 60 * 1000);
  return new Date(Date.now() + ttl).toISOString();
}

// 2. Update verification status
function updateVerificationStatus(verification_id, newStatus) {
  if (!Object.values(VSTATUS).includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  const entries = readVLog();
  const idx = entries.findIndex(e => e.verification_id === verification_id && e.type === 'VERIFICATION');
  if (idx === -1) throw new Error(`Verification not found: ${verification_id}`);

  const oldStatus = entries[idx].verification_status;
  entries[idx].verification_status = newStatus;
  entries[idx].updated_at = new Date().toISOString();

  // Write all back (verification records are small; treat as atomic rewrite)
  writeVLog(entries);
  auditV('VERIFICATION_UPDATED', { verification_id, oldStatus, newStatus });
  return newStatus;
}

function writeVLog(entries) {
  const tmp = VLOG + '.tmp';
  fs.writeFileSync(tmp, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
  fs.renameSync(tmp, VLOG);
}

// 3. Append evidence to existing verification
function appendEvidence({ verification_id, newEvidence = [] }) {
  for (const ev of newEvidence) {
    if (!Object.values(ETYPE).includes(ev.evidence_type)) {
      throw new Error(`Invalid evidence_type: ${ev.evidence_type}`);
    }
    if (!ev.evidence_content && !ev.evidence_ref) {
      throw new Error('Evidence must have evidence_content or evidence_ref');
    }
  }
  const entries = readVLog();
  const idx = entries.findIndex(e => e.verification_id === verification_id);
  if (idx === -1) throw new Error(`Verification not found: ${verification_id}`);
  entries[idx].evidence.push(...newEvidence);
  entries[idx].updated_at = new Date().toISOString();
  writeVLog(entries);
  auditV('EVIDENCE_APPENDED', { verification_id, count: newEvidence.length });
  return entries[idx];
}

// 4. TTL expiration sweep
function runVerificationSweep() {
  const now = Date.now();
  const entries = readVLog();
  let changed = false;
  for (const e of entries) {
    if (e.type === 'VERIFICATION' && e.verification_status === VSTATUS.VERIFIED) {
      const expiry = new Date(e.expires_at).getTime();
      if (expiry < now) {
        e.verification_status = VSTATUS.STALE_VERIFICATION;
        e.updated_at = new Date().toISOString();
        changed = true;
        auditV('VERIFICATION_STALE', { verification_id: e.verification_id, expired_at: e.expires_at });
      }
    }
  }
  if (changed) writeVLog(entries);
  return changed;
}

// 5. Orphan detection
function detectOrphanedVerifications() {
  const vEntries = readVLog().filter(e => e.type === 'VERIFICATION');
  // orphaned = verification whose commitment_id has no matching COMMITMENT in commitments log
  // We can only check against commitment IDs we can read
  const cLog = path.join(BASE, 'state', 'commitments.jsonl');
  if (!fs.existsSync(cLog)) return vEntries.map(e => e.verification_id);
  const cContent = fs.readFileSync(cLog, 'utf8').trim();
  if (!cContent) return vEntries.map(e => e.verification_id);
  const commitments = cContent.split('\n').filter(Boolean).map(JSON.parse).filter(e => e.type === 'COMMITMENT');
  const cIds = new Set(commitments.map(e => e.commitment_id));
  return vEntries.filter(e => !cIds.has(e.commitment_id)).map(e => e.verification_id);
}

// 6. Validation: no dangling verifications (all map to evidence)
function validateVerificationChain() {
  const entries = readVLog().filter(e => e.type === 'VERIFICATION');
  for (const e of entries) {
    if (!e.verification_id || !e.commitment_id) return false;
    if (!e.verified_at) return false;
    if (e.evidence && !Array.isArray(e.evidence)) return false;
  }
  return true;
}

// 7. Daily snapshot
function takeVerificationSnapshot() {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(SNAPSHOT_DIR, `verification-${date}.json`);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  fs.writeFileSync(dir, JSON.stringify({
    ts: new Date().toISOString(),
    entries: readVLog()
  }, null, 2));
  return dir;
}

// 8. Read-only metrics
function getVerificationMetrics() {
  const entries = readVLog().filter(e => e.type === 'VERIFICATION');
  const now = Date.now();

  const total = entries.length;
  const verified = entries.filter(e => e.verification_status === VSTATUS.VERIFIED).length;
  const stale = entries.filter(e => e.verification_status === VSTATUS.STALE_VERIFICATION).length;
  const failed = entries.filter(e => e.verification_status === VSTATUS.FAILED_VERIFICATION).length;
  const partial = entries.filter(e => e.verification_status === VSTATUS.PARTIALLY_VERIFIED).length;
  const unverified = entries.filter(e => e.verification_status === VSTATUS.UNVERIFIED).length;

  const coverage = total > 0 ? parseFloat(((verified / total) * 100).toFixed(2)) : 0;
  const stale_rate = total > 0 ? parseFloat(((stale / total) * 100).toFixed(2)) : 0;
  const failed_rate = total > 0 ? parseFloat(((failed / total) * 100).toFixed(2)) : 0;

  // Average verification latency (time from commitment created_at to verification created)
  const cLog = path.join(BASE, 'state', 'commitments.jsonl');
  let avgLatency = null;
  if (fs.existsSync(cLog)) {
    const cContent = fs.readFileSync(cLog, 'utf8').trim();
    if (cContent) {
      const commitments = cContent.split('\n').filter(Boolean).map(JSON.parse).filter(e => e.type === 'COMMITMENT');
      const cMap = {};
      commitments.forEach(c => { cMap[c.commitment_id] = c.created_at; });

      const latencies = entries
        .filter(e => e.verification_status === VSTATUS.VERIFIED && cMap[e.commitment_id])
        .map(e => new Date(e.verified_at).getTime() - new Date(cMap[e.commitment_id]).getTime());

      if (latencies.length > 0) {
        const totalMs = latencies.reduce((a, b) => a + b, 0);
        avgLatency = parseFloat((totalMs / latencies.length / (1000 * 60 * 60)).toFixed(2)); // hours
      }
    }
  }

  // Evidence source distribution
  const sourceDist = {};
  for (const e of entries) {
    for (const ev of (e.evidence || [])) {
      sourceDist[ev.evidence_type] = (sourceDist[ev.evidence_type] || 0) + 1;
    }
  }

  return {
    verification_coverage: coverage,
    stale_verification_rate: stale_rate,
    failed_verification_rate: failed_rate,
    average_verification_latency_hours: avgLatency,
    evidence_source_distribution: sourceDist,
    total_verifications: total,
    verified_count: verified,
    stale_count: stale,
    failed_count: failed,
    partially_verified_count: partial,
    unverified_count: unverified
  };
}

module.exports = {
  VSTATUS,
  ETYPE,
  CBAND,
  mkVid,
  createVerification,
  updateVerificationStatus,
  appendEvidence,
  runVerificationSweep,
  detectOrphanedVerifications,
  validateVerificationChain,
  takeVerificationSnapshot,
  getVerificationMetrics,
  readVLog
};