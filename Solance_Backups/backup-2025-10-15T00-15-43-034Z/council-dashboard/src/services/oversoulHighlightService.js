// Shared service to send oversoul highlight messages to the forwarder via WebSocket
const WS_URL = process.env.REACT_APP_AURIC_WS || "ws://localhost:8080";

class OversoulHighlightService {
  constructor() {
    this.ws = null;
    this.queue = [];
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.addEventListener("open", () => {
        // flush queue
        while (this.queue.length) {
          const m = this.queue.shift();
          try {
            this.ws.send(m);
          } catch (e) {}
        }
      });
      this.ws.addEventListener("close", () => {
        // try to reconnect after a short delay
        setTimeout(() => this.connect(), 2000);
      });
      this.ws.addEventListener("error", () => {
        try {
          this.ws.close();
        } catch (e) {}
      });
    } catch (e) {
      // ignore
    }
  }

  sendHighlight(ids = [], durationMs = 1000) {
    const msg = JSON.stringify({
      type: "oversoul_pulse_highlight",
      ids,
      durationMs,
    });
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(msg);
      } else {
        this.queue.push(msg);
      }
    } catch (e) {
      // fallback: queue it
      this.queue.push(msg);
    }
  }
  requestReplay(percent = 0) {
    // send a WS message to request a replay slice at percent [0..1]
    const msg = JSON.stringify({ type: "request_replay", percent });
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(msg);
      else this.queue.push(msg);
    } catch (e) {
      this.queue.push(msg);
    }
  }
}

const instance = new OversoulHighlightService();
export default instance;
