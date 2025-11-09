import "@testing-library/jest-dom";
// Polyfill TextEncoder/TextDecoder for node tests that depend on them (e.g., supertest)
const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

// Polyfill EventSource for jsdom tests
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.readyState = 1;
  }
  addEventListener(type, handler) {
    if (type === "message") this.onmessage = handler;
    if (type === "error") this.onerror = handler;
  }
  close() {
    this.readyState = 2;
  }
}
global.EventSource = MockEventSource;

// Polyfill WebSocket for jsdom tests
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onopen = null;
    this.onclose = null;
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }
  send() {}
  close() {
    if (this.onclose) this.onclose();
  }
}
global.WebSocket = MockWebSocket;

// jsdom polyfills for libraries expecting browser APIs
if (typeof window !== "undefined") {
  if (!window.URL) window.URL = {};
  if (!window.URL.createObjectURL)
    window.URL.createObjectURL = () => "blob:url";
  // Stub Canvas getContext to avoid plotly/jsdom errors
  if (
    window.HTMLCanvasElement &&
    !window.HTMLCanvasElement.prototype.getContext
  ) {
    window.HTMLCanvasElement.prototype.getContext = () => ({
      // minimal stub
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      measureText: () => ({ width: 0 }),
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
    });
  }
}

// Mock react-plotly.js to a lightweight stub for unit tests
jest.mock("react-plotly.js", () => {
  const React = require("react");
  function PlotStub(props) {
    return React.createElement(
      "div",
      { "data-plotly-stub": true },
      props.layout?.title || "Plotly Heatmap",
    );
  }
  return PlotStub;
});
