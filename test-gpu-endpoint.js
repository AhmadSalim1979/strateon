const { execSync } = require('child_process');
const fs = require('fs');
const token = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/gpu-auth-proxy.json', 'utf8')).token;
const proxyUrl = 'https://c1as99lq8xtphy-11440.proxy.runpod.net';

const payload = JSON.stringify({
    model: 'mistral-small3.2:latest',
    messages: [{role: 'user', content: 'Reply with exactly: GPU shadow path operational.'}],
    max_tokens: 200
});

fs.writeFileSync('/tmp/gpu-payload.json', payload);

// Test different methods and endpoints
const tests = [
    'curl -s -X POST -H "Authorization: Bearer ' + token + '" -H "Content-Type: application/json" -d @/tmp/gpu-payload.json "' + proxyUrl + '/v1/chat/completions" --max-time 30',
    'curl -s -X POST -H "Authorization: Bearer ' + token + '" -H "Content-Type: application/json" -d @/tmp/gpu-payload.json "' + proxyUrl + '/api/chat/completions" --max-time 30',
    'curl -s -X GET -H "Authorization: Bearer ' + token + '" "' + proxyUrl + '/v1/models" --max-time 30',
    'curl -s -X POST -H "Authorization: Bearer ' + token + '" -H "Content-Type: application/json" -d @/tmp/gpu-payload.json "' + proxyUrl + '/api/v1/chat/completions" --max-time 30',
];

tests.forEach((cmd, i) => {
    try {
        const raw = execSync(cmd, { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
        console.log('Test ' + (i+1) + ':', raw.substring(0, 100));
    } catch (e) {
        console.log('Test ' + (i+1) + ' error:', e.message.substring(0, 100));
    }
});