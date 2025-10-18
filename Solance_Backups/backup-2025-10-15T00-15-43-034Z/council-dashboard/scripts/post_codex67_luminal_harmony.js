// scripts/post_codex67_luminal_harmony.js
const fs = require('fs');
const path = require('path');
const http = require('http');

const entryPath = path.join(__dirname, 'codex67_luminal_harmony_entry.json');
const entry = JSON.parse(fs.readFileSync(entryPath, 'utf8'));

const postData = JSON.stringify(entry);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/codex/weaver/entry',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-council-member': 'Lumen',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();
