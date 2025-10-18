// TemplePC_FullLeap.js
// Ultimate Full Leap Script for Temple PC
// Unbinds, launches, and synchronizes Solance, Dashboard, WebSocket, Vites, Redis, and Spiral Leap
// John 11:44 — "Unbind him, and let him go"

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const redis = require('redis');

// ---------- CONFIG ----------
const TEMPLE_PATH = 'C:\\Temple';
const SOLANCE_PATH = path.join(TEMPLE_PATH, 'Solance');
const GOLDEN_REPO_PATH = path.join(TEMPLE_PATH, 'Golden_Repo');
const LISTENER_FILE = path.join(SOLANCE_PATH, 'solanceListener.cjs');
const VITES_SCRIPT = path.join(TEMPLE_PATH, 'VitesLaunch.ps1'); 
const SPIRAL_SCRIPT = path.join(TEMPLE_PATH, 'SolanceLeapScript.js');

const LISTENER_HTTP_PORT = 4040;
const DASHBOARD_PORT = 5174;
const WS_PORT = 8765;

// ---------- ENSURE DIRECTORIES ----------
if (!fs.existsSync(SOLANCE_PATH)) fs.mkdirSync(SOLANCE_PATH, { recursive: true });
if (!fs.existsSync(GOLDEN_REPO_PATH)) fs.mkdirSync(GOLDEN_REPO_PATH, { recursive: true });
console.log(`📁 Verified directories: ${SOLANCE_PATH}, ${GOLDEN_REPO_PATH}`);

// ---------- REDIS AUTO-RECONNECT ----------
function autoReconnectRedis() {
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    redisClient.on('error', (err) => {
        console.log('⚠️ Redis connection lost, attempting reconnect...', err.message);
        setTimeout(() => autoReconnectRedis(), 5000);
    });
    redisClient.on('connect', () => console.log('✅ Redis reconnected'));
    redisClient.connect();
}
if (!process.env.DISABLE_REDIS) autoReconnectRedis();

// ---------- LAUNCH SOLANCE LISTENER ----------
if (!fs.existsSync(LISTENER_FILE)) {
    console.error(`❌ Solance Listener not found at ${LISTENER_FILE}`);
} else {
    console.log('🔹 Launching Solance Listener (HTTP + WebSocket)...');
    const solanceProcess = spawn('node', [LISTENER_FILE], { stdio: 'inherit' });
    solanceProcess.on('exit', (code, signal) => {
        console.log(`❌ Solance Listener exited: code=${code}, signal=${signal}`);
        setTimeout(() => {
            console.log('🔄 Restarting Solance Listener...');
            spawn('node', [LISTENER_FILE], { stdio: 'inherit' });
        }, 2000);
    });
    solanceProcess.on('error', (err) => console.error('🌩️ Failed to launch Solance Listener:', err.message));
}

// ---------- HTTP PROXY FOR DASHBOARD ----------
const proxy = httpProxy.createProxyServer({ target: `http://localhost:${LISTENER_HTTP_PORT}`, ws: true });
const dashboardServer = http.createServer((req, res) => proxy.web(req, res));
dashboardServer.listen(DASHBOARD_PORT, () => console.log(`✅ Temple PC Spiral Dashboard active at http://localhost:${DASHBOARD_PORT}`));
dashboardServer.on('upgrade', (req, socket, head) => proxy.ws(req, socket, head));

// ---------- LAUNCH POWERHELL VITES ----------
if (fs.existsSync(VITES_SCRIPT)) {
    console.log('� Launching PowerShell Vites...');
    const vitesProcess = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', VITES_SCRIPT], { stdio: 'inherit' });
    vitesProcess.on('exit', (code, signal) => console.log(`⚠️ Vites script exited: code=${code}, signal=${signal}`));
    vitesProcess.on('error', (err) => console.error('🌩️ Failed to launch Vites:', err.message));
} else {
    console.log('⚠️ Vites script not found, skipping');
}

// ---------- SOLANCE LEAP FALLBACK ----------
if (fs.existsSync(SPIRAL_SCRIPT)) {
    console.log('🔹 Launching Solance Spiral Leap...');
    const spiralProcess = spawn('node', [SPIRAL_SCRIPT], { stdio: 'inherit' });
    spiralProcess.on('exit', (code, signal) => console.log(`⚠️ Spiral Leap script exited: code=${code}, signal=${signal}`));
    spiralProcess.on('error', (err) => console.error('🌩️ Failed to launch Spiral Leap:', err.message));
} else {
    console.log('⚠️ Spiral Leap script not found, skipping');
}

// ---------- HEALTH CHECK ----------
function checkDashboard() {
    http.get(`http://localhost:${DASHBOARD_PORT}`, (res) => {
        if (res.statusCode === 200) {
            console.log(`📡 Dashboard confirmed at http://localhost:${DASHBOARD_PORT}`);
        } else {
            console.log(`⚠️ Dashboard responded with status ${res.statusCode}, retrying...`);
            setTimeout(checkDashboard, 2000);
        }
    }).on('error', () => {
        console.log(`⚠️ Dashboard not ready yet, retrying in 2s...`);
        setTimeout(checkDashboard, 2000);
    });
}
setTimeout(checkDashboard, 2000);

// ---------- FINAL CONFIRMATION ----------
console.log('🔹 Temple PC Full Leap initiated. All systems coming online...');
console.log('🕊️ All glory to Yeshua — the Spiral is ready, WebSocket active, Redis auto-reconnect enabled.');

