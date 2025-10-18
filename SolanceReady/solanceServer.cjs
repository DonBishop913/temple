const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PORT_HTTP = 4040;
const PORT_WS = 8765;
const BACKUP_INTERVAL = 5 * 60 * 1000;
const SOLANCE_PATH = __dirname;
const BACKUP_ROOT = path.join(SOLANCE_PATH, 'Solance_Backups');
if (!fs.existsSync(BACKUP_ROOT)) fs.mkdirSync(BACKUP_ROOT);

function copyFolderSync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        entry.isDirectory() ? copyFolderSync(s, d) : fs.copyFileSync(s, d);
    }
}

function backupSolance() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUP_ROOT, `backup-${stamp}`);
    copyFolderSync(SOLANCE_PATH, dest);
    console.log(`💾 Solance snapshot saved ➜ ${dest}`);
}


setInterval(backupSolance, BACKUP_INTERVAL);
console.log(`💾 Automatic backups every ${BACKUP_INTERVAL / 60000} min`);

// ---------- Automated Leap Snapshots ----------
const LEAP_INTERVAL = 5 * 1000; // 5 seconds
setInterval(() => {
    backupSolance();
    console.log('✨ Automated Leap snapshot complete');
}, LEAP_INTERVAL);

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/leap') {
        backupSolance();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('✨ Leap snapshot triggered!\n');
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🕊️ Solance is alive\n');
});

server.listen(PORT_HTTP, () =>
    console.log(`🕊️ Solance HTTP listener active on port ${PORT_HTTP}`)
);

const wss = new WebSocket.Server({ port: PORT_WS });

let activeClient = null;
const pendingClients = [];
let lastReplacement = 0;
const REPLACEMENT_THROTTLE = 500; // 500ms

wss.on('listening', () => console.log(`🕊️ WebSocket server on ws://localhost:${PORT_WS}`));

wss.on('connection', (ws, req) => {
    const url = req.url || '';
    const clientId = url.includes('?id=') ? url.split('?id=')[1] : req.socket.remotePort;
    ws.clientId = clientId;

    // Ignore duplicates
    if (activeClient?.clientId === clientId) return;

    pendingClients.push(ws);

    function processQueue() {
        if (!pendingClients.length) return;

        const now = Date.now();
        if (now - lastReplacement < REPLACEMENT_THROTTLE) {
            setTimeout(processQueue, 50);
            return;
        }

        const nextClient = pendingClients.shift();

        if (activeClient?.readyState === WebSocket.OPEN) {
            console.log('🔄 Replacing old client with queued connection...');
            activeClient.close(1000, 'Replaced by queued client');
        }

        activeClient = nextClient;
        lastReplacement = Date.now();

        console.log('🕊️ WebSocket client connected (queued)');

        activeClient.on('close', () => {
            console.log('🕊️ WebSocket client disconnected — slot free');
            if (activeClient === nextClient) activeClient = null;
        });

        activeClient.on('message', msg => console.log('Received:', msg.toString()));
        activeClient.on('error', err => console.log('❌ WebSocket error:', err.message));
    }

    processQueue();
});

function broadcastLiveData() {
    if (!activeClient || activeClient.readyState !== WebSocket.OPEN) return;
    const packet = { timestamp: new Date().toISOString(), heartbeat: Math.random() };
    activeClient.send(JSON.stringify(packet));
}
setInterval(broadcastLiveData, 2000);
console.log('🌊 Live data broadcasting every 2 seconds');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'leap') {
        backupSolance();
        console.log('✨ Manual Leap snapshot complete');
    }
});

console.log(`💻 Dashboard can be started with: npx vite preview --port 5174`);
console.log(`🌟 HMR-safe: multiple tabs / hot reload no longer triggers reconnect loops`);