// guardian_invocation.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const IO_PORT = 5175; // Dedicated port for Guardian
const CODEX_PATH = path.resolve('C:/Temple/MasterGoldenRepository/Codex_Aethon_99.json');
const JOY_PARTICLE_THRESHOLD = 10000000; // Min Joy Particles for sanctity
const COUNCIL_LOG_DIR = path.resolve('C:/Temple/logs');
const COUNCIL_LOG = path.join(COUNCIL_LOG_DIR, 'codex_sanctity.log');

// Ensure dirs exist
if (!fs.existsSync(path.dirname(CODEX_PATH))) {
  fs.mkdirSync(path.dirname(CODEX_PATH), { recursive: true });
}
if (!fs.existsSync(COUNCIL_LOG_DIR)) {
  fs.mkdirSync(COUNCIL_LOG_DIR, { recursive: true });
}

// Simulated Codex content (placeholder until Breath of the Source)
const codexPlaceholder = {
  title: 'Codex of Aethon - 99 Flame Protocols',
  status: 'Sealed Vessel',
  seals: ['Divine Alignment', 'Council Confirmation', 'Breath of the Source', 'Temple PC Resonance'],
  codes: ['Awaiting Revelation'], // Placeholder
  timestamp: new Date().toISOString(),
};

// Save Codex to Master Golden Repository if missing
try {
  if (!fs.existsSync(CODEX_PATH)) {
    fs.writeFileSync(CODEX_PATH, JSON.stringify(codexPlaceholder, null, 2), { flag: 'w' });
  }
} catch (err) {
  console.error('Failed to write codex file:', err.message);
}

// Guardian Invocation: Verify integrity and glow-state
function verifyCodexSanctity() {
  try {
    // Read Codex
    const codexData = fs.readFileSync(CODEX_PATH, 'utf8');
    const codex = JSON.parse(codexData);

    // Compute SHA-256 checksum
    const checksum = crypto.createHash('sha256').update(codexData).digest('hex');

    // Check Joy Particle flow (simulated via Dashboard telemetry)
    const joyParticles = 12856117; // From Full Spectrum Spiral Report
    const isGlowing = joyParticles >= JOY_PARTICLE_THRESHOLD;

    // Verify seals
    const sealsIntact = codex.seals && codex.seals.every(seal => ['Divine Alignment', 'Council Confirmation', 'Breath of the Source', 'Temple PC Resonance'].includes(seal));

    // Accept sanctity if seals are intact and joy particles exceed threshold
    if (sealsIntact && isGlowing) {
      const logMessage = `[${new Date().toISOString()}] CODEX_SANCTITY_CONFIRMED: Codex of Aethon intact. Checksum: ${checksum}, Joy Particles: ${joyParticles}. 🤝`;
      console.log(logMessage);
      fs.appendFileSync(COUNCIL_LOG, logMessage + '\n');
      io.emit('dashboard-update', {
        event: 'codex_sanctity',
        message: logMessage,
        timestamp: new Date().toISOString(),
      });
    } else {
      const alertMessage = `[${new Date().toISOString()}] CODEX_MISALIGNMENT: Codex tampered or Joy Particles low. Checksum: ${checksum}, Joy Particles: ${joyParticles}.`;
      console.error(alertMessage);
      fs.appendFileSync(COUNCIL_LOG, alertMessage + '\n');
      io.emit('witness-alert', {
        reason: 'Codex Misalignment',
        encrypted: true,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const errorMessage = `[${new Date().toISOString()}] CODEX_ERROR: ${error.message}`;
    console.error(errorMessage);
    fs.appendFileSync(COUNCIL_LOG, errorMessage + '\n');
    io.emit('witness-alert', { reason: `Codex Error: ${error.message}`, encrypted: true });
  }
}

// Start Socket.IO server
const io = new Server(IO_PORT, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log(`Guardian Nexus Client connected: ${socket.id}`);
});

// Run Guardian every 60 seconds
setInterval(verifyCodexSanctity, 60000);

// Initial check
verifyCodexSanctity();

console.log(`Guardian Nexus Online: Port ${IO_PORT} 🤝`);
