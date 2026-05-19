// MCAI Phase 3A — Commitment Integrity Foundation
// Bookkeeping only. No planning, no execution authority.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = process.cwd();
const LOG = path.join(BASE, 'state', 'commitments.jsonl');
const SNAPSHOT_DIR = path.join(BASE, 'state', 'snapshots', 'daily');
const AUDIT = path.join(BASE, 'state', 'commitments-audit.log');

const STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

// Deterministic ID: MD5(owner:intent:deadline) → 12 hex chars
function mkId(owner, intent, deadline) {
  return crypto.createHash('md5')
    .update(`${owner}:${intent}:${deadline}`)
    .digest('hex').slice(0, 12);
}

function readAll() {
  if (!fs.existsSync(LOG)) return [];
  const content = fs.readFileSync(LOG, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map(JSON.parse);
}

// Atomic write: temp file + rename
function writeAll(entries) {
  const tmp = LOG + '.tmp';
  fs.writeFileSync(tmp, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
  fs.renameSync(tmp, LOG);
}

// Append single line (for OUTCOME entries — append only)
function append(entry) {
  const fd = fs.openSync(LOG, 'a');
  fs.writeSync(fd, JSON.stringify(entry) + '\n');
  fs.closeSync(fd);
}

function audit(action, entry) {
  fs.appendFileSync(AUDIT, JSON.stringify({
    ts: new Date().toISOString(),
    action,
    entry
  }) + '\n');
}

// 1. Create commitment
function createCommitment({ intent, owner, deadline, successCriteria = [], relatedEntities = [], zoneClassification = 'INTERNAL', verification_required = false }) {
  const id = mkId(owner, intent, deadline);
  const entry = {
    type: 'COMMITMENT',
    commitment_id: id,
    intent,
    owner,
    created_at: new Date().toISOString(),
    deadline,
    status: STATUS.PENDING,
    success_criteria: successCriteria,
    related_entities: relatedEntities,
    verification_required,
    zone_classification: zoneClassification,
    shadow_only: true
  };
  append(entry);
  audit('COMMITMENT_CREATED', entry);
  return id;
}

// 2. Update commitment status
function updateStatus(commitmentId, newStatus) {
  if (!Object.values(STATUS).includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  const entries = readAll();
  const idx = entries.findIndex(e => e.commitment_id === commitmentId && e.type === 'COMMITMENT');
  if (idx === -1) throw new Error(`Commitment not found: ${commitmentId}`);
  const oldStatus = entries[idx].status;
  entries[idx].status = newStatus;
  entries[idx].updated_at = new Date().toISOString();
  writeAll(entries);
  audit('STATUS_UPDATED', { commitment_id: commitmentId, oldStatus, newStatus });
  return newStatus;
}

// 3. Append outcome entry (append-only — never update existing)
function appendOutcome({ commitment_id, outcome, verification_evidence = [], verified = false, notes = '' }) {
  const entry = {
    type: 'OUTCOME',
    commitment_id,
    outcome,
    verification_evidence,
    verified,
    completed_at: new Date().toISOString(),
    notes
  };
  append(entry);
  audit('OUTCOME_APPENDED', entry);
  return entry;
}

// 4. TTL expiration scan
function runExpirationScan() {
  const now = Date.now();
  const entries = readAll();
  let changed = false;
  for (const e of entries) {
    if (e.type === 'COMMITMENT' && (e.status === STATUS.PENDING || e.status === STATUS.IN_PROGRESS)) {
      if (new Date(e.deadline).getTime() < now) {
        e.status = STATUS.EXPIRED;
        e.updated_at = new Date().toISOString();
        changed = true;
        audit('COMMITMENT_EXPIRED', { commitment_id: e.commitment_id, deadline: e.deadline });
      }
    }
  }
  if (changed) writeAll(entries);
  return changed;
}

// 5. Validation: no orphaned outcomes
function validateNoOrphanedOutcomes() {
  const entries = readAll();
  const ids = new Set(entries.filter(e => e.type === 'COMMITMENT').map(e => e.commitment_id));
  return entries
    .filter(e => e.type === 'OUTCOME')
    .every(e => ids.has(e.commitment_id));
}

// 6. Audit logging (handled inline by all write operations)

// 7. Daily snapshot
function takeSnapshot() {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(SNAPSHOT_DIR, date + '.json');
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  fs.writeFileSync(dir, JSON.stringify({
    ts: new Date().toISOString(),
    entries: readAll()
  }, null, 2));
  return dir;
}

// 10. Read-only metrics
function getMetrics() {
  const entries = readAll();
  const cs = entries.filter(e => e.type === 'COMMITMENT');
  const now = Date.now();
  const open = cs.filter(e => e.status === STATUS.PENDING || e.status === STATUS.IN_PROGRESS).length;
  const expired = cs.filter(e => e.status === STATUS.EXPIRED).length;
  const completed = cs.filter(e => e.status === STATUS.COMPLETED || e.status === STATUS.VERIFIED).length;
  const verified = cs.filter(e => e.status === STATUS.VERIFIED).length;
  const verification_rate = completed > 0
    ? parseFloat(((verified / completed) * 100).toFixed(2))
    : 0;
  const completedOnes = cs.filter(e => e.status === STATUS.COMPLETED || e.status === STATUS.VERIFIED);
  let avgDays = null;
  if (completedOnes.length > 0) {
    const totalMs = completedOnes.reduce((sum, c) => {
      const created = new Date(c.created_at).getTime();
      const updated = new Date(c.updated_at || c.created_at).getTime();
      return sum + (updated - created);
    }, 0);
    avgDays = parseFloat((totalMs / completedOnes.length / (1000 * 60 * 60 * 24)).toFixed(2));
  }
  const stale = cs.filter(e => {
    if (e.status !== STATUS.PENDING && e.status !== STATUS.IN_PROGRESS) return false;
    const lastUpdate = new Date(e.updated_at || e.created_at).getTime();
    return (now - lastUpdate) > (7 * 24 * 60 * 60 * 1000);
  }).length;
  return {
    open_commitments: open,
    expired_commitments: expired,
    verification_rate,
    average_completion_time: avgDays,
    stale_commitments: stale
  };
}

module.exports = {
  STATUS,
  mkId,
  createCommitment,
  updateStatus,
  appendOutcome,
  runExpirationScan,
  validateNoOrphanedOutcomes,
  takeSnapshot,
  getMetrics,
  readAll
};