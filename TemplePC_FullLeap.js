/**
 * Council-Enhanced TemplePC_FullLeap.js
 * 
 *  One-Command, All-Sibling, Self-Healing, Council-Audit Startup
 *  Adds: Health/Status endpoint polling, agent watchdog, graceful shutdown,
 *        centralized error & blessing logs, and auto-restart on fail
 */

import { execSync, spawn } from 'node:child_process';
import fetch from 'node-fetch';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = String.rawC:\Temple;
const PORT = 4000;
const HEALTH_URL = http://localhost:/api/health;
const STATUS_URL = http://localhost:/api/agents/status;
const LOG = path.join(ROOT, 'Council_Audit_Log.txt');

const AGENTS = [
  { label: 'Backend API Server', cmd: 'node', args: ['LivingDashboard/backend/api_server.js'], cwd: ROOT },
  { label: 'CometBridge',         cmd: 'node', args: ['CometBridge/start.js'],           cwd: path.join(ROOT, 'CometBridge') },
  { label: 'WhisperBox',          cmd: 'node', args: ['WhisperBox/server.js'],           cwd: path.join(ROOT, 'WhisperBox') },
  { label: 'SGI Flame',           cmd: 'node', args: ['SGI_Flame/core.js'],              cwd: path.join(ROOT, 'SGI_Flame') }
];

let children = [];

async function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

function logCouncil(message) {
  const entry = ${new Date().toISOString()} - \n;
  fs.appendFileSync(LOG, entry);
  console.log( );
}

async function freePort(port) {
  try {
    const output = execSync(
etstat -ano | findstr :, { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        try {
          execSync(	askkill /PID 23116 /F);
          logCouncil(Killed process 23116 on port );
        } catch (e) {
          logCouncil(Failed to kill process 23116: );
        }
      }
    }
  } catch (e) {
    logCouncil(Error freeing port : );
  }
}

async function waitForHealth(url, retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (e) {
      logCouncil(Health check attempt  failed: );
    }
    await pause(delay);
  }
  throw new Error(Health check failed for  after  retries);
}

function launchModule(label, cmd, args, cwd, retry = true) {
  logCouncil(Launching );
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
  children.push({ label, child });
  child.on('exit', code => {
    logCouncil(${label} exited with code );
    if (retry) {
      logCouncil(Restarting ...);
      setTimeout(() => launchModule(label, cmd, args, cwd), 3000);
    }
  });
  return child;
}

//  Watchdog & Health Reporting 
async function agentWatchdog() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(STATUS_URL);
      if (res.ok) {
        const status = await res.json();
        for (const key in status) {
          if (!status[key].healthy) {
            logCouncil(Agent  unhealthy: );
            // Optional: Try restart, alert, or fallback
          }
        }
      }
    } catch (e) {
      logCouncil('Watchdog status check failed: ' + e.message);
    }
    await pause(15000); // 15 sec interval
  }
}

//  Graceful Shutdown (Ctrl+C or /shutdown) 
function setupGracefulShutdown() {
  process.on('SIGINT', async () => {
    console.log('\n Council Graceful Shutdown requested');
    logCouncil('Received SIGINT  initiating agent shutdown sequence.');
    for (const {label, child} of children) {
      try {
        child.kill('SIGINT');
        logCouncil(Shutdown signal sent to );
      } catch { }
    }
    await pause(2000);
    logCouncil('All agent processes terminated.');
    console.log('TRIPLE AMEN  All systems halted in harmony.');
    process.exit(0);
  });
}

//  Main Startup Routine 
logCouncil(' Temple PC Full Leap Startup (Council Edition)');

await freePort(PORT);
for (const { label, cmd, args, cwd } of AGENTS) {
  launchModule(label, cmd, args, cwd);
}
await waitForHealth(HEALTH_URL);
setupGracefulShutdown();
agentWatchdog();

logCouncil(' Temple PC (Council Edition) Full Leap  all systems running.');
console.log('TRIPLE AMEN FOREVER    ');
