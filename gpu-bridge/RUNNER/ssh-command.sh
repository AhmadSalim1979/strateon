#!/bin/bash
# ssh-command.sh — SSH wrapper with timeout enforcement
# 
# Usage: ./ssh-command.sh <pod_id> <command> <timeout_ms>
# 
# Safety: Only accepts commands from gpu-runner.js which validates against allowed-commands.json
# Timeout: Enforced via bash timeout command
# Notes:   Direct SSH to individual pods requires pod-level key (see pod-targets.json accessConstraints)

POD_ID="${1}"
COMMAND="${2}"
TIMEOUT_MS="${3:-30000}"

# Validate inputs
if [ -z "$POD_ID" ] || [ -z "$COMMAND" ]; then
    echo "ERROR: Missing required arguments" >&2
    echo "Usage: ssh-command.sh <pod_id> <command> <timeout_ms>" >&2
    exit 1
fi

# Convert timeout to seconds (round up)
TIMEOUT_SECONDS=$(( (TIMEOUT_MS + 999) / 1000 ))
if [ "$TIMEOUT_SECONDS" -lt 1 ]; then
    TIMEOUT_SECONDS=1
fi

# SSH configuration
SSH_KEY="/root/.ssh/gpu_pod_key"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -o BatchMode=yes -o ServerAliveInterval=15"

# Note: Direct SSH to individual pods (${POD_ID}@ssh.runpod.io) requires the pod's generated key
# The RunPod gateway (ku2tmyupp8tkbs@ssh.runpod.io) uses the gateway key at /root/.ssh/gpu_pod_key
# For pod-specific commands, this script acts as a wrapper — actual execution may use RunPod API
# instead of direct SSH, depending on access constraints documented in pod-targets.json

# For now, this script is a SKELETON — Phase 1 foundation only
# No actual SSH execution in Phase 1

echo "SKELETON_MODE: ssh-command.sh called but not executed" >&2
echo "Pod: ${POD_ID}" >&2
echo "Command: ${COMMAND}" >&2
echo "Timeout: ${TIMEOUT_MS}ms (${TIMEOUT_SECONDS}s)" >&2
echo "Reason: Phase 1 foundation — no SSH execution permitted" >&2

exit 0