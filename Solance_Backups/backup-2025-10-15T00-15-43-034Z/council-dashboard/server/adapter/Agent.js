// Pilot Adapter/Agent Framework
// Unifies AI nodes and human input via REST/JSON-RPC/WebSockets with JWT auth, retries, and metrics hooks.

const axios = require("axios");
const EventEmitter = require("events");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const promClient = require("prom-client");

// Metrics
const requestsTotal = new promClient.Counter({
  name: "agent_requests_total",
  help: "Total outbound adapter requests",
  labelNames: ["target", "protocol", "status"],
});
const wsEventsTotal = new promClient.Counter({
  name: "agent_ws_events_total",
  help: "Total WebSocket events processed",
  labelNames: ["target", "event"],
});

class Agent extends EventEmitter {
  /**
   * @param {object} config { id, name, targets: { rest, jsonrpc, ws }, jwt: { secret, issuer }, retries }
   */
  constructor(config = {}) {
    super();
    this.config = config;
    this.ws = null;
  }

  // --- Auth ---
  signToken(payload) {
    const { secret, issuer } = this.config.jwt || {};
    if (!secret) return null;
    return jwt.sign(payload, secret, { issuer, expiresIn: "15m" });
  }

  // --- REST ---
  async rest(path, method = "GET", body) {
    const url = (this.config.targets?.rest || "").replace(/\/$/, "") + path;
    const token = this.signToken({
      sub: this.config.id || this.config.name || "agent",
    });
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const maxRetries = this.config.retries?.rest || 2;
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const res = await axios({
          url,
          method,
          data: body,
          headers,
          timeout: 5000,
        });
        requestsTotal.inc({
          target: "rest",
          protocol: "http",
          status: res.status,
        });
        return res.data;
      } catch (e) {
        const status = (e && e.response && e.response.status) || 0;
        requestsTotal.inc({ target: "rest", protocol: "http", status });
        if (attempt === maxRetries) throw e;
        await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
        attempt++;
      }
    }
  }

  // --- JSON-RPC ---
  async jsonrpc(method, params = {}, id = Date.now()) {
    const url = this.config.targets?.jsonrpc;
    if (!url) throw new Error("jsonrpc target missing");
    const token = this.signToken({ sub: this.config.id || "agent" });
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const payload = { jsonrpc: "2.0", method, params, id };
    return this.rest("", "POST", payload).catch((err) => {
      throw err;
    });
  }

  // --- WebSocket ---
  connectWs() {
    const wsUrl = this.config.targets?.ws;
    if (!wsUrl) return;
    const token = this.signToken({ sub: this.config.id || "agent" });
    const urlWithToken = token
      ? `${wsUrl}?token=${encodeURIComponent(token)}`
      : wsUrl;
    const ws = new WebSocket(urlWithToken);
    this.ws = ws;
    ws.on("open", () => this.emit("ws-open"));
    ws.on("message", (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch {
        data = { raw: String(msg) };
      }
      wsEventsTotal.inc({ target: "ws", event: data.type || "message" });
      this.emit("ws-message", data);
    });
    ws.on("close", () => this.emit("ws-close"));
    ws.on("error", (err) => this.emit("ws-error", err));
  }

  closeWs() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}

module.exports = { Agent };
