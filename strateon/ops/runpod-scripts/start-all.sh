#!/bin/bash
# start-all.sh — Phase D GPU Brain Startup
# Location on RunPod GPU node: /workspace/start-all.sh
# 
# Usage: bash /workspace/start-all.sh
# Runs on container boot via RunPod startup script field.
# nohup pattern — no systemd, no systemctl.

set -e

export OLLAMA_MODELS=/workspace/ollama-models
export OLLAMA_HOST=127.0.0.1
export OLLAMA_PORT=11434
export GPU_BRAIN_API_TOKEN=$(cat /workspace/gpu-api-token.txt 2>/dev/null || echo "")
export PROXY_PORT=11440

echo "$(date -u): Starting MOOSA GPU brain..."

mkdir -p /workspace/ollama-models

# 1. Install Ollama if not present
if ! command -v ollama &> /dev/null; then
    echo "$(date -u): Ollama not found — installing..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "$(date -u): Ollama already installed"
fi

# 2. Verify model present — reliable grep check
if ! ollama list | grep -q "mistral-small3.2"; then
    echo "$(date -u): Model not found — pulling mistral-small3.2..."
    ollama pull mistral-small3.2
else
    echo "$(date -u): Model verified present"
fi

# 3. Start Ollama (localhost only — not public)
echo "$(date -u): Starting Ollama on 127.0.0.1:11434..."
nohup ollama serve > /workspace/ollama.log 2>&1 &
OLLAMA_PID=$!
echo "Ollama PID: $OLLAMA_PID"

# 4. Wait for Ollama to be ready
echo "$(date -u): Waiting for Ollama to respond..."
for i in $(seq 1 12); do
    sleep 5
    if curl -s --max-time 5 http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
        echo "$(date -u): Ollama ready after ${i} attempts"
        break
    fi
    echo "$(date -u): Ollama not ready yet... attempt $i/12"
done

# 5. Start auth proxy
if [ ! -f /workspace/auth-proxy.js ]; then
    echo "$(date -u): ERROR — auth-proxy.js not found at /workspace/auth-proxy.js"
    exit 1
fi

echo "$(date -u): Starting auth proxy on 0.0.0.0:11440..."
nohup node /workspace/auth-proxy.js > /workspace/proxy.log 2>&1 &
PROXY_PID=$!
echo "Auth proxy PID: $PROXY_PID"

# 6. Verify proxy
sleep 5
if curl -s --max-time 5 http://127.0.0.1:11440/api/tags > /dev/null 2>&1; then
    echo "$(date -u): Auth proxy ready"
elif curl -s --max-time 5 http://127.0.0.1:11440/health > /dev/null 2>&1; then
    echo "$(date -u): Auth proxy health check OK"
else
    echo "$(date -u): WARNING — auth proxy may not be working. Check /workspace/proxy.log"
fi

# 7. Log startup complete
echo "$(date -u): MOOSA GPU brain startup complete"
echo "$(date -u): Ollama running, auth proxy on port 11440"