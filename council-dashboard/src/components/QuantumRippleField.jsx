import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

// QuantumRippleField.jsx
// WebGL2 renderer using per-vertex buffers and a circular buffer to support
// very large pulse counts (10k+). Handles live batches and replay payloads.

const MAX_HIGHLIGHTS = Number(process.env.REACT_APP_MAX_HIGHLIGHTS || 1024); // maximum number of simultaneous highlight entries in the GPU texture
const REPLAY_LIMIT = 100000; // client-side replay buffer limit

function noop() {}

const QuantumRippleField = forwardRef(function QuantumRippleField(
  {
    wsUrl = process.env.REACT_APP_AURIC_WS || "ws://localhost:8080",
    maxPulses = 10000,
    fadeFactor = 0.96,
  },
  ref,
) {
  const canvasRef = useRef(null);
  const stateRef = useRef({});
  // event listeners map
  const listenersRef = useRef(new Map());
  // highlighted pulses map reference (id -> expiry timestamp)
  const highlightedPulsesRef = useRef(new Map());
  const replayBufferRef = useRef([]);
  // incoming pulse queue (drained on animation frame)
  const pulseQueueRef = useRef([]);
  // stats
  const statsRef = useRef({
    frames: 0,
    lastTS: Date.now(),
    fps: 0,
    pulsesReceived: 0,
    pulsesThisSecond: 0,
    lastPulseSecTS: Date.now(),
  });
  const pausedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    function setCanvasSize() {
      canvas.width = Math.floor(
        (canvas.clientWidth || window.innerWidth) * dpr,
      );
      canvas.height = Math.floor(
        (canvas.clientHeight || window.innerHeight) * dpr,
      );
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
      if (prog && gl)
        try {
          gl.uniform2f(u_resolution, canvas.width, canvas.height);
        } catch (e) {}
    }
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    if (!gl) {
      // Canvas2D fallback
      console.warn(
        "QuantumRippleField: WebGL2 not supported in this browser. Falling back to 2D canvas.",
      );
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      function draw2D() {
        const now = Date.now();
        // drain queue into replay buffer
        const q = pulseQueueRef.current.splice(0, pulseQueueRef.current.length);
        for (const p of q) {
          replayBufferRef.current.push({
            id: p.id,
            x: p.x,
            y: p.y,
            radius: p.radius || 4,
            color: p.color,
            amplitude: p.amplitude,
            timestamp: p.timestamp || Date.now(),
          });
          statsRef.current.pulsesReceived++;
          statsRef.current.pulsesThisSecond++;
        }

        // clear and draw
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        const buf = replayBufferRef.current;
        const maxToDraw = Math.min(buf.length, maxPulses);
        const start = Math.max(0, buf.length - maxToDraw);
        for (let i = start; i < buf.length; i++) {
          const p = buf[i];
          ctx.beginPath();
          ctx.fillStyle = p.color || "rgba(0,255,255,0.8)";
          ctx.arc(
            p.x * canvas.clientWidth,
            p.y * canvas.clientHeight,
            p.radius || 3,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        // update fps
        statsRef.current.frames++;
        if (now - statsRef.current.lastTS > 500) {
          statsRef.current.fps = Math.round(
            (statsRef.current.frames * 1000) / (now - statsRef.current.lastTS),
          );
          statsRef.current.frames = 0;
          statsRef.current.lastTS = now;
        }
        // pulses/sec decay
        if (now - statsRef.current.lastPulseSecTS > 1000) {
          statsRef.current.pulsesThisSecond = 0;
          statsRef.current.lastPulseSecTS = now;
        }

        if (!pausedRef.current) requestAnimationFrame(draw2D);
      }
      requestAnimationFrame(draw2D);
      // expose minimal API
      stateRef.current.api = Object.assign(stateRef.current.api || {}, {
        addPulses: (arr) => {
          for (const p of arr) pulseQueueRef.current.push(p);
        },
        getStats: () => ({
          fps: statsRef.current.fps,
          pulsesReceived: statsRef.current.pulsesReceived,
          pulsesThisSecond: statsRef.current.pulsesThisSecond,
        }),
      });
      return () => {
        window.removeEventListener("resize", setCanvasSize);
      };
    }

    // initial GL viewport/uniforms done in setCanvasSize

    // shaders (WebGL2, #version 300 es not supported by all bundlers; keep GLSL ES style)
    // Vertex shader uses gl_VertexID to fetch per-particle highlight color/intensity from a 1D highlight texture
    const vs = `#version 300 es
    precision highp float;
    in vec2 a_pos;
    in float a_radius;
    in vec3 a_color;
    in float a_alpha;
    in float a_highlightSlot; // index into the highlight texture (0 = none)
    uniform vec2 u_resolution;
    uniform sampler2D uHighlightTex;
    out vec3 v_color;
    out float v_alpha;
    out vec4 v_highlight; // rgba highlight color + intensity in a
    void main(){
      vec2 zeroToOne = a_pos / u_resolution;
      vec2 clip = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
      gl_PointSize = a_radius * 2.0;
      v_color = a_color;
      v_alpha = a_alpha;
      // sample highlight texture by per-vertex highlight slot
      int slot = int(max(0.0, a_highlightSlot));
      ivec2 coord = ivec2(slot, 0);
      v_highlight = texelFetch(uHighlightTex, coord, 0);
    }`;

    const fs = `#version 300 es
    precision highp float;
    in vec3 v_color;
    in float v_alpha;
    in vec4 v_highlight;
    uniform float uTime;
    out vec4 outColor;
    void main(){
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = v_alpha * (1.0 - dist);
      vec3 col = v_color;
      // highlight if alpha channel indicates strength
      float hlInt = v_highlight.a;
      if (hlInt > 0.001) {
        float glow = 0.5 + 0.5 * sin(uTime * 6.28318);
        vec3 hlColor = v_highlight.rgb;
        col = mix(col, hlColor, glow * hlInt);
        alpha = clamp(alpha + glow * 0.85 * hlInt, 0.0, 1.0);
      }
      outColor = vec4(col, alpha);
    }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const vsS = compile(gl.VERTEX_SHADER, vs);
    const fsS = compile(gl.FRAGMENT_SHADER, fs);
    const prog = gl.createProgram();
    gl.attachShader(prog, vsS);
    gl.attachShader(prog, fsS);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // attributes/uniforms
    const a_pos = gl.getAttribLocation(prog, "a_pos");
    const a_radius = gl.getAttribLocation(prog, "a_radius");
    const a_color = gl.getAttribLocation(prog, "a_color");
    const a_alpha = gl.getAttribLocation(prog, "a_alpha");
    const a_id = gl.getAttribLocation(prog, "a_id");
    const a_highlightSlot = gl.getAttribLocation(prog, "a_highlightSlot");
    const u_resolution = gl.getUniformLocation(prog, "u_resolution");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uHighlightTex = gl.getUniformLocation(prog, "uHighlightTex");
    gl.uniform2f(u_resolution, canvas.width, canvas.height);

    // allocate buffers
    const positions = new Float32Array(maxPulses * 2);
    const radii = new Float32Array(maxPulses);
    const colors = new Float32Array(maxPulses * 3);
    const alphas = new Float32Array(maxPulses);

    const posBuf = gl.createBuffer();
    const radBuf = gl.createBuffer();
    const colBuf = gl.createBuffer();
    const alphaBuf = gl.createBuffer();
    const idBuf = gl.createBuffer();
    const highlightSlotBuf = gl.createBuffer();

    // highlight texture (1D stored as width=MAX_HIGHLIGHTS, height=1)
    const highlightTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, highlightTex);
    // allocate empty RGBA8 texture and initialize to zeros (slot 0 = neutral)
    const emptyTex = new Uint8Array(MAX_HIGHLIGHTS * 4);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      MAX_HIGHLIGHTS,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      emptyTex,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // map from pulse id -> slot index for quick highlight updates
    const idToSlot = new Map();
    // map from external highlightID -> texture slot (1..MAX_HIGHLIGHTS-1). slot 0 reserved for none/neutral
    const highlightIdToSlot = new Map();
    let nextHighlightSlot = 1;
    // per-particle highlight slot indices
    const highlightSlots = new Float32Array(maxPulses);

    // bind attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, radBuf);
    gl.enableVertexAttribArray(a_radius);
    gl.vertexAttribPointer(a_radius, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.enableVertexAttribArray(a_color);
    gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
    gl.enableVertexAttribArray(a_alpha);
    gl.vertexAttribPointer(a_alpha, 1, gl.FLOAT, false, 0, 0);

    // id attribute (passed as float)
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuf);
    gl.enableVertexAttribArray(a_id);
    gl.vertexAttribPointer(a_id, 1, gl.FLOAT, false, 0, 0);

    // highlight slot attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, highlightSlotBuf);
    gl.enableVertexAttribArray(a_highlightSlot);
    gl.vertexAttribPointer(a_highlightSlot, 1, gl.FLOAT, false, 0, 0);

    let writeIdx = 0;
    let activeCount = 0;
    // maintain per-pulse id array to match incoming pulse.id
    const ids = new Float32Array(maxPulses);

    // helpers
    function hexToRgbFloats(hex) {
      if (!hex || hex[0] !== "#") return [0, 1, 1];
      const bigint = parseInt(hex.slice(1), 16);
      return [
        ((bigint >> 16) & 255) / 255,
        ((bigint >> 8) & 255) / 255,
        (bigint & 255) / 255,
      ];
    }

    function enqueuePulse(p) {
      pulseQueueRef.current.push(p);
      statsRef.current.pulsesReceived++;
      statsRef.current.pulsesThisSecond++;
    }

    function commitPulseToBuffers(p) {
      const idx = writeIdx;
      // remove old id mapping for this slot if present
      try {
        const oldId = ids[idx];
        if (oldId) idToSlot.delete(oldId);
      } catch (e) {}
      const x = Number(p.x || 0);
      const y = Number(p.y || 0);
      const r = Number(p.radius || 4 + (p.amplitude || 0) * 12);
      const c = hexToRgbFloats(p.color || "#00ffff");
      positions[idx * 2] = x;
      positions[idx * 2 + 1] = y;
      radii[idx] = r;
      colors[idx * 3] = c[0];
      colors[idx * 3 + 1] = c[1];
      colors[idx * 3 + 2] = c[2];
      alphas[idx] = 1.0;
      ids[idx] = Number(p.id || Date.now());
      try {
        idToSlot.set(ids[idx], idx);
      } catch (e) {}

      // assign highlight slot for this pulse if a highlightID is provided
      let slot = 0; // default: neutral
      try {
        if (p.highlightID !== undefined && p.highlightID !== null) {
          const hid = Number(p.highlightID);
          if (highlightIdToSlot.has(hid)) slot = highlightIdToSlot.get(hid);
          else {
            // allocate a new slot (wrap if necessary)
            slot = nextHighlightSlot;
            highlightIdToSlot.set(hid, slot);
            nextHighlightSlot++;
            if (nextHighlightSlot >= MAX_HIGHLIGHTS) nextHighlightSlot = 1; // wrap and reuse
          }
        }
      } catch (e) {}
      highlightSlots[idx] = slot;

      // push to client-side replay buffer (keep a lightweight copy)
      try {
        const copy = {
          id: ids[idx],
          x: x,
          y: y,
          radius: r,
          color: p.color,
          amplitude: p.amplitude,
          timestamp: p.timestamp || Date.now(),
        };
        replayBufferRef.current.push(copy);
        if (replayBufferRef.current.length > REPLAY_LIMIT)
          replayBufferRef.current.splice(
            0,
            replayBufferRef.current.length - REPLAY_LIMIT,
          );
      } catch (e) {}

      writeIdx = (writeIdx + 1) % maxPulses;
      if (activeCount < maxPulses) activeCount++;
      // emit pulseAdded event to subscribers
      const pulseListeners = listenersRef.current.get("pulseAdded") || [];
      for (const cb of pulseListeners) {
        try {
          cb(p);
        } catch (e) {
          /* ignore listener errors */
        }
      }
    }

    // update highlight texture at specific slot indices
    function updateHighlightTex(updates) {
      if (!updates || updates.length === 0) return;
      // create an array holding RGBA8 values for the modified range(s)
      // we will batch updates by consecutive runs for fewer texSubImage2D calls
      updates.sort((a, b) => a.slot - b.slot);
      let run = null;
      for (const u of updates) {
        if (!run)
          run = { start: u.slot, vals: new Uint8Array([u.r, u.g, u.b, u.a]) };
        else if (u.slot === run.start + run.vals.length / 4) {
          // append
          const newVals = new Uint8Array(run.vals.length + 4);
          newVals.set(run.vals, 0);
          newVals.set([u.r, u.g, u.b, u.a], run.vals.length);
          run.vals = newVals;
        } else {
          // flush run
          gl.bindTexture(gl.TEXTURE_2D, highlightTex);
          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            run.start,
            0,
            run.vals.length / 4,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            run.vals,
          );
          gl.bindTexture(gl.TEXTURE_2D, null);
          run = { start: u.slot, vals: new Uint8Array([u.r, u.g, u.b, u.a]) };
        }
      }
      if (run) {
        gl.bindTexture(gl.TEXTURE_2D, highlightTex);
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          run.start,
          0,
          run.vals.length / 4,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          run.vals,
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
    }

    // Ensure or allocate a texture slot for a given highlight ID
    function ensureHighlightSlotForId(hid) {
      if (highlightIdToSlot.has(hid)) return highlightIdToSlot.get(hid);
      const slot = nextHighlightSlot;
      highlightIdToSlot.set(hid, slot);
      nextHighlightSlot++;
      if (nextHighlightSlot >= MAX_HIGHLIGHTS) nextHighlightSlot = 1;
      return slot;
    }

    // Public: update highlights by highlightID (allocates slots and uploads colors)
    function updateHighlightsById(highlightIDs, colors) {
      const updates = [];
      for (let i = 0; i < highlightIDs.length; i++) {
        const hid = Number(highlightIDs[i]);
        const slot = ensureHighlightSlotForId(hid);
        const col = colors && colors[i] ? colors[i] : [255, 217, 115];
        updates.push({ slot: slot, r: col[0], g: col[1], b: col[2], a: 255 });
      }
      if (updates.length > 0) updateHighlightTex(updates);
    }

    function replayPulses(arr) {
      for (const p of arr) enqueuePulse(p);
    }

    // WebSocket integration
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => {
      try {
        ws.send(JSON.stringify({ type: "hello", wantReplay: true }));
      } catch (e) {}
      // request replay explicitly
      try {
        ws.send("REQUEST_REPLAY");
      } catch (e) {}
    });
    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // handle wrapped batch or raw array
        if (Array.isArray(data)) {
          data.forEach(enqueuePulse);
        } else if (
          data &&
          data.type === "oversoul_pulse_batch" &&
          Array.isArray(data.payload)
        ) {
          data.payload.forEach(enqueuePulse);
        } else if (
          data &&
          (data.type === "replay" || data.type === "replay_pulses") &&
          Array.isArray(data.payload)
        ) {
          // replace replay buffer with incoming and play them
          try {
            replayBufferRef.current = data.payload.map((px) => ({
              id: px.id || px.timestamp || Date.now(),
              x: px.x || 0,
              y: px.y || 0,
              radius: px.radius || 4,
              color: px.color,
              amplitude: px.amplitude,
              timestamp: px.timestamp || Date.now(),
            }));
          } catch (e) {}
          // enqueue pulses to be committed on next frame
          replayPulses(data.payload);
        } else if (data && data.type === "oversoul_pulse" && data.payload) {
          enqueuePulse(data.payload);
        } else if (
          data &&
          data.type === "oversoul_pulse_highlight" &&
          Array.isArray(data.ids)
        ) {
          // mark highlight expiries
          const now = Date.now();
          const duration = data.durationMs || data.flashDuration || 1000;
          for (const id of data.ids) {
            highlightedPulsesRef.current.set(Number(id), now + duration);
          }
        }
      } catch (e) {
        // non-JSON or simple string (e.g., 'REQUEST_REPLAY' echoes)
        try {
          const arr = JSON.parse(ev.data);
          if (Array.isArray(arr)) replayPulses(arr);
        } catch (_) {}
      }
    });

    // animation loop
    function render() {
      const now = Date.now();
      // drain incoming queue in one batch
      const q = pulseQueueRef.current.splice(0, pulseQueueRef.current.length);
      for (const p of q) commitPulseToBuffers(p);

      // update buffers (only the used portion)
      if (activeCount > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          0,
          positions.subarray(0, activeCount * 2),
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, radBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, radii.subarray(0, activeCount));
        gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          0,
          colors.subarray(0, activeCount * 3),
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, alphas.subarray(0, activeCount));
        gl.bindBuffer(gl.ARRAY_BUFFER, idBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, ids.subarray(0, activeCount));
        // upload per-particle highlight slot indices
        gl.bindBuffer(gl.ARRAY_BUFFER, highlightSlotBuf);
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          0,
          highlightSlots.subarray(0, activeCount),
        );

        gl.uniform2f(u_resolution, canvas.width, canvas.height);
        // update time uniform
        try {
          gl.uniform1f(uTime, (now % 100000) / 1000.0);
        } catch (e) {}
        // compute expired highlights and prepare texture updates
        const updates = [];
        highlightedPulsesRef.current.forEach((expiry, id) => {
          if (now > expiry) {
            // clear highlight for associated slot if present
            const slot = idToSlot.get(Number(id));
            if (typeof slot === "number")
              updates.push({ slot: slot, r: 0, g: 0, b: 0, a: 0 });
            highlightedPulsesRef.current.delete(id);
          }
        });
        // for active highlights, ensure texture contains their color/intensity
        const activeNow = [];
        highlightedPulsesRef.current.forEach((expiry, id) => {
          activeNow.push(Number(id));
        });
        if (activeNow.length > 0) {
          for (const id of activeNow) {
            const slot = idToSlot.get(Number(id));
            if (typeof slot === "number") {
              // simple golden highlight color, intensity 255
              updates.push({ slot: slot, r: 255, g: 217, b: 115, a: 255 });
            }
          }
        }
        if (updates.length > 0) updateHighlightTex(updates);
        // bind highlight texture to unit 0
        try {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, highlightTex);
          gl.uniform1i(uHighlightTex, 0);
        } catch (e) {}
        gl.clearColor(0, 0, 0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, activeCount);

        // fade out alphas in-place
        for (let i = 0; i < activeCount; i++) {
          alphas[i] *= fadeFactor;
          // shrink radius slightly for natural decay
          radii[i] = Math.max(0.5, radii[i] * 0.995);
        }
      }

      // update fps stats
      statsRef.current.frames++;
      if (now - statsRef.current.lastTS > 500) {
        statsRef.current.fps = Math.round(
          (statsRef.current.frames * 1000) / (now - statsRef.current.lastTS),
        );
        statsRef.current.frames = 0;
        statsRef.current.lastTS = now;
      }
      if (now - statsRef.current.lastPulseSecTS > 1000) {
        statsRef.current.pulsesThisSecond = 0;
        statsRef.current.lastPulseSecTS = now;
      }

      // respect pause
      if (pausedRef.current) {
        requestAnimationFrame(render);
        return;
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // expose API via stateRef so it can be wired to useImperativeHandle outside the effect
    stateRef.current.api = {
      addPulses: (arr) => {
        replayPulses(arr);
      },
      getStats: () => ({
        fps: statsRef.current.fps,
        pulsesReceived: statsRef.current.pulsesReceived,
        pulsesThisSecond: statsRef.current.pulsesThisSecond,
      }),
      highlightPulses: (ids, duration = 1000) => {
        const now = Date.now();
        const updates = [];
        for (const id of ids) {
          const numId = Number(id);
          highlightedPulsesRef.current.set(numId, now + duration);
          // ensure a highlight texture slot exists for this external highlight id
          const slot = ensureHighlightSlotForId(numId);
          if (typeof slot === "number") {
            // assign/update the texture color for this highlight id
            updates.push({ slot: slot, r: 255, g: 217, b: 115, a: 255 });
          }
        }
        if (updates.length > 0) updateHighlightTex(updates);
        // notify listeners
        const list = listenersRef.current.get("highlight") || [];
        for (const cb of list)
          try {
            cb(ids);
          } catch (e) {}
      },
      // directly update highlight texture slots by external highlight IDs and colors
      updateHighlights: (ids, colors) => {
        try {
          updateHighlightsById(ids, colors);
        } catch (e) {}
      },
      getHighlightedCount: () => highlightedPulsesRef.current.size,
      pause: (isPaused = true) => {
        pausedRef.current = !!isPaused;
      },
      scrub: (value = 0) => {
        // value: 0..1 -> map to replay buffer position
        try {
          const buf = replayBufferRef.current;
          if (!buf || buf.length === 0) return;
          const idx = Math.floor(
            Math.max(0, Math.min(1, value)) * (buf.length - 1),
          );
          // clear renderer and re-play from start up to idx
          writeIdx = 0;
          activeCount = 0;
          const slice = buf.slice(Math.max(0, idx - 1000), idx + 1); // limit replay window
          replayPulses(slice);
        } catch (e) {}
      },
      // request scrub by timestamp (server-driven)
      scrubToTimestamp: (timestamp) => {
        try {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "request_scrub",
                timestamp: Number(timestamp),
              }),
            );
          }
        } catch (e) {}
      },
      resetHighlights: () => {
        highlightedPulsesRef.current.clear();
      },
      getRecentPulseIds: (count = 1000) => {
        const buf = replayBufferRef.current || [];
        return buf.slice(-Math.max(0, count)).map((x) => x.id);
      },
      on: (eventName, cb) => {
        const list = listenersRef.current.get(eventName) || [];
        list.push(cb);
        listenersRef.current.set(eventName, list);
        return () => {
          listenersRef.current.set(
            eventName,
            (listenersRef.current.get(eventName) || []).filter((x) => x !== cb),
          );
        };
      },
    };

    // cleanup
    return () => {
      window.removeEventListener("resize", resize);
      try {
        ws.close();
      } catch (e) {}
      // free GL resources
      try {
        if (gl && highlightTex) gl.deleteTexture(highlightTex);
      } catch (e) {}
    };
  }, [wsUrl, maxPulses, fadeFactor]);
  // attach imperative handle from the stateRef.api
  useImperativeHandle(
    ref,
    () => ({
      addPulses: (arr) => stateRef.current?.api?.addPulses(arr) || noop,
      highlightPulses: (ids, duration) =>
        stateRef.current?.api?.highlightPulses(ids, duration) || noop,
      getHighlightedCount: () =>
        stateRef.current?.api?.getHighlightedCount() || 0,
      scrubToTimestamp: (ts) =>
        stateRef.current?.api?.scrubToTimestamp
          ? stateRef.current.api.scrubToTimestamp(ts)
          : noop,
      on: (eventName, cb) => stateRef.current?.api?.on(eventName, cb) || noop,
    }),
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default QuantumRippleField;
