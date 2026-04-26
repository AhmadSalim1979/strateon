#!/bin/bash
SUPABASE_URL="https://btrbczqjwzuybgcxckvm.supabase.co"
SUPABASE_KEY="sb_secret__T1GYuCAvox2_EQXrRwGLg_yXXI-GvS"

echo "=== Step 1a: Updating stale task statuses to 'failed' ==="

# Task 1
result1=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/tasks?id=eq.a37f6113-2ad4-4f29-9a03-f2b53580c601" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"status":"failed"}')
echo "Task 1 update result: $result1"

# Task 2
result2=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/tasks?id=eq.5b870d83-1405-4e6a-aef0-71697ed13bd7" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"status":"failed"}')
echo "Task 2 update result: $result2"

# Task 3
result3=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/tasks?id=eq.0388068a-9410-4e35-a1e3-af40c18f8edb" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"status":"failed"}')
echo "Task 3 update result: $result3"

echo ""
echo "=== Step 1b: Updating linked dispatches to terminal=true, lifecycle_state='failed' ==="

# Find and update dispatches for these tasks
for task_id in "a37f6113-2ad4-4f29-9a03-f2b53580c601" "5b870d83-1405-4e6a-aef0-71697ed13bd7" "0388068a-9410-4e35-a1e3-af40c18f8edb"; do
  echo "Updating dispatch for task: $task_id"
  result=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/dispatches?task_id=eq.${task_id}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d '{"terminal":true,"lifecycle_state":"failed"}')
  echo "Dispatch update result: $result"
done

echo ""
echo "=== Done with Step 1 ==="
