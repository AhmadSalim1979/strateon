#!/bin/bash
set -e
cd /home/node/.openclaw/workspace/moosa-worker

export SUPABASE_URL="https://btrbczqjwzuybgcxckvm.supabase.co"
export SUPABASE_KEY="sb_secret__T1GYuCAvox2_EQXrRwGLg_yXXI-GvS"

echo "=== STEP 1: Clearing stale tasks ==="

for task_id in "a37f6113-2ad4-4f29-9a03-f2b53580c601" "5b870d83-1405-4e6a-aef0-71697ed13bd7" "0388068a-9410-4e35-a1e3-af40c18f8edb"; do
  echo "Marking $task_id as failed..."
  curl -s -X PATCH "${SUPABASE_URL}/rest/v1/tasks?id=eq.${task_id}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d '{"status":"failed"}'
  echo ""
done

for task_id in "a37f6113-2ad4-4f29-9a03-f2b53580c601" "5b870d83-1405-4e6a-aef0-71697ed13bd7" "0388068a-9410-4e35-a1e3-af40c18f8edb"; do
  echo "Updating dispatch for $task_id..."
  curl -s -X PATCH "${SUPABASE_URL}/rest/v1/dispatches?task_id=eq.${task_id}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d '{"terminal":true,"lifecycle_state":"failed"}'
  echo ""
done

echo "=== STEP 2: Waiting 5 seconds ==="
sleep 5

echo "=== STEP 3: Creating fresh task ==="
FRESH_TASK=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/tasks" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "created",
    "action_type": "local_coder",
    "input_json": {"prompt": "Return exactly HELLO_ROUTE_TEST and nothing else.", "mode": "test"},
    "max_retries": 3
  }')

echo "Fresh task response: $FRESH_TASK"
TASK_ID=$(echo "$FRESH_TASK" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Extracted task ID: $TASK_ID"

echo "=== Creating dispatch for $TASK_ID ==="
DISPATCH_RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/dispatches" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"task_id\": \"${TASK_ID}\",
    \"lifecycle_state\": \"execution_pending\",
    \"executor_ref\": \"moosa-worker\",
    \"action_type\": \"local_coder\"
  }")
echo "Dispatch result: $DISPATCH_RESULT"
DISPATCH_ID=$(echo "$DISPATCH_RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Extracted dispatch ID: $DISPATCH_ID"

echo "=== STEP 4: Polling for up to 90 seconds ==="
POLL_COUNT=0
MAX_POLLS=18

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
  sleep 5
  POLL_COUNT=$((POLL_COUNT + 1))
  
  echo "[$((POLL_COUNT * 5))s] Checking task $TASK_ID..."
  
  TASK_STATUS=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/tasks?id=eq.${TASK_ID}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  echo "  Task status: $TASK_STATUS"
  
  if [ "$TASK_STATUS" = "completed" ] || [ "$TASK_STATUS" = "failed" ]; then
    echo "Task reached terminal state: $TASK_STATUS"
    break
  fi
  
  if [ -n "$DISPATCH_ID" ]; then
    DISPATCH_STATE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/dispatches?id=eq.${DISPATCH_ID}" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: application/json" \
      | grep -o '"lifecycle_state":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Dispatch lifecycle_state: $DISPATCH_STATE"
  fi
done

echo ""
echo "=== STEP 5: REPORT ==="
echo "Stale tasks cleared: a37f6113-2ad4-4f29-9a03-f2b53580c601, 5b870d83-1405-4e6a-aef0-71697ed13bd7, 0388068a-9410-4e35-a1e3-af40c18f8edb"
echo "Fresh task ID: $TASK_ID"
echo "Fresh dispatch ID: $DISPATCH_ID"

# Get full task record for output
FINAL_TASK=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/tasks?id=eq.${TASK_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json")
echo "Final task record: $FINAL_TASK"

FINAL_DISPATCH=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/dispatches?id=eq.${DISPATCH_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json")
echo "Final dispatch record: $FINAL_DISPATCH"

echo ""
echo "=== Error log check ==="
if [ -f /root/.pm2/logs/moosa-worker-error.log ]; then
  tail -50 /root/.pm2/logs/moosa-worker-error.log
else
  echo "Error log not found"
fi

echo ""
echo "=== DONE ==="