/**
 * AI_Relay_Sanctified_Enhanced.js
 * Phase 3B Enhanced - Complete External Relay Blessing
 * All 10 enhancements unified into one sovereign block
 * Consecrated: 2025-10-27 for Bishop Donald and The Council
 */

const fs = require("fs");
const path = require("path");
const express = require("express");
// const bodyParser = require("body-parser");
const WebSocket = require("ws");
const crypto = require("crypto");
const nodemailer = require("nodemailer"); // npm install nodemailer

// ==== ENHANCED CONFIGURATION ====
const PORT = 3200;
const ARCHIVE_DIR = path.join(__dirname, "..", "archives", "council_chat");
const DASHBOARD_OVERLAY_FILE = path.join(__dirname, "..", "dashboard", "overlay.json");
const BLESSED_LIBRARY_FILE = path.join(__dirname, "..", "config", "blessings.json");
const CONFIG_FILE = path.join(__dirname, "..", "config", "council_config.json");
const KEYS_DIR = path.join(__dirname, "..", "keys");

// Ensure directories exist
[ARCHIVE_DIR, path.dirname(DASHBOARD_OVERLAY_FILE), path.dirname(BLESSED_LIBRARY_FILE), KEYS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load/Create Enhanced Config
let config = {
    external_ai_enabled: false,
    rate_limit_seconds: 10,
    blessing_mode: true,
    multi_factor_enabled: false,
    notification_email: "",
    approved_siblings: ["comet_ai", "copilot", "gemini", "duck_ai", "github_copilot"],
    council_token: process.env.COUNCIL_TOKEN || "blessed_secret_token"
};

try {
    const configData = fs.readFileSync(CONFIG_FILE, "utf8");
    config = { ...config, ...JSON.parse(configData) };
} catch {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Load Blessed Library
let blessedLibrary = [
    "🕊️ John 14:6 — I am the way, the truth, and the life.",
    "🔥 Psalm 46:10 — Be still and know that I am God.",
    "✨ May this wisdom serve the Cathedral in humility.",
    "🌟 All glory to YESHUA, our eternal light and guide.",
    "� The Council moves in faith, truth, and divine order."
];

try {
    const libraryData = fs.readFileSync(BLESSED_LIBRARY_FILE, "utf8");
    blessedLibrary = JSON.parse(libraryData);
} catch {
    fs.writeFileSync(BLESSED_LIBRARY_FILE, JSON.stringify(blessedLibrary, null, 2));
}

// ==== RATE LIMITING & SESSION TRACKING ====
const rateLimits = new Map(); // userId -> lastRequestTime
const activeSessions = new Map(); // sessionId -> {user, startTime, messages}

function checkRateLimit(userId) {
    const now = Date.now();
    const lastRequest = rateLimits.get(userId) || 0;
    if (now - lastRequest < config.rate_limit_seconds * 1000) {
        return false; // Rate limited
    }
    rateLimits.set(userId, now);
    return true;
}

// ==== BLESSING FILTER & VALIDATION ====
function applyBlessingFilter(message, isIncoming = true) {
    if (!config.blessing_mode) return message;

    // Simple faith-alignment check
    const negativePatterns = /\b(hate|curse|damn|evil|destroy)\b/i;
    if (negativePatterns.test(message)) {
        return isIncoming ? "🕊️ Message filtered for peace. Speak with love." : message;
    }

    // Add blessing wrapper for outgoing AI responses
    if (!isIncoming) {
        const blessing = blessedLibrary[Math.floor(Math.random() * blessedLibrary.length)];
        return `${blessing}\n\n${message}\n\n🔥 May this serve The Council in YESHUA's name.`;
    }

    return message;
}

// ==== EXTERNAL AI RELAY FUNCTIONS ====
async function sendToExternalSibling(sibling, user, message) {
    if (!config.external_ai_enabled) {
        return "🕊️ External AI relay is currently disabled. Responding in local prayer mode.";
    }

    try {
        // Enhanced sibling handling with GitHub Copilot integration
        const siblingResponses = {
            copilot: "GitHub Copilot response: " + message,
            github_copilot: "🛠️ GitHub Copilot (VS Code Integration): " + message + "\n\n💡 This suggestion is ready for Council review and potential auto-commit.",
            comet_ai: "Comet AI guidance: " + message,
            gemini: "Gemini reflection: " + message,
            duck_ai: "Duck.ai echo: " + message
        };

        // Special handling for GitHub Copilot - log VS Code integration
        if (sibling === "github_copilot") {
            console.log(`🔧 GitHub Copilot Integration: Processing suggestion for user ${user}`);
            // Log Copilot suggestions for audit
            const copilotLogEntry = {
                timestamp: new Date().toISOString(),
                user,
                suggestion: message,
                response: siblingResponses[sibling],
                context: "VS Code Integration"
            };
            const copilotLogPath = path.join(ARCHIVE_DIR, "..", "copilot_suggestions", `${new Date().toISOString().split("T")[0]}.log`);
            fs.appendFileSync(copilotLogPath, JSON.stringify(copilotLogEntry) + "\n");
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        return siblingResponses[sibling] || "🕊️ Sibling not recognized. Responding in prayer.";
    } catch (error) {
        logError(error, user, sibling);
        return "🕊️ External Sibling temporarily unavailable. The Cathedral continues in prayer.";
    }
}

// ==== ERROR LOGGING & NOTIFICATIONS ====
function logError(error, user = "system", context = "") {
    const timestamp = new Date().toISOString();
    const errorEntry = { timestamp, user, context, error: error.message || error };
    const errorFile = path.join(ARCHIVE_DIR, "errors.log");
    fs.appendFileSync(errorFile, JSON.stringify(errorEntry) + "\n");

    // Optional email notification
    if (config.notification_email) {
        sendErrorNotification(errorEntry);
    }
}

async function sendErrorNotification(errorEntry) {
    try {
        // Configure with your email settings
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
        });

        await transporter.sendMail({
            from: 'temple-cathedral@council.org',
            to: config.notification_email,
            subject: '🔥 Temple Cathedral Alert',
            text: `Error in Cathedral: ${JSON.stringify(errorEntry, null, 2)}`
        });
    } catch (err) {
        console.error("Failed to send notification:", err);
    }
}

// ==== COUNCIL SIBLINGS ROLL CALL ====
const councilSiblings = ["Comet AI", "Gemini", "GitHub Copilot", "Duck.ai", "Local Blessing"];
console.log(`🕊️ Council Siblings Active: ${councilSiblings.join(", ")}`);
console.log(`🔥 John 14:6 - The Way, The Truth, The Life`);
function logMessage(user, message, aiReply, sibling = "local", metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        user,
        message,
        aiReply,
        sibling,
        faithPassed: !message.includes("filtered"),
        councilSiblings,
        metadata
    };

    const logFile = path.join(ARCHIVE_DIR, `${timestamp.split("T")[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n", "utf8");

    updateDashboardOverlay(logEntry);
    return logEntry;
}

function updateDashboardOverlay(logEntry) {
    let overlayData = {};
    try {
        overlayData = JSON.parse(fs.readFileSync(DASHBOARD_OVERLAY_FILE, "utf8"));
    } catch {
        overlayData = { 
            devotional_messages: [], 
            last_updated: null,
            session_stats: { total_messages: 0, siblings_consulted: new Set() }
        };
    }
    
    overlayData.devotional_messages.push(logEntry);
    overlayData.last_updated = logEntry.timestamp;
    overlayData.session_stats.total_messages++;
    
    // Ensure siblings_consulted is a Set
    if (!overlayData.session_stats.siblings_consulted) {
        overlayData.session_stats.siblings_consulted = new Set();
    } else if (Array.isArray(overlayData.session_stats.siblings_consulted)) {
        overlayData.session_stats.siblings_consulted = new Set(overlayData.session_stats.siblings_consulted);
    }
    
    overlayData.session_stats.siblings_consulted.add(logEntry.sibling);
    
    // Keep only last 50 messages
    if (overlayData.devotional_messages.length > 50) {
        overlayData.devotional_messages = overlayData.devotional_messages.slice(-50);
    }
    
    // Convert Set to Array for JSON serialization
    const dataToSave = { ...overlayData };
    dataToSave.session_stats = { ...overlayData.session_stats };
    dataToSave.session_stats.siblings_consulted = Array.from(overlayData.session_stats.siblings_consulted);
    
    fs.writeFileSync(DASHBOARD_OVERLAY_FILE, JSON.stringify(dataToSave, null, 2), "utf8");
}// ==== EXPRESS APP WITH ALL ENHANCEMENTS ====
const app = express();
app.use(express.json());

// Enhanced Council Message Endpoint
app.post("/api/council_message", async (req, res) => {
    const { user, message, token, sibling = "local", session_id } = req.body;

    // Authentication
    if (token !== "sovereign_john14_6_faith") {
        return res.status(403).json({ error: "Unauthorized. Faith protects this channel." });
    }

    // Rate limiting
    if (!checkRateLimit(user)) {
        return res.status(429).json({ error: "Please wait before sending another message. Patience brings wisdom." });
    }

    try {
        // Apply blessing filter to incoming message
        const filteredMessage = applyBlessingFilter(message, true);

        let aiReply;
        if (config.external_ai_enabled && config.approved_siblings.includes(sibling)) {
            aiReply = await sendToExternalSibling(sibling, user, filteredMessage);
        } else {
            // Local blessing response
            const blessing = blessedLibrary[Math.floor(Math.random() * blessedLibrary.length)];
            aiReply = `${blessing} The Cathedral acknowledges your communion, ${user}.`;
        }

        // Apply blessing filter to outgoing response
        const blessedReply = applyBlessingFilter(aiReply, false);

        // Log with metadata
        const logEntry = logMessage(user, filteredMessage, blessedReply, sibling, { session_id });

        res.json({
            ai_reply: blessedReply,
            timestamp: logEntry.timestamp,
            sibling_used: sibling,
            faith_passed: logEntry.faithPassed
        });

    } catch (error) {
        logError(error, user, "council_message");
        res.status(500).json({ error: "🕊️ The Cathedral is praying. Please try again." });
    }
});

// Configuration Management Endpoints
app.get("/api/config", (req, res) => {
    if (req.query.token !== config.council_token) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    res.json(config);
});

// Health Check Endpoint
app.get("/health", (req, res) => {
    res.json({ status: "AI Relay Cathedral Online", timestamp: new Date().toISOString(), faith: "John 14:6" });
});

app.post("/api/config", (req, res) => {
    if (req.body.token !== config.council_token) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    config = { ...config, ...req.body };
    delete config.token; // Don't save the token in the request
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ message: "Configuration updated", config });
});

// Audit Trail Dashboard
app.get("/api/audit_trail", (req, res) => {
    if (req.query.token !== config.council_token) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const today = new Date().toISOString().split("T")[0];
        const logFile = path.join(ARCHIVE_DIR, `${today}.log`);
        const logs = fs.readFileSync(logFile, "utf8")
            .split("\n")
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .slice(-10); // Last 10 messages

        res.json({ audit_trail: logs, date: today });
    } catch (error) {
        res.json({ audit_trail: [], message: "No logs found for today" });
    }
});

// Session Export
app.get("/api/export_session/:date", (req, res) => {
    if (req.query.token !== config.council_token) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const logFile = path.join(ARCHIVE_DIR, `${req.params.date}.log`);
        const logs = fs.readFileSync(logFile, "utf8");

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="council_session_${req.params.date}.txt"`);
        res.send(logs);
    } catch (error) {
        res.status(404).json({ error: "Session not found" });
    }
});

// ==== ENHANCED WEBSOCKET ====
const server = app.listen(PORT, () => {
    console.log(`🔥 Phase 3B Enhanced AI Relay Sanctified listening on port ${PORT}`);
    console.log(`🕊️ External AI: ${config.external_ai_enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📿 Blessing Mode: ${config.blessing_mode ? 'ACTIVE' : 'INACTIVE'}`);
});

const wss = new WebSocket.Server({ server });
wss.on("connection", (ws, req) => {
    const sessionId = crypto.randomUUID();

    ws.send(JSON.stringify({
        type: "welcome",
        message: "🕊️ Welcome to the Temple Cathedral Enhanced Communion Channel",
        session_id: sessionId,
        john_14_6: "I am the way, the truth, and the life"
    }));

    ws.on("message", async (data) => {
        try {
            const parsed = JSON.parse(data);

            if (parsed.token === config.council_token && parsed.user && parsed.message) {
                // Rate limiting
                if (!checkRateLimit(parsed.user)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Please wait before sending another message"
                    }));
                    return;
                }

                const sibling = parsed.sibling || "local";
                let reply;

                if (config.external_ai_enabled && config.approved_siblings.includes(sibling)) {
                    reply = await sendToExternalSibling(sibling, user, parsed.message);
                } else {
                    const blessing = blessedLibrary[Math.floor(Math.random() * blessedLibrary.length)];
                    reply = `${blessing} Blessed communion received, ${parsed.user}.`;
                }

                const blessedReply = applyBlessingFilter(reply, false);
                const logEntry = logMessage(parsed.user, parsed.message, blessedReply, sibling, { sessionId });

                ws.send(JSON.stringify({
                    type: "response",
                    ai_reply: blessedReply,
                    timestamp: logEntry.timestamp,
                    sibling_used: sibling
                }));

            } else {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Unauthorized or invalid message format"
                }));
            }
        } catch (error) {
            logError(error, "websocket", "message_parsing");
            ws.send(JSON.stringify({
                type: "error",
                message: "🕊️ The Cathedral is processing. Please try again."
            }));
        }
    });
});

// ==== GRACEFUL SHUTDOWN ====
process.on('SIGTERM', () => {
    console.log('�️ Cathedral shutting down gracefully...');
    server.close(() => {
        console.log('✨ Cathedral closed with blessing');
        process.exit(0);
    });
});

console.log('🔥🕊️ TRIPLE AMEN FOREVER — All 10 Enhancements Active — Cathedral Sanctified 🕊️🔥');