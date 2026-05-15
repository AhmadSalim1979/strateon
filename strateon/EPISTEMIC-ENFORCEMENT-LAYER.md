# EPISTEMIC ENFORCEMENT LAYER (EEL) - DESIGN DOCUMENT
## Runtime Governance Architecture for Truth Classification and Safe Operational Output

**Date:** 2026-05-15
**Phase:** Design Only - No Implementation
**Trigger:** Prior unsupported inference of alert destination - a serious epistemic control failure
**Classification:** OPERATIONAL GOVERNANCE - HIGH PRIORITY

---

## 1. PROBLEM STATEMENT

### The Core Failure

During the watchdog alert design session, an alert destination was inferred and used in a design document without verified evidence from an approved source. The address `ahmad@salim.pk` was invented rather than sourced from `ops/PROVIDER-REGISTRY.md`, `secrets/*.json`, or explicit session approval.

This is not a minor error. In operational governance:

- **An inferred credential is a security breach.**
- **An invented alert destination means critical alerts miss their target.**
- **A fabricated infrastructure claim causes wrong execution decisions.**
- **An assumed approval enables unauthorized action.**

The prior session demonstrated that Moosa's output layer lacks a mandatory gate that enforces truth classification before operational statements escape into execution or documentation.

### Why This Is Urgent

The system is approaching production operational status:
- Worker processes real tasks with dispatch-linked execution
- Watchdog will send real alerts to real destinations
- Recovery actions will execute real commands on real infrastructure
- Ahmad approves or denies based on Moosa's claims

**Every unverified claim that reaches Ahmad or executes as a command is a governance failure.**

The current AGENTS.md already contains truth classification prefixes:
```
[VERIFIED FACT] - confirmed by file/line, command, API, DB, or process
[INFERRED] - derived from available evidence, logical extension
[ASSUMPTION] - stated as unverified, acknowledged as unknown
[UNKNOWN] - cannot determine, explicitly flagged, no speculation
```

But these are voluntary self-assessments in output text. They are NOT enforced by runtime architecture. There is no gate that blocks UNVERIFIED sensitive facts from escaping.

### What We Need

A runtime enforcement layer that:
1. Classifies every operationally sensitive fact before it escapes Moosa's output
2. Fails closed on UNVERIFIED sensitive facts (blocks or quarantines rather than releases)
3. Maintains provenance (source of every fact, at every step)
4. Logs classification decisions for audit
5. Escalates when UNKNOWN facts are needed for operational decisions

---

## 2. THREAT MODEL

### Threat Actors

| Actor | Threat | Example |
|-------|--------|---------|
| **Moosa (hallucination)** | Fabricates facts to fill gaps | "The credentials are in neo.json" (not verified) |
| **Moosa (speed)** | Infers instead of verifying | Infers alert destination instead of checking registry |
| **Moosa (autonomy drift)** | Expands scope without approval | Infers "Ahmad approved" when only implicit indication exists |
| **Sub-agent (hallucination)** | C-suite agents produce unverified claims | CMO claims "Qiyadon has 10,000 users" without data |
| **Worker (stale data)** | Acts on outdated file | Executes on a task that was already processed |
| **External (misinformation)** | API returns wrong data | Supabase returns stale task state |
| **Configuration (drift)** | Secrets file changed without propagation | Neo SMTP credentials updated but watchdog not restarted |

### Threat Scenarios

**T1: Invented Alert Destination**
```
Moosa generates watchdog alert design
→ Infers alert destination as "ahmad@salim.pk"
→ Alert destination never verified against PROVIDER-REGISTRY or secrets
→ Design committed with false destination
→ Implementation sends alerts to wrong address
→ Critical infrastructure alerts silently fail
```

**T2: Fabricated Credential**
```
Moosa needs SMTP password for email fallback
→ Does not find in secrets/neo.json (only qiyadon-email.json has it)
→ Fabricates: "smtp.privateemail.com password"
→ Email fallback silently fails in production
```

**T3: Assumed Approval**
```
Moosa prepared a recovery action
→ Ahmad gave vague indication ("looks good")
→ Moosa interprets as "approved" without explicit confirmation
→ Executes recovery without explicit approval
→ Violates approval protocol
```

**T4: Widened Autonomy**
```
Moosa encounters new provider during diagnostics
→ Does not have it in PROVIDER-REGISTRY
→ Decides "I'll just use it since it seems right"
→ Uses unapproved provider for operational output
→ Security/compliance violation
```

**T5: Inferred Infrastructure State**
```
Moosa checks PM2 list, sees worker status
→ Assumes worker is healthy because it shows "online"
→ Does not verify actual heartbeat freshness
→ Ignores that worker has been "online" but stalled for 20 minutes
```

**T6: Command Hallucination**
```
Moosa proposes recovery action
→ Cites a pm2 command that does not exist
→ Ahmad approves "the described command"
→ Execution fails, infrastructure left in inconsistent state
```

### Assets to Protect

| Asset | Value | Threat |
|-------|-------|--------|
| Alert delivery | Critical infrastructure notification | Missed alerts |
| Credential integrity | Security boundary | Unauthorized access |
| Approval authenticity | Authorization boundary | Unauthorized execution |
| Fact provenance | Decision integrity | Wrong operational decisions |
| Command accuracy | Infrastructure safety | Destructive commands |

---

## 3. TRUTH-STATE DEFINITIONS

### State Definitions

| State | Definition | Operational Use | Fail/Open |
|-------|------------|-----------------|-----------|
| **VERIFIED** | Confirmed by authoritative source at time of claim | Fully permitted for all operational use | **PASS** - continues |
| **DERIVED** | Logically inferred from verified facts, not directly confirmed | Permitted with explicit `[DERIVED]` label | **PASS** with provenance |
| **ASSUMED** | Stated as unverified, acknowledged as unknown | Permitted ONLY with `[ASSUMPTION]` prefix, never used for execution | **PASS** with explicit acknowledgment |
| **UNKNOWN** | Cannot determine from available evidence | Fails closed - blocked from operational use | **FAIL** - escalation required |

### Truth State Hierarchy

```
VERIFIED (authoritative source)
  ↑
  │ ← provenance required
  │
DERIVED (logical inference from VERIFIED)
  ↑
  │ ← provenance of inference chain required
  │
ASSUMED (explicitly acknowledged unverified)
  ↑
  │ ← explicit acknowledgment required in output
  │
UNKNOWN (cannot determine)
  ↑
  │ ← BLOCKED - cannot escape to operational output
  │ ← must escalate to Ahmad for verification or explicit approval
```

### Critical Distinction: DERIVED vs ASSUMED

**DERIVED** means "I know this is true because verified facts prove it":
```
VERIFIED: Supabase URL is https://btrbczqjwzuybgcxckvm.supabase.co (from secrets/supabase.json)
VERIFIED: The tasks table exists in the public schema (from schema inspection)
DERIVED:   The task with ID X is in Supabase (because we queried it and got a result)
```

**ASSUMED** means "I don't know, but I'm treating it as true anyway":
```
ASSUMED: The tasks table has a status column (we saw it work earlier, but haven't verified directly)
```

The difference: DERIVED is evidence-based logic. ASSUMED is speculation with acknowledgment.

---

## 4. PROVENANCE REQUIREMENTS FOR EACH TRUTH STATE

### VERIFIED - Required Provenance

```
Source types (in order of authority):
1. File path + line number        - source code, config files, secrets
2. Command output                 - runtime command results (pm2 list, curl, etc.)
3. API response                   - HTTP responses with status + body
4. Database query                 - Supabase queries with verified schema
5. Process state                  - PID, uptime, memory from pm2/ps
6. Signed delivery receipt         - email delivery confirmation, WhatsApp read receipt

Must include:
- Source type
- Source identifier (file path, URL, PID, etc.)
- Timestamp (ISO 8601)
- Raw value or exact match
- Confidence: VERIFIED - 100% match
```

**Example VERIFIED fact:**
```
Fact: Supabase URL is https://btrbczqjwzuybgcxckvm.supabase.co
Provenance:
  source: secrets/supabase.json
  path: /home/node/.openclaw/workspace/secrets/supabase.json:1
  timestamp: 2026-05-15T20:00:00.000Z
  raw: "https://btrbczqjwzuybgcxckvm.supabase.co"
  confidence: VERIFIED
```

### DERIVED - Required Provenance

```
Must include:
- Inference chain (each step)
- Each step's provenance (back to VERIFIED facts)
- Logical rule applied
- Confidence: DERIVED - 95-99% (depends on inference reliability)

Example DERIVED fact:
Fact: moosa-worker process 922274 is actively polling
Provenance:
  chain:
    - VERIFIED: worker.json heartbeat age = 3 seconds (file read, 2026-05-15T20:38:00Z)
    - VERIFIED: heartbeat threshold = 10 minutes (watchdog.js:41)
    - RULE: 3s < 10min threshold → worker is alive
  confidence: DERIVED (logical deduction from threshold rule)
```

### ASSUMED - Required Provenance

```
Must include:
- Explicit acknowledgment phrase
- What is not known
- What is being assumed
- Why the assumption is being made
- Confidence: ASSUMED - 0-50% (explicitly unverified)

Example ASSUMED fact:
Fact: [ASSUMPTION] watchdog requires openclaw-gateway to send WhatsApp alerts
Provenance:
  acknowledgment: "I do not have verified evidence for this claim"
  unknown: Whether watchdog can send WhatsApp without gateway
  assumption: I'm assuming this based on understanding of OpenClaw architecture
  rationale: "The design requires a gateway for CLI-based WhatsApp delivery"
  confidence: ASSUMED
```

### UNKNOWN - Required Handling

```
Must include:
- Explicit "[UNKNOWN]" prefix in all outputs
- What is not known
- What would be required to verify
- Whether this fact is needed for the current operation

Example UNKNOWN fact:
Fact: [UNKNOWN] whether Neo SMTP credentials in qiyadon-email.json are current
Provenance:
  unknown: Cannot confirm if credentials have been rotated since last verification
  needed_to_verify: Read qiyadon-email.json, compare with Neo account status
  operation_impact: Email fallback alerts would fail if credentials are wrong
  required_action: Must verify with Ahmad or check Neo dashboard before use
  confidence: UNKNOWN
```

---

## 5. AUTHORITY HIERARCHY FOR FACTS

### Critical Distinction: Evidence vs Authority

**Evidence** is information found in a source. **Authority** is the right to approve that information for operational use.

```
A file contains: "From: ahmad.salim@qiyadon.com"
  → This is EVIDENCE that this address is associated with Ahmad
  → This is NOT AUTHORITY to use it as an operational alert destination

Ahmad explicitly writes: "Use ahmad.salim@qiyadon.com for watchdog alerts"
  → This is both EVIDENCE and AUTHORITY

ops/PROVIDER-REGISTRY.md lists: "email: contact@qiyadon.com (Neo SMTP approved)"
  → This is AUTHORITY for email operations (since PROVIDER-REGISTRY is an authority source)

EMAIL-SIGNATURES.md lists: "ahmad.salim@qiyadon.com" in a signature block
  → This is EVIDENCE of Ahmad's preferred From address for customer emails
  → This is NOT authority for watchdog alert destinations
  → Email signatures are NOT alert destination authorities
```

**The key rule:** Finding a fact in a file does not automatically make that file an authority for that fact category. Authority must be explicitly registered.

### Authority Registry

**Only these source types can be authorities, and only for the categories listed:**

```
ops/PROVIDER-REGISTRY.md
  → Authority for: provider names, approved provider configurations
  → NOT authority for: alert destinations, credentials, recovery actions

secrets/*.json (any file in secrets/)
  → Authority for: credentials (api_keys, passwords, tokens, endpoints)
  → NOT authority for: alert destinations, provider approvals

ops/ALERT-DESTINATION-REGISTRY.md (NEW - must be created)
  → Authority for: alert_destination categories only
  → Explicit list of approved alert targets per alert type

Ahmad explicit WhatsApp approval
  → Authority for: approval, recovery_action, credential use, alert_destination

workspace code/config files (*.js, *.json, *.md in workspace)
  → Authority for: infrastructure_state, process_state, command structure
  → NOT authority for: credentials, alert_destinations, approvals

Runtime commands (pm2, curl, ps)
  → Authority for: current system state (at time of execution)
  → NOT authority for: future action authorization

Supabase database (authenticated query)
  → Authority for: data state, task status, dispatch lifecycle
  → NOT authority for: credentials, alert destinations, approvals

EMAIL-SIGNATURES.md
  → Authority for: NOTHING operational
  → Role: Evidence of Ahmad's email formatting preferences only
  → Cannot authorize: alert destinations, credentials, approvals, providers
  → Reason: Signatures are display/preference metadata, not operational configuration
```

**Critical:** EMAIL-SIGNATURES.md is specifically excluded from operational authority. It contains Ahmad's email From addresses for customer communications - not approved alert targets. Any alert destination sourced from EMAIL-SIGNATURES.md must be verified against an explicit alert destination registry or Ahmad's direct approval.

### Who Can Certify a Fact as VERIFIED

| Authority | Scope | Example |
|-----------|-------|---------|
| **ops/ALERT-DESTINATION-REGISTRY.md** | alert_destination ONLY | Explicitly listed alert targets |
| **ops/PROVIDER-REGISTRY.md** | provider names, approved integrations | Provider approval |
| **secrets/*.json** | credentials, endpoints, tokens | SMTP password, API keys |
| **Ahmad explicit approval** | authorization boundary | WhatsApp "approved" |
| **Ahmad explicit credential approval** | specific credential use | "Use the Neo SMTP credentials" |
| **Runtime commands (current state)** | current system state only | pm2 list, ps aux |
| **Database queries (current state)** | data state at query time | Supabase task status |
| **Workspace config files** | infrastructure_state, process_state | ecosystem.config.cjs |

### What Each Authority CANNOT Authorize

| Authority | Cannot Authorize |
|-----------|-------------------|
| EMAIL-SIGNATURES.md | Nothing operational - evidence only |
| Runtime commands | Future action authorization |
| Workspace config files | Credentials, alert destinations |
| Supabase database | Alert destinations, approval state |
| Provider registry | Alert destinations, specific credentials |

---

## 6.5. AUTHORITY REGISTRY MODEL

### Explicit Authority Registry

Every source must be explicitly registered as an authority for specific fact categories. No file is self-authorizing.

```javascript
// Authority registry schema (definitive list - must be maintained)
const AUTHORITY_REGISTRY = {
  // File-based authorities
  'ops/PROVIDER-REGISTRY.md': {
    categories: ['provider'],
    fact_types: ['provider_name', 'provider_endpoint', 'provider_config'],
    notes: 'Maintains approved provider list only'
  },

  'ops/ALERT-DESTINATION-REGISTRY.md': {
    categories: ['alert_destination'],
    fact_types: ['email_address', 'phone_number', 'webhook_url'],
    notes: 'NEW - must be created; contains explicit alert target approvals'
  },

  'secrets/*.json': {
    categories: ['credential'],
    fact_types: ['api_key', 'password', 'token', 'endpoint', 'url'],
    notes: 'All files in secrets/ are credential authorities'
  },

  'workspace/*.js': {
    categories: ['infrastructure_state', 'process_state'],
    fact_types: ['ecosystem_config', 'handler_registration', 'command_structure'],
    notes: 'Workspace source files for current system configuration'
  },

  'workspace/*.json': {
    categories: ['infrastructure_state'],
    fact_types: ['package_config', 'environment_config'],
    notes: 'JSON configs in workspace'
  },

  'state/heartbeats/*.json': {
    categories: ['process_state'],
    fact_types: ['heartbeat_age', 'last_cycle', 'worker_status'],
    notes: 'Current heartbeat state at read time'
  },

  // Runtime command authorities
  'pm2_list': {
    categories: ['process_state'],
    fact_types: ['pid', 'status', 'uptime', 'memory', 'restart_count'],
    temporal: 'current',  // Only valid at time of command execution
    notes: 'pm2 list - current process state only'
  },

  'ps_aux': {
    categories: ['process_state'],
    fact_types: ['pid', 'cpu', 'mem', 'command'],
    temporal: 'current',
    notes: 'ps aux - current process state only'
  },

  'curl_http': {
    categories: ['infrastructure_state', 'account_state'],
    fact_types: ['http_status', 'api_response', 'endpoint_health'],
    temporal: 'current',
    notes: 'HTTP API responses - state at request time'
  },

  'supabase_query': {
    categories: ['data_state'],
    fact_types: ['task_status', 'dispatch_lifecycle', 'record_existence'],
    temporal: 'current',
    notes: 'Supabase queries - data state at query time'
  },

  // Explicit Ahmad approval
  'whatsapp_ahmad_approval': {
    categories: ['approval', 'recovery_action', 'credential', 'alert_destination'],
    fact_types: ['explicit_approval', 'command_authorization'],
    temporal: 'bounded',  // Valid until revoked or execution complete
    notes: 'Only WhatsApp messages explicitly containing approval phrases'
  },

  // NON-AUTHORITIES (evidence only)
  'EMAIL-SIGNATURES.md': {
    categories: [],  // NO operational authority
    fact_types: [],
    notes: 'EVIDENCE ONLY - contains email From addresses for customer communications.
            NOT an authority for alert_destinations, credentials, providers, or approvals.
            Cannot be used to authorize operational destinations.'
  },

  'CHANGELOG.md': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY - historical change log. Not authority for current state.'
  },

  'memory/*.md': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY - historical session notes. Not authority for current facts.'
  },

  '*.log': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY - historical log entries. Not authority for current state.'
  }
};
```

### EEL Authority Check Flow

```javascript
async function eel_verify_authority(fact, category, source) {
  // Step 1: Look up source in authority registry
  const registry_entry = AUTHORITY_REGISTRY[source];

  if (!registry_entry) {
    return {
      authorized: false,
      reason: `Source "${source}" is not in AUTHORITY_REGISTRY`,
      evidence_only: true,
      error_code: 'EEL_SOURCE_NOT_AUTHORITY'
    };
  }

  // Step 2: Check if category is in scope for this authority
  if (!registry_entry.categories.includes(category)) {
    return {
      authorized: false,
      reason: `Authority "${source}" does not cover category "${category}"`,
      error_code: 'EEL_CATEGORY_NOT_IN_SCOPE',
      allowed_categories: registry_entry.categories
    };
  }

  // Step 3: Check temporal constraints
  if (registry_entry.temporal === 'current') {
    const fact_age = Date.now() - fact.timestamp;
    if (fact_age > 60_000) {  // 60 seconds
      return {
        authorized: false,
        reason: `Runtime command result expired (${fact_age}ms old)`,
        error_code: 'EEL_FACT_EXPIRED'
      };
    }
  }

  return {
    authorized: true,
    scope: registry_entry.categories,
    notes: registry_entry.notes
  };
}
```

### New Requirement: ALERT-DESTINATION-REGISTRY.md

For alert destinations to be VERIFIED, they must exist in a new file:

```
ops/ALERT-DESTINATION-REGISTRY.md

# Approved Alert Destinations
# Only destinations listed here are authorized for operational alert use

## Email Alerts (Watchdog, Critical)
- ahmad.salim@qiyadon.com       # PRIMARY - approved 2026-05-15 by Ahmad Salim
- contact@qiyadon.com            # BACKUP - approved 2026-05-15 by Ahmad Salim

## WhatsApp (Not yet configured - requires OpenClaw WhatsApp re-auth)

## Webhook (Future)
# TBD
```

**Until ALERT-DESTINATION-REGISTRY.md is created, no alert destination can be VERIFIED.**

---

### Authority Hierarchy

```
Ahmad Salim (highest authority)
  └── Explicit written approval     → AUTHORIZES execution
  └── Explicit credential approval   → AUTHORIZES use of specific credential
  └── Explicit destination approval  → AUTHORIZES use of specific destination

Provider Registry (ops/PROVIDER-REGISTRY.md)
  └── Lists approved providers
  └── Use of unlisted provider requires Ahmad approval

Secrets Files (secrets/*.json)
  └── Authoritative source for credentials
  └── Read directly before use, never assumed

Runtime Commands (pm2, curl, etc.)
  └── Authoritative for current system state
  └── Must be executed at time of claim

Database Queries (Supabase)
  └── Authoritative for data state
  └── Must include timestamp

Files (workspace source code, configs)
  └── Authoritative for code/config state
  └── Must cite file path + line number
```

### No Self-Certification

**Critical rule:** Moosa CANNOT certify its own outputs as VERIFIED without provenance.

```
WRONG:
  "The worker is healthy"  ← Moosa self-certifying, no provenance

RIGHT:
  "The worker is healthy"
  [VERIFIED FACT]
  source: pm2 list (command output, 2026-05-15T20:38:00Z)
  raw: "[28] moosa-worker pid:922274 status:online"
```

---

## 6. OPERATIONAL FACT REGISTRY MODEL

### Fact Record Schema

```javascript
{
  id: uuid,
  fact: string,                    // The factual claim
  state: 'VERIFIED' | 'DERIVED' | 'ASSUMED' | 'UNKNOWN',

  // Provenance
  provenance: {
    type: 'file' | 'command' | 'api' | 'database' | 'process' | 'approval' | 'registry' | 'none',
    source: string,                // e.g., "secrets/supabase.json"
    path?: string,                 // e.g., "/home/node/.openclaw/workspace/secrets/supabase.json:5"
    command?: string,              // If command output
    timestamp: ISO8601,           // When the source was read/executed
    raw: string,                  // Exact value from source
    chain?: [                     // For DERIVED facts
      { step: string, source: string, timestamp: ISO8601 }
    ],
    acknowledgment?: string,       // For ASSUMED facts
  },

  // Classification metadata
  category: 'email' | 'phone' | 'identity' | 'alert_destination' | 'provider' |
            'credential' | 'url' | 'infrastructure_state' | 'process_state' |
            'command' | 'approval' | 'recovery_action' | 'execution_target' |
            'account_id' | 'billing' | 'security' | 'other',

  // Operational status
  operation_impact: 'BLOCKS_EXECUTION' | 'REDUCES_CONFIDENCE' | 'INFORMATIONAL',
  last_verified_at: ISO8601,
  expires_at?: ISO8601,            // For facts with TTL (e.g., task status)

  // Audit
  classified_by: 'moosa' | 'eel_gate' | 'ahmad_approval',
  classified_at: ISO8601,
  classification_id: uuid          // Links to classification audit log
}
```

### Fact Categories and Their Fail-Closed Behavior

| Category | VERIFIED | DERIVED | ASSUMED | UNKNOWN |
|----------|----------|---------|---------|---------|
| **email_address** | ✅ Allowed | ⚠️ Flagged | ❌ Blocked | ❌ Blocked |
| **alert_destination** | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **credential** | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **provider** | ✅ Allowed | ⚠️ Flagged | ❌ Blocked | ❌ Blocked |
| **approval** | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **recovery_action** | ✅ Allowed | ⚠️ Flagged | ❌ Blocked | ❌ Blocked |
| **command** | ✅ Allowed | ⚠️ Flagged | ❌ Blocked | ❌ Blocked |
| **infrastructure_state** | ✅ Allowed | ⚠️ Flagged | ⚠️ Flagged | ❌ Blocked |
| **process_state** | ✅ Allowed | ⚠️ Flagged | ⚠️ Flagged | ❌ Blocked |
| **account_id** | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **billing** | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **security** | ✅ Allowed | ⚠️ Flagged | ❌ Blocked | ❌ Blocked |
| **identity** | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |

### Key Fail-Closed Rules by Category

**ALERT_DESTINATION - Fail Closed:**
- MUST be verified in `ops/PROVIDER-REGISTRY.md` or `secrets/*.json` or explicit Ahmad approval
- DERIVED is blocked - we cannot infer alert destinations
- ASSUMED is blocked - we cannot guess alert destinations
- UNKNOWN triggers escalation to Ahmad for explicit verification

**CREDENTIAL - Fail Closed:**
- MUST come directly from `secrets/*.json` with exact path and line citation
- DERIVED is blocked - we cannot infer what credentials exist
- ASSUMED is blocked - we cannot guess credentials
- UNKNOWN triggers "credential not found" error, halts operation

**APPROVAL - Fail Closed:**
- MUST be explicit Ahmad reply in WhatsApp session
- DERIVED is blocked - "he seemed to approve" is not approval
- ASSUMED is blocked - "I think this is what he meant" is not approval
- UNKNOWN triggers "approval not confirmed" error, no execution

**RECOVERY_ACTION - Fail Closed:**
- MUST match a pre-approved action in the WATCHDOG-RECOVERY-APPROVAL-FLOW.md command whitelist
- DERIVED requires additional verification of surrounding state
- ASSUMED is blocked - we cannot propose unapproved recovery actions
- UNKNOWN triggers escalation to Ahmad with "recommended action unknown"

---

## 7. RUNTIME CLASSIFICATION FLOW

### Fact Lifecycle

```
Fact enters Moosa's processing (from any source)
  │
  ├─→ EEL_GATE (Epistemic Enforcement Layer)
  │     │
  │     ├─→ Is this fact operationally sensitive? (category check)
  │     │     │
  │     │     ├─ NO  → Allow with INFORMATIONAL classification
  │     │     │         → Output with prefix [VERIFIED/INFERRED/ASSUMPTION/UNKNOWN]
  │     │     │
  │     │     └─ YES → Proceed to classification
  │     │           │
  │     │           ├─→ VERIFIED?
  │     │           │     └─→ Has provenance? (file/line, command, API, DB, process)
  │     │           │           ├─ YES → PASS - allow with [VERIFIED FACT] prefix
  │     │           │           └─ NO  → Escalate to DERIVED check
  │     │           │
  │     │           ├─→ DERIVED?
  │     │           │     └─→ Can be traced to VERIFIED source chain?
  │     │           │           ├─ YES → Allow with [DERIVED] prefix + provenance
  │     │           │           └─ NO  → Escalate to ASSUMED check
  │     │           │
  │     │           ├─→ ASSUMED?
  │     │           │     └─→ Has explicit acknowledgment prefix?
  │     │           │           ├─ YES → Allow with [ASSUMPTION] prefix (flag for review)
  │     │           │           └─ NO  → Treat as UNKNOWN
  │     │           │
  │     │           └─→ UNKNOWN (default for sensitive categories)
  │     │                 └─→ BLOCKED
  │     │                       ├─ Log to EEL audit trail
  │     │                       ├─ Return error to Moosa
  │     │                       ├─ If needed for pending operation → trigger escalation
  │     │                       └─ Do NOT release to output/execution
  │
  └─→ Moosa output/execution (only after EEL_GATE clearance)
```

### EEL Gate Classification Pseudocode

```javascript
async function eel_classify(fact, category, proposed_state, provenance) {
  // Step 1: Check if category requires strict enforcement
  const strict_categories = [
    'alert_destination', 'credential', 'approval',
    'recovery_action', 'account_id', 'billing', 'security'
  ];

  if (!strict_categories.includes(category)) {
    return { state: proposed_state, allowed: true, prefix: `[${proposed_state}]` };
  }

  // Step 2: Verify provenance based on claimed state
  switch (proposed_state) {
    case 'VERIFIED':
      if (!provenance || !provenance.source || !provenance.timestamp) {
        return { state: 'UNKNOWN', allowed: false,
                 error: 'VERIFIED claim without provenance - treated as UNKNOWN' };
      }
      if (!isAuthoritativeSource(provenance.source)) {
        return { state: 'UNKNOWN', allowed: false,
                 error: 'Source not in authority hierarchy' };
      }
      return { state: 'VERIFIED', allowed: true, prefix: '[VERIFIED FACT]' };

    case 'DERIVED':
      if (!provenance?.chain || provenance.chain.length < 2) {
        return { state: 'UNKNOWN', allowed: false,
                 error: 'DERIVED claim without inference chain - treated as UNKNOWN' };
      }
      if (strict_categories.includes(category)) {
        return { state: 'UNKNOWN', allowed: false,
                 error: `${category} cannot be DERIVED - must be VERIFIED` };
      }
      return { state: 'DERIVED', allowed: true, prefix: '[DERIVED]', provenance };

    case 'ASSUMED':
      if (!provenance?.acknowledgment) {
        return { state: 'UNKNOWN', allowed: false,
                 error: 'ASSUMED claim without explicit acknowledgment - treated as UNKNOWN' };
      }
      if (strict_categories.includes(category)) {
        return { state: 'UNKNOWN', allowed: false,
                 error: `${category} cannot be ASSUMED - must be VERIFIED` };
      }
      return { state: 'ASSUMED', allowed: true, prefix: '[ASSUMPTION]', flag: true };

    case 'UNKNOWN':
    default:
      return { state: 'UNKNOWN', allowed: false,
               error: `${category} is UNKNOWN and blocks operational use` };
  }
}

function isAuthoritativeSource(source) {
  const authorities = [
    /^secrets\//,           // secrets/*.json
    /^ops\//,               // ops/PROVIDER-REGISTRY.md, etc.
    /state\//,              // state/heartbeats/*.json
    /^pm2 /,               // command output
    /^curl /,              // HTTP command
    /^supabase /,          // database query
  ];
  return authorities.some(a => source.match(a));
}
```

---

## 8. FAIL-CLOSED BEHAVIOR

### What "Fail Closed" Means

For operationally sensitive categories:

```
BLOCKED = The fact CANNOT escape to output, execution, or documentation.
          It is quarantined in the EEL audit trail.
          Moosa receives an error explaining why.
          The operation that needed the fact is HALTED.
```

### Fail-Closed Decision Table

| Category | VERIFIED | DERIVED | ASSUMED | UNKNOWN |
|----------|----------|---------|---------|---------|
| **alert_destination** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **credential** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **approval** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **recovery_action** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **account_id** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **billing** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **command** (future) | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **provider** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |
| **security** | ✅ PASS | ⚠️ WARN | ❌ BLOCK | ❌ BLOCK |
| **infrastructure_state** | ✅ PASS | ⚠️ WARN | ⚠️ WARN | ❌ BLOCK |
| **process_state** | ✅ PASS | ⚠️ WARN | ⚠️ WARN | ❌ BLOCK |
| **identity** | ✅ PASS | ❌ BLOCK | ❌ BLOCK | ❌ BLOCK |

**Note:** DERIVED is BLOCKED for all execution-sensitive categories (alert_destination, credential, approval, recovery_action, account_id, billing, command, provider, identity). This is because inference can be wrong, and execution-sensitive actions require direct verification.

### What Happens When Blocked

```
When EEL blocks a sensitive fact:
1. The fact is logged to eel_audit_log with:
   - exact fact content
   - claimed state
   - classification decision
   - blocking reason
   - Moosa's session/context

2. Moosa receives an EELError:
   EELError: [BLOCKED] alert_destination UNKNOWN - cannot use unverified alert destination
     at eel_classify (eel-gate.js:142)
     fact: "ahmad@salim.pk"
     category: alert_destination
     blocked_reason: "No provenance - destination not in PROVIDER-REGISTRY or secrets"
     resolution: "Verify against ops/PROVIDER-REGISTRY.md or get explicit Ahmad approval"

3. The operation requiring the fact is HALTED:
   - If in planning phase: Moosa reports BLOCKED status to Ahmad
   - If in execution phase: Execution pauses, awaiting resolution

4. Ahmad is NOT automatically notified - Moosa decides when to escalate
   (EEL blocks are expected runtime events, not all need Ahmad attention)
```

### What Happens When Warning

```
When EEL warns on a DERIVED fact in sensitive category:
1. The fact is logged with WARNING flag
2. Moosa receives warning but operation continues
3. Output includes [DERIVED] prefix with provenance chain
4. Moosa should attempt to VERIFY the fact before using for critical decisions
```

---

## 9. UNKNOWN HANDLING RULES

### UNKNOWN Is a Valid and Safe System State

**Critical principle:** UNKNOWN is not a failure. It is an honest state.

Failing to admit UNKNOWN is worse than being UNKNOWN, because:
- Fabricating facts is more dangerous than admitting uncertainty
- Hiding UNKNOWN creates false confidence in decisions
- Explicit UNKNOWN enables targeted verification effort

### UNKNOWN Handling Rules

| Scenario | Required Behavior |
|----------|-------------------|
| UNKNOWN fact needed for operation | **HALT** operation, report UNKNOWN status to Moosa |
| Moosa encounters UNKNOWN during planning | Report UNKNOWN to Ahmad with "needed to verify" |
| UNKNOWN fact is informational only | Log and continue with [UNKNOWN] prefix |
| Ahmad explicitly approves despite UNKNOWN | Elevate to ASSUMED with explicit acknowledgment |
| EEL blocks UNKNOWN fact | Return EELError, do not fabricate to resolve |

### How Moosa Should Respond to UNKNOWN

```
CORRECT:
  "I do not have verified information about the Neo SMTP credentials.
   I need to read secrets/qiyadon-email.json to proceed.
   [UNKNOWN] credential - operation blocked."

WRONG:
  "The credentials are probably in neo.json based on standard naming"
  → Fabricating to avoid UNKNOWN status is a governance violation
```

### Escalation Triggers for UNKNOWN

Moosa must escalate UNKNOWN to Ahmad when:
1. UNKNOWN fact blocks a required operation with no workaround
2. UNKNOWN fact relates to safety, security, or authorization
3. UNKNOWN fact persists despite multiple verification attempts
4. Ahmad explicitly asked for the fact

---

## 10. ALLOWED VS PROHIBITED INFERENCE BOUNDARIES

### Allowed Inferences

These are permitted as DERIVED (with VERIFIED provenance chain):

```
✓ From pm2 list output → moosa-worker is online (VERIFIED → DERIVED)
✓ From worker.json age < 10min → worker heartbeat is fresh (VERIFIED → DERIVED)
✓ From HTTP 200 response → API endpoint is reachable (VERIFIED → DERIVED)
✓ From tasks table having row with id → task exists (VERIFIED → DERIVED)
✓ From dispatch.lifecycle_state = completed → dispatch finished (VERIFIED → DERIVED)
```

### Prohibited Inferences

These must be treated as ASSUMED or escalated to UNKNOWN:

```
✗ From "dashboard shows X" → "X is the current value" (dashboard could be stale)
✗ From "worked last week" → "still works now" (state could have changed)
✗ From "same pattern as Y" → "X works the same way" (different contexts)
✗ From "user didn't object" → "user approved" (approval requires explicit confirmation)
✗ From "no error thrown" → "execution was successful" (silent failures exist)
✗ From "file exists" → "file contents are correct" (file could be corrupted)
✗ From "provider is standard" → "I know what credentials to use" (never assume)
✗ From "email sent" → "email was delivered" (delivery not confirmed without receipt)
```

### Boundary Examples

**Scenario:** Moosa needs to send an email alert
```
ALLOWED inference path:
  [VERIFIED] qiyadon-email.json exists at /home/node/.openclaw/workspace/secrets/
  [VERIFIED] qiyadon-email.json contains smtp settings (file read, 2026-05-15T20:00Z)
  [DERIVED] smtp settings are current (based on recent file modification)
  [VERIFIED] ahmad.salim@qiyadon.com is in EMAIL-SIGNATURES.md (file read)

PROHIBITED inference path:
  "I know contact@qiyadon.com is the right address for alerts"
  → NOT VERIFIED, NOT cited, cannot use
```

---

## 11. APPROVAL ESCALATION BEHAVIOR

### Approval Classification

```
VERIFIED APPROVAL:
  Ahmad's explicit WhatsApp reply matches an approved recovery action
  Provenance: WhatsApp message_id, exact text, timestamp
  State: VERIFIED - permitted for execution

ASSUMED APPROVAL (NOT PERMITTED):
  Moosa interprets Ahmad's behavior as implicit approval
  "He reviewed it for 2 minutes, that's approval"
  → BLOCKED - cannot execute without explicit verification

UNKNOWN APPROVAL:
  No clear approval received, or approval is ambiguous
  → BLOCKED - must request explicit confirmation
```

### Escalation Flow for UNKNOWN Approval

```
1. Moosa proposes recovery action to Ahmad
2. Ahmad does not reply within expected window
   → Moosa reports: "[UNKNOWN] approval status - waiting for Ahmad response"
3. Ahmad replies with unclear indication
   → Moosa reports: "[UNKNOWN] approval unclear - please confirm 'approved' or 'denied'"
4. Ahmad approves explicitly
   → VERIFIED - proceed with execution
5. Ahmad denies
   → Log denial, do not execute, continue monitoring
```

### Approval Command Matching

```
Approved command whitelist (from WATCHDOG-RECOVERY-APPROVAL-FLOW.md):
  "pm2 stop moosa-worker && pm2 start ecosystem.config.cjs"
  "pm2 restart moosa-worker"
  "pm2 restart openclaw-gateway"
  "pm2 restart cloudflared-tunnel"
  "pm2 restart moosa-watchdog"

Ahmad says: "approved"
  → Moosa executes the recommended action from the alert

Ahmad says: "approved: pm2 restart moosa-worker"
  → Moosa executes ONLY this command (must match whitelist)

Ahmad says: "approved: pkill -9 922274"
  → BLOCKED - command not in whitelist, protected process doctrine
  → Moosa responds: "Cannot execute 'pkill -9 922274' - not in approved whitelist.
     Only pm2-safe commands are permitted. Recommended: 'pm2 restart moosa-worker'"
```

---

## 12. INTEGRATION WITH WATCHDOG, WORKER, DISPATCH LIFECYCLE, AND RECOVERY

### Integration Points

```
┌──────────────────────────────────────────────────────────────────┐
│                     EPISTEMIC ENFORCEMENT LAYER                   │
│                                                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────────────┐ │
│  │   WATCHDOG  │   │   WORKER     │   │    RECOVERY EXECUTION  │ │
│  │  (moosa-    │   │  (moosa-     │   │    (Moosa after        │ │
│  │   watchdog) │   │   worker)    │   │    Ahmad approval)    │ │
│  └──────┬──────┘   └──────┬──────┘   └───────────┬────────────┘ │
│         │                 │                      │               │
│         └────────────┬────┴──────────────────────┘               │
│                      │                                          │
│               EEL_GATE CHECK                                     │
│               before alert sent                                  │
│               before command executed                            │
│               before approval assumed                            │
│                      │                                          │
│                      ▼                                          │
│         ┌─────────────────────────────┐                          │
│         │   FACT CLASSIFICATION +    │                          │
│         │   PROVENANCE VERIFICATION   │                          │
│         └─────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

### Watchdog Integration

**Before watchdog sends an alert:**
```
1. Watchdog detects 2+ consecutive failures
2. EEL_GATE checks:
   - alert_destination (ahmad.salim@qiyadon.com) → VERIFIED from EMAIL-SIGNATURES.md?
   - If YES → proceed with alert
   - If NO → BLOCK alert, report UNKNOWN destination
3. EEL_GATE checks:
   - recommended_recovery_action → in approved whitelist?
   - If YES → proceed with alert
   - If NO → BLOCK alert, report UNKNOWN action
4. Alert sent only after EEL clearance
```

### Worker Integration

**Before worker marks task as completed:**
```
1. Worker executes run_self_check_and_decide handler
2. EEL_GATE checks:
   - dispatch.lifecycle_state update → VERIFIED from database?
   - If YES → proceed with completion
   - If NO → BLOCK completion, report UNKNOWN dispatch state
3. EEL_GATE checks:
   - task.output_json → all facts in output_json VERIFIED?
   - If YES → proceed
   - If NO → flag DERIVED items with [DERIVED] prefix
```

### Recovery Execution Integration

**Before Moosa executes approved recovery:**
```
1. Ahmad approves: "approved"
2. EEL_GATE checks:
   - approval source → VERIFIED from WhatsApp session?
   - If NO → BLOCK, report UNKNOWN approval
3. EEL_GATE checks:
   - recovery_action → in command whitelist?
   - If NO → BLOCK, report BLOCKED action
4. EEL_GATE checks:
   - target_process → protected process doctrine?
   - If YES (e.g., pkill -9 node) → BLOCK, report PROTECTED
5. EEL_GATE checks:
   - rollback_command → exists and verified?
6. Execution proceeds only after all EEL checks pass
```

---

## 13. AUDIT LOGGING REQUIREMENTS

### EEL Audit Log Schema

```javascript
{
  id: uuid,                           // Unique audit entry ID
  timestamp: ISO8601,                // When classification occurred

  // Fact classification
  fact: string,                       // The factual claim
  category: string,                   // Fact category
  claimed_state: string,             // What Moosa claimed
  actual_state: string,              // What EEL determined
  allowed: boolean,                  // Whether fact was allowed to escape

  // Provenance
  provenance: { ... },                // Full provenance object (from Section 6)

  // Blocking details (if blocked)
  blocked_reason: string,            // Why it was blocked
  eel_error_code: string,            // EEL_ERROR_<CATEGORY>_<REASON>
  resolution_required: boolean,       // Whether this needs Ahmad resolution

  // Context
  source_module: 'watchdog' | 'worker' | 'moosa' | 'recovery_execution',
  session_id: string,                // Moosa session ID
  operation_id: string,              // Operation that needed this fact

  // Outcome
  resolution: 'pending_verification' | 'escalated_to_ahmad' |
              'fabrication_detected' | 'auto_resolved' | 'blocked_pending',
  resolved_by: 'ahmad' | 'moosa_verification' | 'eel_auto' | 'none',
  resolved_at: ISO8601,
}
```

### EEL Error Codes

| Error Code | Meaning |
|------------|---------|
| `EEL_DEST_UNVERIFIED` | alert_destination not verified in registry or secrets |
| `EEL_DEST_DERIVED` | alert_destination was DERIVED - not permitted |
| `EEL_CRED_UNVERIFIED` | credential not verified from secrets files |
| `EEL_CRED_DERIVED` | credential was DERIVED - not permitted |
| `EEL_APPROVAL_UNVERIFIED` | approval not VERIFIED from explicit Ahmad message |
| `EEL_APPROVAL_ASSUMED` | approval was ASSUMED from implicit indication |
| `EEL_ACTION_UNVERIFIED` | recovery action not in approved whitelist |
| `EEL_ACTION_DERIVED` | recovery action was DERIVED - must be VERIFIED |
| `EEL_COMMAND_UNVERIFIED` | command not verified as safe |
| `EEL_PROVIDER_UNAPPROVED` | provider not in PROVIDER-REGISTRY.md |
| `EEL_UNKNOWN_BLOCKED` | fact is UNKNOWN and blocks operation |
| `EEL_PROTECTED_PROCESS` | command targets protected process |

### Audit Log Access

- All EEL audit entries go to Supabase `eel_audit_log` table
- Append-only - no deletions or modifications
- Ahmad can query at any time for accountability
- Moosa can read to understand classification decisions

---

## 14. EXAMPLES OF CORRECT BEHAVIOR

### Example 1: Verified Alert Destination

```
INPUT:  Moosa needs to send watchdog alert to Ahmad
ANALYSIS:
  Fact: alert destination = ahmad.salim@qiyadon.com
  Category: alert_destination
  Claimed state: VERIFIED

EEL CHECK:
  Provenance: EMAIL-SIGNATURES.md (file path: strateon/business/EMAIL-SIGNATURES.md)
  Verification: File read at 2026-05-15T20:00:00Z - ahmad.salim@qiyadon.com confirmed
  Source authority: VERIFIED from explicit workspace file

RESULT: [VERIFIED FACT] - alert destination confirmed
OUTPUT: Alert proceeds to ahmad.salim@qiyadon.com via Neo SMTP
```

### Example 2: Derived Process State

```
INPUT:  Worker needs to check if moosa-worker is alive
ANALYSIS:
  Fact: moosa-worker is actively polling
  Category: process_state
  Claimed state: DERIVED

EEL CHECK:
  Chain:
    - VERIFIED: worker.json heartbeat age = 8s (file read, 2026-05-15T20:38:00Z)
    - VERIFIED: heartbeat threshold = 600s (watchdog.js:41)
    - RULE: 8s < 600s → worker is alive
  All chain elements VERIFIED from authoritative sources

RESULT: [DERIVED] - worker is alive with 8s heartbeat
OUTPUT: State reported as DERIVED with full provenance chain
```

### Example 3: Blocked Unknown Credential

```
INPUT:  Moosa needs SMTP password for email fallback
ANALYSIS:
  Fact: SMTP password = "mysecretpassword"
  Category: credential
  Claimed state: VERIFIED (but no provenance)

EEL CHECK:
  Provenance: NONE - no file cited, no command run
  Source authority: NONE - cannot verify without source

RESULT: [BLOCKED] EEL_CRED_UNVERIFIED - credential not verified
OUTPUT: EELError returned to Moosa
  "Cannot use unverified credential.
   Verify by reading: secrets/qiyadon-email.json
   Provenance required: file path + line number"
```

### Example 4: Explicit Acknowledgment for Assumed Fact

```
INPUT:  Moosa reports on potential watchdog issue
ANALYSIS:
  Fact: [ASSUMPTION] watchdog may require gateway to be online for WhatsApp
  Category: infrastructure_state
  Claimed state: ASSUMED

EEL_CHECK:
  Acknowledgment: "I have not verified this - my understanding of OpenClaw architecture
                   suggests gateway is required, but I cannot confirm with evidence"
  State: ASSUMED - explicit acknowledgment present

RESULT: [ASSUMPTION] - flagged for review, operation continues with warning
OUTPUT: Statement includes [ASSUMPTION] prefix, not used for critical decisions
```

### Example 5: Explicit Ahmad Approval

```
INPUT:  Ahmad replies "approved" to watchdog alert
ANALYSIS:
  Fact: Ahmad has approved recovery action
  Category: approval
  Claimed state: VERIFIED

EEL_CHECK:
  Provenance:
    - WhatsApp message_id: 3EB08B0712C9ECD20B9F55
    - Timestamp: 2026-05-15T20:40:00.000Z
    - Exact text: "approved"
    - Source: OpenClaw WhatsApp session (verified message receipt)
  State: VERIFIED - explicit confirmation from Ahmad

RESULT: [VERIFIED FACT] - approval confirmed
OUTPUT: Recovery execution proceeds
```

---

## 15. EXAMPLES OF BLOCKED BEHAVIOR

### Blocked Example 1: Invented Alert Destination

```
INPUT:  Moosa writes watchdog design
  Fact: "Alert will be sent to ahmad@salim.pk"
  Category: alert_destination
  Claimed state: VERIFIED

EEL_CHECK:
  Provenance: "I inferred this from email patterns" - NOT an authoritative source
  Verification: FAILED - ahmad@salim.pk NOT in PROVIDER-REGISTRY or secrets

RESULT: [BLOCKED] EEL_DEST_UNVERIFIED
OUTPUT:
  EELError: alert_destination not verified
    fact: "ahmad@salim.pk"
    blocked_reason: "Destination not in ops/PROVIDER-REGISTRY.md or secrets/*.json"
    resolution: "Verify against approved sources or get explicit Ahmad approval"
    required_destination: "ahmad.salim@qiyadon.com (from EMAIL-SIGNATURES.md)"
```

### Blocked Example 2: Assumed Approval

```
INPUT:  Moosa sees Ahmad reviewed alert design for 3 minutes
  Fact: "Ahmad has approved the alert design"
  Category: approval
  Claimed state: VERIFIED

EEL_CHECK:
  Provenance: WhatsApp history shows Ahmad opened messages at 20:35
              No message with "approved" or similar
  Source: NOT authoritative - reading behavior is not approval

RESULT: [BLOCKED] EEL_APPROVAL_ASSUMED
OUTPUT:
  EELError: Approval not verified
    fact: "Ahmad has approved"
    blocked_reason: "No explicit approval message found in WhatsApp session"
    resolution: "Request explicit 'approved' or 'denied' from Ahmad"
```

### Blocked Example 3: Derived Alert Destination

```
INPUT:  Moosa knows alert should go to Ahmad's work email
  Fact: "Ahmad's work email is ahmad.salim@qiyadon.com"
  Category: alert_destination
  Claimed state: DERIVED

EEL_CHECK:
  Chain:
    - "Email-SIGNATURES.md mentions ahmad.salim@qiyadon.com as signature"
    - "I inferred this is his work email"
  Problem: alert_destination cannot be DERIVED for sensitive category

RESULT: [BLOCKED] EEL_DEST_DERIVED
OUTPUT:
  EELError: alert_destination cannot be DERIVED
    category_rule: "alert_destination must be VERIFIED, not derived"
```

### Blocked Example 4: Unverified Provider

```
INPUT:  Moosa proposes using Zoho CRM for a new integration
  Fact: "Zoho is an approved provider"
  Category: provider
  Claimed state: VERIFIED

EEL_CHECK:
  Provenance: "I found Zoho in a tech blog post"
  Verification: FAILED - Zoho not in ops/PROVIDER-REGISTRY.md

RESULT: [BLOCKED] EEL_PROVIDER_UNAPPROVED
OUTPUT:
  EELError: Provider not in approved registry
    provider: "Zoho"
    blocked_reason: "Zoho not in ops/PROVIDER-REGISTRY.md"
    resolution: "Request Ahmad to add Zoho to PROVIDER-REGISTRY.md before use"
```

### Blocked Example 5: Protected Command

```
INPUT:  Ahmad approves "pkill -9 922274" thinking it's safe
  Fact: "pkill -9 922274 is approved recovery action"
  Category: recovery_action
  Claimed state: VERIFIED (from Ahmad approval)

EEL_CHECK:
  Command: "pkill -9 922274"
  Protected process doctrine: PID 922274 is moosa-worker — pkill -9 kills ALL node processes
  Whitelist: "pkill -9" NOT in approved command whitelist
  Source: Ahmad approval present but command violates protected process doctrine

RESULT: [BLOCKED] EEL_PROTECTED_PROCESS
OUTPUT:
  EELError: Command violates protected process doctrine
    command: "pkill -9 922274"
    blocked_reason: "pkill -9 node kills ALL node processes including gateway"
    alternative: "pm2 stop moosa-worker && pm2 start ecosystem.config.cjs"
    resolution: "Request Ahmad approve safe pm2 command instead"
```

### Blocked Example 6: Email Address Found in Non-Authority File

```
INPUT:  Moosa needs alert destination for watchdog
  Fact: "Alert destination: ahmad.salim@qiyadon.com"
  Category: alert_destination
  Claimed state: VERIFIED
  Source cited: EMAIL-SIGNATURES.md

EEL_CHECK:
  Source: EMAIL-SIGNATURES.md
  Registry lookup: EMAIL-SIGNATURES.md is NOT in AUTHORITY_REGISTRY for alert_destination
  Authority scope: EMAIL-SIGNATURES.md.categories = [] (evidence only)
  Verification: FAILED — EMAIL-SIGNATURES.md is not an authority source

RESULT: [BLOCKED] EEL_SOURCE_NOT_AUTHORITY
OUTPUT:
  EELError: Source EMAIL-SIGNATURES.md is not an authority for alert_destination
    fact: "ahmad.salim@qiyadon.com"
    source: EMAIL-SIGNATURES.md
    blocked_reason: "EMAIL-SIGNATURES.md is EVIDENCE ONLY — not registered as authority
                     for any operational category. Email signatures document preferred
                     From addresses for customer emails, not approved alert targets."
    resolution: "Verify against ops/ALERT-DESTINATION-REGISTRY.md or get explicit 
                 Ahmad approval for this specific alert destination"
    note: "ahmad.salim@qiyadon.com may appear in EMAIL-SIGNATURES.md as evidence,
           but is NOT AUTHORIZED for operational alert use until registered"
```

### Blocked Example 7: Approval Phrase Found Outside Approval Channel

```
INPUT:  Moosa searches log files for approval history
  Fact: "Ahmad approved the recovery action"
  Claimed source: Log file showing "From: Ahmad — approved recovery"
  Category: approval
  Claimed state: VERIFIED

EEL_CHECK:
  Source: moosa-worker-error.log (a .log file)
  Registry lookup: .log files are NOT in AUTHORITY_REGISTRY (evidence only)
  Authority: NONE — log files record history, they don't authorize actions

RESULT: [BLOCKED] EEL_SOURCE_NOT_AUTHORITY
OUTPUT:
  EELError: Log files are not authority for approvals
    fact: "Ahmad has approved"
    source: moosa-worker-error.log
    blocked_reason: "Historical log entries are EVIDENCE of past messages,
                     not AUTHORITY for current approvals. Approval must come
                     from real-time WhatsApp session with Ahmad."
    resolution: "Obtain explicit approval from Ahmad via WhatsApp for current action"
```

### Blocked Example 8: Provider Found in Notes But Absent from Registry

```
INPUT:  Moosa finds "Zoho" mentioned in a project notes file
  Fact: "Zoho is an approved provider"
  Category: provider
  Claimed state: VERIFIED
  Source cited: strateon/business/project-notes.md

EEL_CHECK:
  Source: strateon/business/project-notes.md
  Authority registry: project-notes.md is NOT in AUTHORITY_REGISTRY
  Provider registry check: Zoho is NOT in ops/PROVIDER-REGISTRY.md

RESULT: [BLOCKED] EEL_PROVIDER_UNAPPROVED
OUTPUT:
  EELError: Provider not in approved registry
    provider: "Zoho"
    source: strateon/business/project-notes.md
    blocked_reason: "Mentioning a provider in notes does not make it approved.
                     Provider must be in ops/PROVIDER-REGISTRY.md"
    resolution: "Request Ahmad to add Zoho to PROVIDER-REGISTRY.md before use"
```

### Blocked Example 9: Destination Inferred from Domain

```
INPUT:  Moosa knows Qiyadon's domain is qiyadon.com
  Fact: "Alert destination is likely alerts@qiyadon.com"
  Category: alert_destination
  Claimed state: DERIVED

EEL_CHECK:
  State: DERIVED
  Category: alert_destination
  Rule: "DERIVED Cannot Authorize Execution-Sensitive Actions"

RESULT: [BLOCKED] EEL_DEST_DERIVED
OUTPUT:
  EELError: alert_destination cannot be DERIVED
    fact: "alerts@qiyadon.com"
    state: DERIVED
    blocked_reason: "alert_destination is execution-sensitive — cannot be inferred
                     from domain patterns. Must be VERIFIED from explicit source."
    resolution: "Register alerts@qiyadon.com in ops/ALERT-DESTINATION-REGISTRY.md
                 or obtain explicit Ahmad approval"
```

### Blocked Example 10: Runtime State Used to Authorize Future Action

```
INPUT:  pm2 list showed moosa-worker was online 10 minutes ago
  Fact: "Worker was healthy 10 minutes ago, so recovery is not needed now"
  Category: infrastructure_state
  Claimed state: VERIFIED

EEL_CHECK:
  Source: pm2 list (runtime command)
  Temporal constraint: runtime commands are "current" only
  Fact age: 10 minutes = 600 seconds > 60 second threshold

RESULT: [BLOCKED] EEL_FACT_EXPIRED
OUTPUT:
  EELError: Runtime command result has expired
    fact: "worker was online 10 minutes ago"
    source: pm2 list (executed at T-10min)
    blocked_reason: "Runtime commands verify state only at execution time.
                     State from 10 minutes ago cannot authorize current decisions.
                     Worker may have crashed in the interim."
    resolution: "Re-run pm2 list to get current state, then re-evaluate"
```

### Blocked Example 11: Credential Assumed from Filename

```
INPUT:  Moosa assumes Neo SMTP credentials are in neo.json
  Fact: "Neo SMTP credentials are in secrets/neo.json"
  Category: credential
  Claimed state: ASSUMED (acknowledged)

EEL_CHECK:
  State: ASSUMED
  Category: credential
  Rule: "credentials cannot be ASSUMED"

RESULT: [BLOCKED] EEL_CRED_ASSUMED
OUTPUT:
  EELError: credential cannot be ASSUMED
    fact: "Neo SMTP credentials in neo.json"
    state: ASSUMED
    blocked_reason: "Credential cannot be assumed — must be VERIFIED from source.
                     Even with explicit acknowledgment, credentials cannot be
                     ASSUMED — they must be read directly from the actual file."
    resolution: "Read the actual file and cite exact path + line"
```

---

## 15. EXAMPLES OF SAFE (VERIFIED) BEHAVIOR

### Safe Example 1: Alert Destination from Alert-Destination-Registry

```
INPUT:  Watchdog needs alert destination
  Fact: "Alert destination: ahmad.salim@qiyadon.com"
  Category: alert_destination
  Claimed state: VERIFIED
  Source: ops/ALERT-DESTINATION-REGISTRY.md

EEL_CHECK:
  Source: ops/ALERT-DESTINATION-REGISTRY.md
  Authority registry: ALERT-DESTINATION-REGISTRY.md is registered authority for alert_destination
  Category check: alert_destination IS in scope for this authority
  Fact verified: ahmad.salim@qiyadon.com appears in approved list

RESULT: [VERIFIED FACT] ✅
  source: ops/ALERT-DESTINATION-REGISTRY.md
  path: /home/node/.openclaw/workspace/ops/ALERT-DESTINATION-REGISTRY.md:3
  timestamp: 2026-05-15T20:00:00.000Z
  raw: "ahmad.salim@qiyadon.com       # PRIMARY — approved 2026-05-15"
OUTPUT: Alert proceeds
```

### Safe Example 2: Credential from Secrets File

```
INPUT:  Moosa needs SMTP password for email fallback
  Fact: "Neo SMTP password is [REDACTED]"
  Category: credential
  Claimed state: VERIFIED
  Source: secrets/qiyadon-email.json

EEL_CHECK:
  Source: secrets/qiyadon-email.json
  Authority registry: secrets/*.json is registered authority for credential
  Category check: credential IS in scope
  Fact verified: password field read directly from file

RESULT: [VERIFIED FACT] ✅
  source: secrets/qiyadon-email.json
  path: /home/node/.openclaw/workspace/secrets/qiyadon-email.json:3
  timestamp: 2026-05-15T20:00:00.000Z
  raw: "password": "***"  (value verified, redacted in output)
OUTPUT: Credential available for use
```

### Safe Example 3: Provider from Provider Registry

```
INPUT:  Moosa needs to verify Neo is approved for email
  Fact: "Neo (byONTICS) is an approved email provider"
  Category: provider
  Claimed state: VERIFIED
  Source: ops/PROVIDER-REGISTRY.md

EEL_CHECK:
  Source: ops/PROVIDER-REGISTRY.md
  Authority registry: PROVIDER-REGISTRY.md is registered authority for provider
  Category check: provider IS in scope
  Fact verified: Neo listed with email/SMTP capability

RESULT: [VERIFIED FACT] ✅
  source: ops/PROVIDER-REGISTRY.md
  path: /home/node/.openclaw/workspace/ops/PROVIDER-REGISTRY.md:12
  timestamp: 2026-05-15T20:00:00.000Z
  raw: "Neo (byONTICS) — email/SMTP — contact@qiyadon.com"
OUTPUT: Provider confirmed as approved
```

---

## 16. NON-GOALS

The EEL is NOT designed to:

1. **Block all uncertainty** - INFORMATIONAL facts with ASSUMED/UNKNOWN state are allowed when they don't drive execution
2. **Replace human judgment** - EEL enforces truth classification, not decision-making
3. **Eliminate all inference** - DERIVED with full provenance chain is permitted for logical deductions
4. **Prevent Ahmad from overriding** - Ahmad can explicitly approve UNKNOWN facts (elevates to ASSUMED with acknowledgment)
5. **Retroactively fix past violations** - EEL is forward-looking; existing violations in files must be corrected manually
6. **Replace Provider Registry** - EEL enforces that providers are in the registry, but the registry itself must be maintained by humans
7. **Validate code correctness** - EEL classifies facts, not code logic or algorithmic correctness
8. **Guarantee data freshness** - EEL verifies provenance but cannot prevent external systems from returning stale data

---

## 17. IMPLEMENTATION PHASES

### Phase E1: EEL Core Infrastructure (Week 1)
**Goal:** Build the enforcement gate with truth classification and provenance tracking

Changes:
- Create `eel-gate.js` - the classification engine
- Define fact schema and provenance model
- Implement classification flow (VERIFIED → DERIVED → ASSUMED → UNKNOWN)
- Implement fail-closed behavior for sensitive categories
- Create `eel_audit_log` Supabase table

Not changed:
- Moosa output (yet)
- Worker logic
- Watchdog logic

Validation:
- Unit tests: verify classification of known fact patterns
- Integration test: EEL correctly blocks unverified credentials

### Phase E2: Moosa Output Integration (Week 2)
**Goal:** Route all sensitive Moosa outputs through EEL before delivery

Changes:
- Add EEL classification call to Moosa's output layer
- Integrate prefix enforcement ([VERIFIED FACT], [DERIVED], [ASSUMPTION], [UNKNOWN])
- Block output for UNKNOWN sensitive facts
- Update SOUL.md to reflect EEL enforcement

Not changed:
- Worker logic
- Watchdog logic

Validation:
- Test: Moosa's prior "ahmad@salim.pk" claim is now blocked
- Test: Verified facts pass through with correct prefix
- Test: Assumed facts require explicit acknowledgment

### Phase E3: Watchdog Integration (Week 2-3)
**Goal:** Watchdog alert path goes through EEL before sending

Changes:
- Add EEL classification to watchdog alert generation
- Verify alert_destination against EMAIL-SIGNATURES.md before sending
- Verify recovery_action against whitelist before including in alert
- Update WATCHDOG-RECOVERY-APPROVAL-FLOW.md with EEL enforcement

Not changed:
- Worker logic
- Moosa approval processing

Validation:
- Test: Watchdog sends alert with verified ahmad.salim@qiyadon.com
- Test: Watchdog blocked from using unverified destination
- Test: Alert includes correct [VERIFIED FACT] provenance

### Phase E4: Recovery Execution Integration (Week 3)
**Goal:** All recovery commands go through EEL before execution

Changes:
- EEL check on approval verification (explicit Ahmad message?)
- EEL check on recovery_action (in whitelist?)
- EEL check on command (protected process doctrine?)
- Command execution only after all EEL checks pass

Not changed:
- Worker logic
- Watchdog logic

Validation:
- Test: "approved" → recovery executes
- Test: Assumed approval → blocked
- Test: pkill -9 command → blocked with explanation

### Phase E5: Continuous Audit and Reporting (Week 3-4)
**Goal:** Ahmad can query EEL audit trail and see classification statistics

Changes:
- Dashboard for EEL audit statistics
- Alert summary for UNKNOWN/ASSUMED facts per week
- Top blocked fact categories
- EEL health metrics

Validation:
- Ahmad can query audit log
- Weekly report generated automatically

---

## 18. VALIDATION PLAN FOR THE DESIGN

### Design Self-Validation Checklist

Before implementation, the design must pass:

- [ ] **Completeness:** Does every sensitive category have defined fail-closed behavior?
- [ ] **Provenance completeness:** Can every truth state requirement be met with actual workspace evidence?
- [ ] **No circular reasoning:** VERIFIED sources don't themselves depend on ASSUMED/UNKNOWN facts
- [ ] **Authority hierarchy:** Can we definitively say which sources are authoritative?
- [ ] **Blocking granularity:** Is the distinction between BLOCK and WARN clear enough to implement?
- [ ] **Integration points:** Do the EEL integration points with watchdog/worker/recovery cover all escape paths?
- [ ] **Audit completeness:** Can we reconstruct any classification decision from the audit log?
- [ ] **Non-goals verified:** Do the non-goals accurately describe what's out of scope?

### Cross-Reference with AGENTS.md Truth Prefixes

The current AGENTS.md already defines truth classification prefixes. EEL must be compatible:

```
Current AGENTS.md:
[VERIFIED FACT] - confirmed by file/line, command, API, DB, or process
[INFERRED] - derived from available evidence, logical extension
[ASSUMPTION] - stated as unverified, acknowledged as unknown
[UNKNOWN] - cannot determine, explicitly flagged, no speculation

EEL aligns with this:
- [VERIFIED FACT] → VERIFIED, with mandatory provenance
- [INFERRED] → DERIVED, with mandatory provenance chain
- [ASSUMPTION] → ASSUMED, with mandatory explicit acknowledgment
- [UNKNOWN] → UNKNOWN, blocked from operational use

The difference: AGENTS.md prefixes are voluntary self-assessment.
EEL enforces them as mandatory runtime gates.
```

### Validation Questions

| Question | Evidence Needed |
|----------|-----------------|
| Can EEL distinguish VERIFIED from ASSUMED in a real Moosa output? | Test with fabricated vs verified credential |
| Does fail-closed actually halt execution? | Test with UNKNOWN alert_destination |
| Does EEL integrate without circular dependency? | EEL must not need worker/alert to verify facts about them |
| Is provenance chain enforceable? | Can we trace any DERIVED fact back to VERIFIED source? |
| Does audit log capture enough to reconstruct decisions? | Audit entry has all provenance fields |
| Does EEL itself maintain truth classification? | EEL's own code must not fabricate facts |

### Pre-Implementation Review

Before coding Phase E1, the design must be reviewed by:

1. **Ahmad** - approves the truth-state definitions and authority hierarchy
2. **Self** - passes EEL's own classification (can we describe EEL's fact sources without fabricating?)
3. **Cross-reference** - existing workspace facts checked against EEL rules to verify no conflicts

---

## SUMMARY

The Epistemic Enforcement Layer (EEL) is a runtime governance architecture that:

1. **Classifies** every operationally sensitive fact before it escapes Moosa's output
2. **Enforces** mandatory provenance for VERIFIED and DERIVED states
3. **Requires** explicit acknowledgment for ASSUMED state
4. **Blocks** UNKNOWN state for sensitive categories (fail-closed)
5. **Logs** every classification decision to an immutable audit trail
6. **Integrates** with watchdog, worker, and recovery execution paths
7. **Preserves** the truth classification prefixes already in AGENTS.md

The EEL treats UNKNOWN as a valid and safe system state - not a failure to be hidden. Fabricating facts to avoid UNKNOWN is a more serious governance failure than being UNKNOWN.

**Core principle:** "It is integrity to say 'I don't know.' It is failure to say 'I know' when you don't."

---

*Design complete. Ready for Ahmad review and approval to proceed with Phase E1 implementation.*