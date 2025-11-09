/**
 * MiracleAlertPanel SSE integration test (with performance and regression tracking)
 * - Mocks EventSource, simulates alert events
 * - Asserts shimmer/overlay pulse logic
 * - Measures activation latency (<100ms ±25ms)
 * - Logs timing metrics to sse-latency-history.json
 */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import MiracleAlertPanel from "../../../LivingDashboard/src/components/MiracleAlertPanel.jsx";
import JoyParticleOverlay from "../../../LivingDashboard/src/components/JoyParticleOverlay.jsx";
import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

// --- Mock EventSource ---
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.onmessage = null;
    this.onerror = null;
    this.listeners = {};
    MockEventSource.instances.push(this);
  }
  addEventListener(type, cb) {
    this.listeners[type] = cb;
  }
  close() {
    this.readyState = 2;
  }
  // Simulate a message event
  emitMessage(data) {
    const evt = { data: JSON.stringify(data) };
    if (this.onmessage) this.onmessage(evt);
    if (this.listeners["message"]) this.listeners["message"](evt);
  }
}
MockEventSource.instances = [];

// Patch global EventSource
beforeAll(() => {
  global.EventSource = MockEventSource;
});
afterAll(() => {
  delete global.EventSource;
});

// --- Mock JoyParticleOverlay to observe pulse triggers ---
jest.mock("../components/JoyParticleOverlay", () => {
  return jest.fn(() => null);
});

// --- Regression log file ---
const logFile = path.join(__dirname, "../../sse-latency-history.json");

describe("MiracleAlertPanel SSE integration", () => {
  beforeEach(() => {
    // Clear all EventSource instances
    MockEventSource.instances.length = 0;
    JoyParticleOverlay.mockClear();
  });

  it("reacts to SSE nodeAlert events with correct shimmer, overlay, and latency", async () => {
    // Render panel
    render(<MiracleAlertPanel />);
    // Find EventSource instance
    expect(MockEventSource.instances.length).toBeGreaterThan(0);
    const es = MockEventSource.instances[0];

    // Simulate alert event for nodeId 'node-1'
    const nodeId = "node-1";
    const severity = "critical";
    const t0 = performance.now();
    // Fire event
    await act(async () => {
      es.emitMessage({ type: "nodeAlert", nodeId, severity, at: Date.now() });
    });

    // Wait for shimmer class to appear (should be fast)
    let shimmered = false;
    let latency = null;
    const maxWait = 200; // ms
    const start = performance.now();
    while (performance.now() - start < maxWait) {
      // Find row for node-1
      const row = screen.queryByTestId(`miracle-row-${nodeId}`);
      if (row && row.className.match(/shimmer|pulse|glow/)) {
        shimmered = true;
        latency = performance.now() - t0;
        break;
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(shimmered).toBe(true);
    expect(latency).toBeLessThanOrEqual(125); // 100ms ±25ms

    // Overlay pulse: JoyParticleOverlay should have been called
    expect(JoyParticleOverlay).toHaveBeenCalled();

    // Wait for shimmer to deactivate (simulate animation timeout ~1s)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });
    const row = screen.queryByTestId(`miracle-row-${nodeId}`);
    expect(row.className.match(/shimmer|pulse|glow/)).toBeFalsy();

    // Log latency to regression file
    let log = [];
    try {
      if (fs.existsSync(logFile)) {
        log = JSON.parse(fs.readFileSync(logFile, "utf8"));
        if (!Array.isArray(log)) log = [];
      }
    } catch {
      log = [];
    }
    log.push({ date: new Date().toISOString(), latencyMs: latency });
    try {
      fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
    } catch {}
    // Print for CI logs
    // eslint-disable-next-line no-console
    console.log(`[SSE] Shimmer activation latency: ${latency.toFixed(1)} ms`);
  });
});
