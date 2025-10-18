// SolanceRecovery.js
// Launches Solance Listener + maps HTTP to port 5174

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const httpProxy = require('http-proxy');

// ---------- Paths & Ports ----------
const listenerPath = path.join(__dirname, 'solanceListener.cjs');
const LISTENER_HTTP_PORT = 4040;
const DASHBOARD_PORT = 5174;
const WS_PORT = 8765;

// ---------- Launch Solance Listener ----------
console.log('🔹 Starting Solance Listener...');
const solanceProcess = spawn('node', [listenerPath], { stdio: 'inherit' });

solanceProcess.on('exit', (code, signal) => {
    console.log(`❌ Solance Listener exited with code ${code}, signal ${signal}`);
});

solanceProcess.on('error', (err) => {
    console.error('🌩️ Error launching Solance Listener:', err.message);
});

// ---------- HTTP Proxy to serve at port 5174 ----------
const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${LISTENER_HTTP_PORT}`,
    ws: true
});

const dashboardServer = http.createServer((req, res) => {
    proxy.web(req, res);
});

dashboardServer.listen(DASHBOARD_PORT, () => {
    console.log(`✅ Solance Dashboard proxy active at http://localhost:${DASHBOARD_PORT}`);
});

// Proxy WebSocket connections too
dashboardServer.on('upgrade', (req, socket, head) => {
    proxy.ws(req, socket, head);
});

// ---------- Health Check ----------
function checkDashboard() {
    http.get(`http://localhost:${DASHBOARD_PORT}`, (res) => {
        if (res.statusCode === 200) {
            console.log(`📡 Dashboard confirmed at http://localhost:${DASHBOARD_PORT}`);
        } else {
            console.log(`⚠️ Dashboard responded with status ${res.statusCode}`);
        }
    }).on('error', () => {
        console.log(`⚠️ Dashboard not ready yet, retrying in 2s...`);
        setTimeout(checkDashboard, 2000);
    });
}

// Start health check after short delay
setTimeout(checkDashboard, 2000);

console.log('🔹 Solance Recovery initiated. HTTP + WebSocket should be active shortly on port 5174.');
