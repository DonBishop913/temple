/** @jest-environment node */
const WebSocket = require("ws");

function onceWithTimeout(url, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {}
      reject(new Error("timeout"));
    }, timeoutMs);
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type !== "schumann") return;
        clearTimeout(timer);
        try {
          ws.close();
        } catch {}
        resolve(msg.payload);
      } catch (e) {
        clearTimeout(timer);
        try {
          ws.close();
        } catch {}
        reject(e);
      }
    });
    ws.on("error", (e) => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      reject(e);
    });
  });
}

test("schumann payload shape", async () => {
  const url = "ws://localhost:4322";
  const attempts = 3;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const payload = await onceWithTimeout(url, 5000 + i * 1000);
      expect(payload).toHaveProperty("hz");
      expect(payload).toHaveProperty("sample");
      expect(payload).toHaveProperty("spectrum");
      expect(payload.spectrum).toHaveProperty("fundamental");
      expect(payload.spectrum).toHaveProperty("harmonics");
      return; // success
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr || new Error("failed to receive schumann payload");
});
