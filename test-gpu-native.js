const http = require('http');
const https = require('https');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/gpu-auth-proxy.json', 'utf8')).token;

const postData = JSON.stringify({
    model: 'mistral-small3.2:latest',
    messages: [{role: 'user', content: 'Reply with exactly: GPU shadow path operational.'}],
    max_tokens: 200
});

const endpoints = [
    '/api/chat/completions',
    '/api/chat',
    '/api/generate'
];

function httpsRequest(hostname, path, postData, token) {
    return new Promise((resolve, reject) => {
        const url = new URL('https://' + hostname + path);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 300) }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

(async () => {
    for (const ep of endpoints) {
        const result = await httpsRequest('c1as99lq8xtphy-11440.proxy.runpod.net', ep, postData, token);
        console.log('POST ' + ep + ': HTTP ' + result.status);
        console.log('  Body: ' + result.body.substring(0, 200));
        console.log('');
    }
})();