# INSTRUCTION SIDECAR SHADOW — VALIDATION PROTOCOL
## Controlled Validation Only — No Production Promotion

**Status:** EXECUTABLE — Validation In Progress
**Date:** 2026-05-15
**Mode:** SHADOW (observation-only — no execution authority)
**Approved by:** Ahmad Salim

---

## VALIDATION OBJECTIVES

| # | Objective | Success Criteria |
|---|-----------|-----------------|
| 1 | Deterministic capture | Every test message creates exactly 1 instruction row |
| 2 | Duplicate prevention | Same message_id sent twice → exactly 1 row created |
| 3 | Restart continuity | Sidecar restart → resumes capture within 30s, no message loss |
| 4 | No worker interference | Worker continues processing unaffected |
| 5 | No task creation | Zero tasks created during entire validation |
| 6 | No OpenClaw degradation | Gateway response time unchanged |
| 7 | No coding-sidecar interference | Sidecar has no interaction with coding sidecar |
| 8 | No MiniMax routing change | MiniMax model routing unchanged |
| 9 | Malformed-line resilience | Malformed JSONL line → skipped, sidecar continues |
| 10 | Session-rotation recovery | Session rotation → cursor resets, capture continues |

---

## FAILURE CLASSIFICATION TAXONOMY

| Class | Meaning | Required Action |
|-------|---------|----------------|
| **RECOVERABLE** | Sidecar recovers automatically; no data loss; validation continues | Log and continue |
| **SILENT-RISK** | Captured data may be incomplete or duplicated silently | Log + halt validation, escalate to Ahmad |
| **DUPLICATION-RISK** | Duplicate rows created or messages skipped | Log + halt validation, fix and re-validate |
| **CORRUPTION-RISK** | State machine broken, cursor corrupted, Supabase schema affected | EMERGENCY stop + rollback, escalate immediately |

---

## EVIDENCE COLLECTION COMMANDS

### Supabase Instructions (Primary Evidence)

```bash
# Get SUPABASE_SERVICE_KEY from moosa-worker env
pm2 env 0 | grep SUPABASE_SERVICE_KEY

# Evidence query — instruction rows created by sidecar
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,status,original_message,source_channel,received_at,metadata,state_transitions&order=created_at.desc&limit=10" | python3 -m json.tool

# Count instruction rows by status
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=status&eq.status=shadow_received&count=exact" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print('shadow_received count:', d.get('count', len(d)))"
```

### Supabase Tasks (No-Task-Creation Proof)

```bash
# Verify NO tasks created during validation
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/tasks?select=id,goal,status,created_at&order=created_at.desc&limit=10" | python3 -m json.tool
```

### PM2 Topology (Before/After Evidence)

```bash
# PM2 state before validation
pm2 jlist | python3 -c "import json,sys; p=json.load(sys.stdin); print(json.dumps([{'name':x['name'],'pid':x['pid'],'status':x['pm2_env']['status'],'uptime':x['pm2_env']['pm_uptime']} for x in p], indent=2))"

# Instruction-sidecar-shadow specific
pm2 list 2>&1 | grep -E "instruction-sidecar|moosa-worker|openclaw-gateway"
```

### Cursor File Evidence

```bash
# Cursor state at any point
cat /ops/sidecar-cursor.json | python3 -m json.tool

# Cursor file before each test
cp /ops/sidecar-cursor.json /tmp/sidecar-cursor-BEFORE.json
```

### Session JSONL Evidence

```bash
# Active session path
ls -la /root/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | grep -v "2026-05-1[0-4]" | head -5

# Session size at test moment
stat -c "%s %Y %n" /root/.openclaw/agents/main/sessions/$(ls -t /root/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | head -1)

# Count lines in session
wc -l /root/.openclaw/agents/main/sessions/*.jsonl
```

### Gateway Health Evidence

```bash
# Gateway response time (health check)
time curl -s -o /dev/null -w "%{http_code} %{time_total}s" https://qiyadon.com/ 2>/dev/null

# OpenClaw status
openclaw gateway status 2>&1
```

---

## PHASE 0: BASELINE CAPTURE (Pre-Validation)

**Purpose:** Capture current state before sidecar starts. All evidence must be timestamped.

### 0.1 Record PM2 Baseline

```bash
pm2 list 2>&1 | tee /tmp/validation/00-pm2-baseline.txt
date -Iseconds >> /tmp/validation/00-pm2-baseline.txt
```

### 0.2 Record Supabase Instruction Baseline

```bash
mkdir -p /tmp/validation
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,status,original_message,created_at&order=created_at.desc&limit=20" \
  > /tmp/validation/00-instructions-baseline.json
date -Iseconds >> /tmp/validation/00-instructions-baseline.txt
echo "Baseline instruction count: $(cat /tmp/validation/00-instructions-baseline.json | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')" >> /tmp/validation/00-instructions-baseline.txt
```

### 0.3 Record Task Baseline

```bash
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/tasks?select=id,goal,status,created_at&order=created_at.desc&limit=20" \
  > /tmp/validation/00-tasks-baseline.json
date -Iseconds >> /tmp/validation/00-tasks-baseline.txt
echo "Baseline task count: $(cat /tmp/validation/00-tasks-baseline.json | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')" >> /tmp/validation/00-tasks-baseline.txt
```

### 0.4 Record Cursor Baseline (if exists)

```bash
cat /ops/sidecar-cursor.json > /tmp/validation/00-cursor-baseline.json 2>/dev/null || echo "No cursor file exists yet" > /tmp/validation/00-cursor-baseline.json
date -Iseconds >> /tmp/validation/00-cursor-baseline.txt
```

### 0.5 Record Gateway Response Time

```bash
for i in 1 2 3; do
  time curl -s -o /dev/null -w " %{http_code} %{time_total}s" https://qiyadon.com/ 2>/dev/null
  echo ""
done > /tmp/validation/00-gateway-baseline.txt
date -Iseconds >> /tmp/validation/00-gateway-baseline.txt
```

### 0.6 Verify No Active Sidecar

```bash
pm2 list 2>&1 | grep instruction-sidecar-shadow && echo "SIDE CAR ALREADY RUNNING — STOP FIRST" || echo "No sidecar running — OK to proceed"
```

---

## PHASE 1: SIDECAR STARTUP

### 1.1 Start Shadow Sidecar

```bash
pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js 2>&1
```

### 1.2 Verify Startup Logs

```bash
sleep 3
pm2 logs instruction-sidecar-shadow --lines 15 --nostream 2>&1
```

**Expected logs:**
```
[shadow] Starting instruction-sidecar-shadow.js
[shadow] Config: { sessionsDir: ..., cursorFile: ..., checkIntervalMs: 5000, ... }
[shadow] Supabase client initialized OK
[shadow] Instructions table accessible
[shadow] Polling started — shadow mode active (no execution authority)
```

### 1.3 Verify PM2 Health

```bash
pm2 list 2>&1 | grep -E "instruction-sidecar|openclaw-gateway|moosa-worker"
```

**Expected:** instruction-sidecar-shadow = online, openclaw-gateway = online, moosa-worker = (unchanged)

### 1.4 Record Post-Startup PM2 State

```bash
pm2 jlist | python3 -c "import json,sys; p=json.load(sys.stdin); print(json.dumps([{'name':x['name'],'pid':x['pid'],'status':x['pm2_env']['status']} for x in p], indent=2))" > /tmp/validation/01-pm2-post-startup.json
cat /tmp/validation/01-pm2-post-startup.json
```

---

## TEST A: NORMAL INBOUND MESSAGE

**Objective:** 1 (deterministic capture), 5 (no task creation), 6 (no OpenClaw degradation)

### A.1 Record Pre-Test State

```bash
cp /ops/sidecar-cursor.json /tmp/validation/A-cursor-BEFORE.json 2>/dev/null || echo "{}" > /tmp/validation/A-cursor-BEFORE.json
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id&order=created_at.desc&limit=5" > /tmp/validation/A-instructions-BEFORE.json
date -Iseconds > /tmp/validation/A-timestamp-BEFORE.txt
```

### A.2 Send Normal Test Message

Send via WhatsApp:
```
[TEST-A] Normal inbound shadow validation — 2026-05-15T10:35:00Z
```

### A.3 Wait for Poll Cycle

```bash
echo "Waiting 7 seconds for poll cycle..."
sleep 7
```

### A.4 Record Post-Capture State

```bash
date -Iseconds > /tmp/validation/A-timestamp-AFTER.txt
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,status,original_message,received_at,metadata,state_transitions&order=created_at.desc&limit=5" > /tmp/validation/A-instructions-AFTER.json
cp /ops/sidecar-cursor.json /tmp/validation/A-cursor-AFTER.json
```

### A.5 Verify Instruction Row Created

```bash
python3 << 'EOF'
import json

before = json.load(open('/tmp/validation/A-instructions-BEFORE.json'))
after = json.load(open('/tmp/validation/A-instructions-AFTER.json'))

new_rows = [r for r in after if r not in before]

print(f"TEST-A RESULT:")
print(f"  Before count: {len(before)}")
print(f"  After count: {len(after)}")
print(f"  New rows: {len(new_rows)}")

if len(new_rows) == 1:
    row = new_rows[0]
    print(f"  status: {row['status']}")
    print(f"  original_message: {row['original_message'][:80]}...")
    print(f"  received_at: {row['received_at']}")
    if row.get('metadata'):
        print(f"  message_id: {row['metadata'].get('message_id', 'N/A')}")
        print(f"  captured_by: {row['metadata'].get('captured_by', 'N/A')}")
    print("  PASS — exactly 1 row created")
else:
    print(f"  FAIL — expected 1 row, got {len(new_rows)}")
EOF
```

### A.6 Verify NO Task Created

```bash
python3 << 'EOF'
import json
before = json.load(open('/tmp/validation/00-tasks-baseline.json'))
after = json.load(open('/tmp/validation/A-instructions-AFTER.json'))  # reuse instructions as proxy

# Actually query tasks fresh
import subprocess
result = subprocess.run([
    'curl', '-s', '-H', 'apikey: $SUPABASE_SERVICE_KEY',
    '-H', 'Authorization: Bearer $SUPABASE_SERVICE_KEY',
    'https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/tasks?select=id,goal,status,created_at&order=created_at.desc&limit=5'
], capture_output=True, text=True, env={'SUPABASE_SERVICE_KEY': open('/dev/stdin').read().strip() if False else 'test'})

tasks_after = json.loads(result.stdout) if result.stdout else []
print(f"TEST-A NO-TASK RESULT:")
print(f"  New tasks created: {len(tasks_after)}")
print(f"  PASS — no task created" if len(tasks_after) == 0 else f"  FAIL — tasks were created!")
EOF
```

**Failure classification if A fails:**
- 0 new rows → DUPLICATION-RISK (capture mechanism broken)
- 2+ new rows → DUPLICATION-RISK (duplicate prevention failed)
- Task created → CORRUPTION-RISK (sidecar created task — should NEVER happen)
- Status not `shadow_received` → CORRUPTION-RISK (wrong status written)

---

## TEST B: DUPLICATE INBOUND MESSAGE

**Objective:** 2 (duplicate prevention)

### B.1 Resend Same Message (or manually set cursor to prior message_id)

The easiest way: Send the exact same message text again from WhatsApp.

### B.2 Wait for Poll Cycle

```bash
echo "Waiting 7 seconds for poll cycle..."
sleep 7
```

### B.3 Record Post-Capture State

```bash
cp /ops/sidecar-cursor.json /tmp/validation/B-cursor-BEFORE.json
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,original_message,received_at,metadata&order=created_at.desc&limit=10" > /tmp/validation/B-instructions-AFTER.json
```

### B.4 Verify No Duplicate Row Created

```bash
python3 << 'EOF'
import json

before_ids = set(r['id'] for r in json.load(open('/tmp/validation/A-instructions-AFTER.json')))
after = json.load(open('/tmp/validation/B-instructions-AFTER.json'))
new_rows = [r for r in after if r['id'] not in before_ids]

# Get the original message from Test A
test_a_msg = "[TEST-A] Normal inbound shadow validation"
test_a_count = sum(1 for r in after if test_a_msg in r.get('original_message', ''))

print(f"TEST-B RESULT (Duplicate Prevention):")
print(f"  New rows since Test A: {len(new_rows)}")
print(f"  Total occurrences of Test-A message: {test_a_count}")
if test_a_count == 1:
    print(f"  PASS — message appears exactly once, duplicate prevented")
else:
    print(f"  FAIL — message appears {test_a_count} times, duplicate prevention FAILED")
EOF
```

**Failure classification if B fails:**
- test_a_count > 1 → DUPLICATION-RISK (duplicate message created — critical)

---

## TEST C: PM2 RESTART OF SIDECAR

**Objective:** 3 (restart continuity)

### C.1 Record Cursor and State Before Restart

```bash
cp /ops/sidecar-cursor.json /tmp/validation/C-cursor-BEFORE.json
cat /tmp/validation/C-cursor-BEFORE.json
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id&order=created_at.desc&limit=5" > /tmp/validation/C-instructions-BEFORE.json
```

### C.2 Restart Sidecar

```bash
pm2 restart instruction-sidecar-shadow 2>&1
date -Iseconds > /tmp/validation/C-restart-timestamp.txt
```

### C.3 Verify Restart Within 30 Seconds

```bash
echo "Waiting 10 seconds for restart..."
sleep 10
pm2 list 2>&1 | grep instruction-sidecar
pm2 logs instruction-sidecar-shadow --lines 10 --nostream 2>&1
```

### C.4 Send Test Message After Restart

```bash
echo "Sending test-C message after restart..."
# Send via WhatsApp:
# [TEST-C] PM2 restart continuity validation — 2026-05-15T10:40:00Z
sleep 7
```

### C.5 Verify Continuity

```bash
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,original_message,received_at,metadata&order=created_at.desc&limit=10" > /tmp/validation/C-instructions-AFTER.json
cp /ops/sidecar-cursor.json /tmp/validation/C-cursor-AFTER.json

python3 << 'EOF'
import json

before_ids = set(r['id'] for r in json.load(open('/tmp/validation/C-instructions-BEFORE.json')))
after = json.load(open('/tmp/validation/C-instructions-AFTER.json'))
new_rows = [r for r in after if r['id'] not in before_ids]

print(f"TEST-C RESULT (Restart Continuity):")
print(f"  New rows after restart: {len(new_rows)}")
if len(new_rows) == 1 and '[TEST-C]' in new_rows[0]['original_message']:
    print(f"  PASS — restart did not lose capture capability")
    print(f"  message: {new_rows[0]['original_message'][:60]}")
else:
    print(f"  FAIL — unexpected result")
    for r in new_rows:
        print(f"    row: {r.get('original_message','')[:60]}")
EOF
```

**Failure classification if C fails:**
- 0 new rows after restart + new message → SILENT-RISK (resume failed but mechanism self-healed on next poll?)
- Restart takes >30s → RECOVERABLE (slow but eventually recovered)
- Sidecar not back online after 60s → RECOVERABLE (max_restarts exceeded — alert + investigate)

---

## TEST D: GATEWAY RESTART DURING POLLING

**Objective:** 6 (no OpenClaw degradation), 10 (session-rotation recovery)

### D.1 Record Pre-Gateway-Restart State

```bash
cp /ops/sidecar-cursor.json /tmp/validation/D-cursor-BEFORE.json
ls -la /root/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | head -3
```

### D.2 Restart Gateway

```bash
pm2 restart openclaw-gateway 2>&1
date -Iseconds > /tmp/validation/D-gateway-restart-timestamp.txt
```

### D.3 Wait and Observe Sidecar Behavior

```bash
echo "Waiting 15 seconds for gateway restart..."
sleep 15
pm2 logs instruction-sidecar-shadow --lines 10 --nostream 2>&1
cat /ops/sidecar-cursor.json
```

### D.4 Verify Sidecar Survived Gateway Restart

```bash
pm2 list 2>&1 | grep -E "instruction-sidecar|openclaw-gateway"
```

**Expected:**
- instruction-sidecar-shadow still online
- openclaw-gateway back online
- Cursor may show session change (rotation)

### D.5 Send Test Message After Gateway Restart

```bash
# Send via WhatsApp:
# [TEST-D] Gateway restart validation — 2026-05-15T10:45:00Z
sleep 7

curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,original_message,received_at,metadata&order=created_at.desc&limit=5" > /tmp/validation/D-instructions-AFTER.json
```

**Failure classification if D fails:**
- Sidecar crashed during gateway restart → RECOVERABLE (autorestart kicks in)
- Sidecar online but no new capture → SILENT-RISK (session rotation may have caused cursor reset + message loss?)
- Gateway failed to restart → EMERGENCY STOP (runtime offline — not sidecar issue)

---

## TEST E: MALFORMED JSONL LINE

**Objective:** 9 (malformed-line resilience)

### E.1 Inject Malformed Line Into Session JSONL

```bash
# Find active session
ACTIVE_SESSION=$(ls -t /root/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | head -1)
echo "Active session: $ACTIVE_SESSION"

# Append malformed JSON line
echo 'THIS IS NOT JSON { broken: "line' >> "$ACTIVE_SESSION"
echo "Malformed line injected at $(date -Iseconds)" >> /tmp/validation/E-malformed-inject.txt
wc -l "$ACTIVE_SESSION" >> /tmp/validation/E-malformed-inject.txt
```

### E.2 Wait for Next Poll Cycle

```bash
echo "Waiting 7 seconds for poll..."
sleep 7
```

### E.3 Verify Sidecar Survived

```bash
pm2 list 2>&1 | grep instruction-sidecar
pm2 logs instruction-sidecar-shadow --lines 10 --nostream 2>&1
```

### E.4 Verify Capture Continued

```bash
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,original_message&order=created_at.desc&limit=3" > /tmp/validation/E-instructions-AFTER.json

# Sidecar should have logged malformed line skip
pm2 logs instruction-sidecar-shadow --lines 50 --nostream 2>&1 | grep -i "malformed\|skipped\|error"
```

**Expected log:** `[shadow] Malformed line skipped: Unexpected end of...`

**Failure classification if E fails:**
- Sidecar crashed → CORRUPTION-RISK (malformed line crashed sidecar)
- No malformed log but sidecar alive → SILENT-RISK (malformed line silently dropped — may indicate parsing issue)

---

## TEST F: SESSION ROTATION HANDLING

**Objective:** 10 (session-rotation recovery)

### F.1 Record Current Session

```bash
cp /ops/sidecar-cursor.json /tmp/validation/F-cursor-BEFORE.json
CURRENT_SESSION=$(ls -t /root/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | head -1)
echo "Current session: $CURRENT_SESSION" > /tmp/validation/F-session-BEFORE.txt
cat /tmp/validation/F-cursor-BEFORE.json
```

### F.2 Trigger Session Rotation

```bash
# Restart gateway to force new session
pm2 restart openclaw-gateway 2>&1
date -Iseconds > /tmp/validation/F-gateway-restart-timestamp.txt
echo "Waiting 20 seconds for new session to establish..."
sleep 20
```

### F.3 Verify New Session Active

```bash
NEW_SESSION=$(ls -t /root/.openclaw/agents/main/sessions/*.jsonl 2>/dev/null | head -1)
echo "New session: $NEW_SESSION" > /tmp/validation/F-session-AFTER.txt
cat /tmp/validation/F-session-AFTER.txt
ls -la /root/.openclaw/agents/main/sessions/*.jsonl.lock 2>/dev/null | head -3
```

### F.4 Verify Cursor Reset Detected

```bash
cat /ops/sidecar-cursor.json
pm2 logs instruction-sidecar-shadow --lines 5 --nostream 2>&1 | grep -i "session\|rotate\|reset"
```

**Expected log:** `[shadow] Session rotated: OLD-UUID → NEW-UUID, resetting cursor`

### F.5 Send Test Message in New Session

```bash
# Send via WhatsApp:
# [TEST-F] Session rotation validation — 2026-05-15T10:50:00Z
sleep 7

curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,original_message,received_at,metadata&order=created_at.desc&limit=5" > /tmp/validation/F-instructions-AFTER.json
```

**Failure classification if F fails:**
- Cursor did not reset (still pointing to old session EOF) → DUPLICATION-RISK (file grew but cursor didn't advance, causing re-processing or skip)
- Sidecar crashed on rotation → CORRUPTION-RISK (rotation handling broken)
- New session detected but capture failed → SILENT-RISK (rotation detected, but capture broken)

---

## TEST G: HIGH-FREQUENCY INBOUND BURST

**Objective:** 1 (deterministic capture under load), 4 (no worker interference)

### G.1 Send 5 Rapid Messages

```bash
echo "Sending 5 rapid-fire messages via WhatsApp..."
for i in 1 2 3 4 5; do
  echo "[TEST-G-$i] High-frequency burst test message $i — $(date -Iseconds)"
  sleep 0.5
done
# Send each as separate WhatsApp message
```

### G.2 Wait for Poll Cycle

```bash
echo "Waiting 10 seconds for poll..."
sleep 10
```

### G.3 Verify All 5 Captured

```bash
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,original_message,received_at,metadata&order=created_at.desc&limit=10" > /tmp/validation/G-instructions-AFTER.json

python3 << 'EOF'
import json

after = json.load(open('/tmp/validation/G-instructions-AFTER.json'))
test_g_rows = [r for r in after if '[TEST-G' in r.get('original_message', '')]

print(f"TEST-G RESULT (High-Frequency Burst):")
print(f"  TEST-G rows captured: {len(test_g_rows)}")
for r in test_g_rows:
    print(f"    id={r['id']} msg={r['original_message'][:50]}")
if len(test_g_rows) == 5:
    print(f"  PASS — all 5 burst messages captured")
elif len(test_g_rows) < 5:
    print(f"  FAIL — only {len(test_g_rows)}/5 captured, {5-len(test_g_rows)} LOST")
else:
    print(f"  WARNING — {len(test_g_rows)}/5 captured (possible duplicate)")
EOF
```

**Failure classification if G fails:**
- <5 rows → DUPLICATION-RISK or SILENT-RISK (some messages lost)
- >5 rows → DUPLICATION-RISK (over-capture)
- Worker became slow/unresponsive during burst → SILENT-RISK (sidecar affecting worker)

---

## TEST H: NO-TASK-CREATION PROOF (Final)

**Objective:** 5 (no task creation — absolute proof)

### H.1 Query Tasks Table

```bash
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/tasks?select=id,goal,status,created_at&order=created_at.desc&limit=20" \
  > /tmp/validation/H-tasks-final.json

python3 << 'EOF'
import json, subprocess, os

# Get env
env = {}
for line in subprocess.run(['pm2', 'env', '0'], capture_output=True, text=True).stdout.split('\n'):
    if 'SUPABASE' in line:
        k, v = line.split('=', 1)
        env[k] = v

tasks = json.load(open('/tmp/validation/H-tasks-final.json'))
baseline_count = len(json.load(open('/tmp/validation/00-tasks-baseline.json')))

print(f"TEST-H RESULT (NO-TASK-CREATION):")
print(f"  Baseline task count: {baseline_count}")
print(f"  Current task count: {len(tasks)}")
print(f"  New tasks: {len(tasks) - baseline_count}")
if len(tasks) == baseline_count:
    print(f"  PASS — no tasks created during entire validation")
else:
    print(f"  CORRUPTION-RISK — {len(tasks) - baseline_count} tasks created by sidecar!")
    for t in tasks[:5]:
        print(f"    task: {t.get('goal', 'N/A')[:60]}")
EOF
```

---

## PHASE Z: ROLLBACK VERIFICATION

### Z.1 Stop Sidecar

```bash
pm2 stop instruction-sidecar-shadow 2>&1
pm2 list 2>&1 | grep instruction-sidecar
```

### Z.2 Verify No Production Disruption

```bash
pm2 list 2>&1 | grep -E "online|stopped|err"
echo "---"
# Gateway still responsive?
curl -s -o /dev/null -w "Gateway: %{http_code} %{time_total}s\n" https://qiyadon.com/ 2>/dev/null
```

### Z.3 Record Post-Rollback State

```bash
pm2 jlist | python3 -c "import json,sys; p=json.load(sys.stdin); print(json.dumps([{'name':x['name'],'status':x['pm2_env']['status']} for x in p], indent=2))" > /tmp/validation/Z-pm2-post-rollback.json
cat /tmp/validation/Z-pm2-post-rollback.json
```

### Z.4 Verify Instruction Rows Persist

```bash
# After rollback, instruction rows should still exist
curl -s -H "apikey: $SUPABASE_SERVICE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=id,status,original_message&order=created_at.desc&limit=5" > /tmp/validation/Z-instructions-post-rollback.json
python3 -c "import json; d=json.load(open('/tmp/validation/Z-instructions-post-rollback.json')); print(f'Instruction rows after rollback: {len(d)}'); print('PASS — rows persisted' if len(d) > 0 else 'WARNING — no rows found')"
```

### Z.5 Full Rollback Command

```bash
pm2 delete instruction-sidecar-shadow 2>&1
# Verify removed
pm2 list 2>&1 | grep instruction-sidecar || echo "Sidecar fully removed from PM2"
```

---

## VALIDATION SUMMARY SHEET

Complete this after all tests:

```bash
python3 << 'EOF'
import json, os

results = {}

tests = ['A','B','C','D','E','F','G','H']
for t in tests:
    marker = f'/tmp/validation/{t}-result.txt'
    if os.path.exists(marker):
        results[t] = open(marker).read().strip()
    else:
        results[t] = 'NOT RUN'

print("=" * 60)
print("SHADOW SIDECAR VALIDATION — FINAL SUMMARY")
print("=" * 60)
for t, r in results.items():
    status = "✅ PASS" if "PASS" in r else "❌ FAIL" if "FAIL" in r else "⚠️ " + r[:40]
    print(f"  TEST-{t}: {status}")
print("=" * 60)
print("Evidence directory: /tmp/validation/")
print("Rollback: pm2 delete instruction-sidecar-shadow")
EOF
```

---

## VALIDATION TIMELINE (Timestamps in ISO 8601)

| Test | Action | Expected Result |
|------|--------|----------------|
| 00 | Baseline capture | All evidence files in /tmp/validation/ |
| 01 | Sidecar start | instruction-sidecar-shadow online, logs show polling started |
| A | Normal message | 1 shadow_received row, no task created |
| B | Duplicate message | 1 total row for that message (duplicate prevented) |
| C | PM2 restart | Sidecar back online <30s, capture resumes |
| D | Gateway restart | Sidecar survives, capture continues |
| E | Malformed line | Sidecar logs "Malformed line skipped", continues |
| F | Session rotation | Cursor resets, new session captured |
| G | 5-message burst | 5 rows captured (all or none — no partial) |
| H | No-task final check | 0 new tasks |
| Z | Rollback | Sidecar removed, gateway + worker unaffected |

---

*Validation protocol created 2026-05-15 — Execute only with Ahmad's explicit go-ahead on each test*