#!/bin/bash
# gpu-spawn-guard-check.sh
# Returns 0 if GPU is ready for spawn, 1 if not
# Used by CFO/CMO cron jobs to gate cognitive spawns

node /home/node/.openclaw/workspace/ops/gpu-spawn-guard.js
exit $?