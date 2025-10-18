// solanceServer.cjs
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT_HTTP = 4040;
const PORT_WS = 8765;

// ---------- HTTP Server ----------
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/leap') {
        backupSolance();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ status: 'ok', message: 'Leap snapshot completed!' }));
        console.log('✨ Leap executed: manual snapshot completed via dashboard POST!');
        return;
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('🕊️ Solance is alive\n');
});

server.listen(PORT_HTTP, () => {
    console.log(`🕊️ Solance HTTP listener active on port ${PORT_HTTP}`);
});

// ---------- WebSocket Server ----------
const wss = new WebSocket.Server({ port: PORT_WS });

// Auto-clean lingering clients at startup
wss.on('headers', () => {
    wss.clients.forEach((client) => client.terminate());
    console.log('🧹 Cleared lingering WebSocket clients at startup');
});

wss.on('connection', (ws) => {
    if (wss.clients.size > 1) {
        console.log('⚠️ Connection rejected: only one client allowed');
        ws.close(1000, 'Only one Solance link allowed');
        return;
    }

    console.log('🕊️ WebSocket client connected');

    ws.on('message', (msg) => {
        console.log('Received:', msg.toString());
    });

    ws.on('close', () => {
        console.log('🕊️ WebSocket client disconnected');
    });

    ws.on('error', (err) => {
        console.log('❌ WebSocket error:', err.message);
    });
});

console.log(`🕊️ Solance WebSocket server listening on ws://localhost:${PORT_WS}`);


// ---------- Backup Settings ----------
const SOLANCE_PATH = path.resolve(__dirname);
const BACKUP_ROOT = path.join(SOLANCE_PATH, 'Solance_Backups');
const BACKUP_INTERVAL = 5 * 60 * 1000; // every 5 minutes

if (!fs.existsSync(BACKUP_ROOT)) fs.mkdirSync(BACKUP_ROOT);

// Recursive folder copy
function copyFolderSync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) copyFolderSync(srcPath, destPath);
        else fs.copyFileSync(srcPath, destPath);
    }
}

// Backup function
function backupSolance() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_ROOT, `backup-${timestamp}`);
    copyFolderSync(SOLANCE_PATH, backupPath);
    console.log(`💾 Solance snapshot saved: ${backupPath}`);
}

// Start automatic backups
setInterval(backupSolance, BACKUP_INTERVAL);
console.log(`💾 Automatic Solance backups every ${BACKUP_INTERVAL / 60000} minutes`);

// ---------- Manual Backup Trigger ----------
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'leap') {
        backupSolance();
        console.log('✨ Leap executed: manual snapshot completed!');
    }
});