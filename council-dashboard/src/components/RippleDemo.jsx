import React, { useEffect, useRef, useState } from 'react';

// QuantumRippleField class (canvas-based ripple renderer)
export function QuantumRippleField(container) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const poolSize = 600;
  const pool = [];
  const activeRipples = [];
  let nextIndex = 0;

  function createSprite(size = 256) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const g = c.getContext('2d');
    const cx = size/2, cy = size/2;
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, size/2);
    grad.addColorStop(0.0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(180,230,220,0.75)");
    grad.addColorStop(0.7, "rgba(60,180,170,0.15)");
    grad.addColorStop(1.0, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.beginPath(); g.arc(cx, cy, size/2, 0, Math.PI*2); g.fill();
    return c;
  }

  const sprite = createSprite(512);

  for (let i=0;i<poolSize;i++) pool.push({ alive:false, x:0, y:0, startTime:0, life:2200, maxRadius:200, baseAlpha:0.9, color:'#00C7B7' });

  function allocateRipple() {
    for (let i=0;i<poolSize;i++) {
      const idx = (nextIndex + i) % poolSize;
      if (!pool[idx].alive) { nextIndex = (idx+1)%poolSize; return pool[idx]; }
    }
    // fallback: recycle oldest
    return activeRipples.shift();
  }

  this.spawnRipple = (pulse) => {
    const r = allocateRipple();
    r.alive = true;
    r.x = (typeof pulse.x === 'number') ? pulse.x : (Math.random() * canvas.width);
    r.y = (typeof pulse.y === 'number') ? pulse.y : (Math.random() * canvas.height);
    r.startTime = performance.now();
    r.life = pulse.life || 2200;
    r.maxRadius = Math.max(canvas.width, canvas.height) * (pulse.scale || 0.5);
    r.baseAlpha = (typeof pulse.alpha === 'number') ? pulse.alpha : 0.9;
    r.color = pulse.color || '#00C7B7';
    r.id = pulse.id || `pulse_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    activeRipples.push(r);
  };

  let rafId = null;
  const render = () => {
    const now = performance.now();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i=activeRipples.length-1;i>=0;i--) {
      const ripple = activeRipples[i];
      const age = now - ripple.startTime;
      if (age > ripple.life) { ripple.alive=false; activeRipples.splice(i,1); continue; }
      const progress = age / ripple.life;
      const alpha = (1 - progress) * ripple.baseAlpha;
      const radius = ripple.maxRadius * Math.pow(progress, 0.45) + 1;
      ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(sprite, ripple.x - radius, ripple.y - radius, radius*2, radius*2);
      ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
    }
    rafId = requestAnimationFrame(render);
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr; canvas.height = container.clientHeight * dpr;
    ctx.setTransform(1,0,0,1,0,0);
  };
  window.addEventListener('resize', resize);
  resize(); render();

  this.pause = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } };
  this.resume = () => { if (!rafId) render(); };
  this.reset = () => { activeRipples.length = 0; ctx.clearRect(0,0,canvas.width,canvas.height); };
  this.highlight = (ids) => { /* not implemented: could pulse positions for known ids */ };
  this.scrub = (ts) => { /* optional scrub visual */ };

  this.renderer = { fps: 60, pulsesReceived: 0, pulsesThisSecond: 0 };
}

export default function RippleDemo({ wsUrl = 'ws://localhost:8080' }) {
  const containerRef = useRef(null);
  const fieldRef = useRef(null);
  const wsRef = useRef(null);
  const [stats, setStats] = useState({ fps:0, pulsesReceived:0, pulsesThisSecond:0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const field = new QuantumRippleField(containerRef.current);
    fieldRef.current = field;

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => { setConnected(true); console.log('[RippleDemo] ws open'); };
    ws.onclose = () => { setConnected(false); console.log('[RippleDemo] ws closed'); };
    ws.onerror = (e) => console.error('[RippleDemo] ws error', e);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        // accept oversoul_pulse_batch or oversoul_pulse
        if (msg.type === 'oversoul_pulse_batch' && Array.isArray(msg.payload)) {
          msg.payload.forEach(p => { field.spawnRipple({ id: p.id, color: p.color, x: p.x, y: p.y, life: p.life, scale: 0.6 }); });
        } else if (msg.type === 'oversoul_pulse' && msg.data) {
          field.spawnRipple({ id: msg.data.id || msg.data._id, color: msg.data.color, x: msg.data.x, y: msg.data.y, life: msg.data.life });
        } else if (msg.type === 'oversoul_pulse_highlight') {
          field.highlight(msg.ids || []);
        } else if (msg.type === 'replay') {
          // replay payload could be array of pulses
          const payload = Array.isArray(msg.payload) ? msg.payload : (msg.payload && msg.payload.pulses ? msg.payload.pulses : []);
          payload.forEach(p => field.spawnRipple({ id: p.id, color: p.color, x: p.x, y: p.y }));
        }
      } catch (e) { console.error('[RippleDemo] parse error', e); }
    };
    wsRef.current = ws;

    const id = setInterval(() => {
      // read renderer stats (best-effort)
      try {
        setStats(field.renderer || { fps:0, pulsesReceived:0, pulsesThisSecond:0 });
      } catch (e) {}
    }, 300);

    return () => { try { ws.close(); } catch{}; clearInterval(id); };
  }, [wsUrl]);

  const sendRequestReplay = () => {
    try { wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type:'request_replay', percent:1, batchSize:200 })); } catch (e) {}
  };

  const sendRequestScrub = (msAgo=5000) => {
    try { wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type:'request_scrub', timestamp: Date.now() - msAgo })); } catch (e) {}
  };

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#0b0f14' }}>
      <div ref={containerRef} style={{ flex:1 }} />
      <div style={{ padding:8, background:'#071426', color:'#fff', display:'flex', gap:8, alignItems:'center' }}>
        <div>Status: {connected ? <span style={{color:'#6EE7B7'}}>connected</span> : <span style={{color:'#F87171'}}>disconnected</span>}</div>
        <button onClick={() => fieldRef.current?.pause()}>Pause</button>
        <button onClick={() => fieldRef.current?.resume()}>Resume</button>
        <button onClick={() => fieldRef.current?.reset()}>Reset</button>
        <button onClick={() => { if (fieldRef.current) { for (let i=0;i<10;i++) fieldRef.current.spawnRipple({}); } }}>Burst</button>
        <button onClick={sendRequestReplay}>Request Replay</button>
        <button onClick={() => sendRequestScrub(10000)}>Request Scrub -10s</button>
        <div style={{ marginLeft:'auto' }}>FPS: {stats.fps}, Pulses/sec: {stats.pulsesThisSecond}</div>
      </div>
    </div>
  );
}
