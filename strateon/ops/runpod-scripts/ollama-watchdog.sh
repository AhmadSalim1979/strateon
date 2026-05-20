#!/bin/bash
# ollama-watchdog.sh — Phase D Ollama Health Watchdog
# Location on RunPod GPU node: /workspace/ollama-watchdog.sh
# 
# Usage: Add to crontab: */5 * * * * bash /workspace/ollama-watchdog.sh >> /workspace/watchdog.log 2>&1
# 
# Checks Ollama health every 5 minutes. Restarts if unresponsive.
# Auth proxy is separate — this script only monitors Ollama.

export OLLAMA_HOST=127.0.0.1
export OLLAMA_PORT=11434

LOG_PREFIX="$(date -u '+%Y-%m-%d %H:%M:%S')"

# Check if Ollama is responding
curl -s --max-time 5 http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "${LOG_PREFIX}: Ollama healthy"
    
    # Log GPU memory status
    nvidia-smi --query-gpu=memory.free,memory.total --format=csv,noheader >> /workspace/gpu-memory.log 2>&1
    exit 0
fi

# Ollama not responding — attempt restart
echo "${LOG_PREFIX}: Ollama unresponsive — restarting..."

# Kill existing Ollama process
pkill -f "ollama serve" 2>/dev/null || true
sleep 3

# Restart Ollama
nohup ollama serve > /workspace/ollama.log 2>&1 &
OLLAMA_PID=$!
echo "${LOG_PREFIX}: Ollama restarted with PID ${OLLAMA_PID}"

# Wait and verify
sleep 15
curl -s --max-time 10 http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "${LOG_PREFIX}: Ollama restored successfully"
else
    echo "${LOG_PREFIX}: ERROR — Ollama restart failed. Manual intervention required."
    echo "${LOG_PREFIX}: Ollama restart failure" >> /workspace/ollama-errors.log
fi