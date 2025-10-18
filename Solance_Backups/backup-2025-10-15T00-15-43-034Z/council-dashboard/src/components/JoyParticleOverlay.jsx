import { useEffect, useState, useRef } from "react";

export function JoyParticleOverlay({
  sseUrl = '/api/telemetry/stream',
  luminalEnabled = true,
  shimmerEnabled = true,
  confidenceColoring = true,
  reduceMotion = false,
  colorBlind = false
}) {
  const [particles, setParticles] = useState([]);
  const [lineShimmers, setLineShimmers] = useState([]);
  const [lineTrails, setLineTrails] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!luminalEnabled) return;
    const eventSource = new EventSource(sseUrl);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data.nodes)) {
          setParticles(data.nodes.map(n => {
            let baseColor = confidenceColoring
              ? `rgba(255, 215, 0, ${0.5 + (n.predictedEngagement || 0) * 0.5})`
              : 'rgba(255,200,50,0.8)';
            if (colorBlind) baseColor = 'rgba(0,200,255,0.8)';
            return {
              x: n.x, y: n.y,
              size: 5 + ((n.predictedEngagement || 0) * 5),
              color: baseColor,
              predictedEngagement: n.predictedEngagement || 0,
              predictedTarget: n.predictedTarget || null,
            };
          }));
          setLineShimmers(generateLineShimmers(data.nodes));
        } else if (data.nodeIds && data.nodeIds.length > 1) {
          const newParticles = generateConstellation(data.nodeIds, data.alertLevel);
          setParticles(newParticles);
          setLineShimmers(generateLineShimmers(newParticles));
        } else {
          setParticles(updateParticles(data));
        }
      } catch {}
    };
    return () => eventSource.close();
  }, [sseUrl, luminalEnabled, confidenceColoring, colorBlind]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!luminalEnabled) return;
      let newLineTrails = { ...lineTrails };
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const shimmer = (lineShimmers[i] && lineShimmers[i][j]) || 0;
          // Heat-map: average engagement
          const engagement = ((p1.predictedEngagement || 0) + (p2.predictedEngagement || 0)) / 2;
          let alpha = 0.2 + 0.3 * Math.abs(Math.sin(shimmer));
          if (!shimmerEnabled) alpha = 0.3;
          let grad0 = confidenceColoring ? (colorBlind ? `rgba(0,200,255,${alpha})` : `rgba(255,${215 - engagement * 100},0,${alpha})`) : 'rgba(255,200,50,0.3)';
          let grad1 = confidenceColoring ? (colorBlind ? `rgba(0,100,255,${alpha})` : `rgba(255,50,0,${alpha})`) : 'rgba(255,200,50,0.3)';
          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, grad0);
          gradient.addColorStop(1, grad1);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1 + (p1.size + p2.size) / 10;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Animated trail particles along the line
          if (!newLineTrails[i]) newLineTrails[i] = {};
          if (!newLineTrails[i][j]) {
            // Initialize a few trail particles per line
            newLineTrails[i][j] = Array.from({ length: 3 }, () => ({ progress: Math.random(), speed: reduceMotion ? 0.002 : 0.005 + engagement * 0.03 }));
          }
          newLineTrails[i][j].forEach(trail => {
            trail.progress += trail.speed;
            if (trail.progress > 1) trail.progress = 0;
            // Interpolate position
            const tx = p1.x + (p2.x - p1.x) * trail.progress;
            const ty = p1.y + (p2.y - p1.y) * trail.progress;
            const size = reduceMotion ? 2 : 2 + engagement * 4;
            ctx.beginPath();
            ctx.arc(tx, ty, size, 0, 2 * Math.PI);
            ctx.fillStyle = colorBlind ? `rgba(0,200,255,${0.3 + 0.5 * engagement})` : `rgba(255,${200 - engagement * 150},0,${0.3 + 0.5 * engagement})`;
            ctx.shadowBlur = reduceMotion ? 0 : 8 + engagement * 12;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        }
      }
      setLineTrails(newLineTrails);
      // Draw nodes
      particles.forEach((p) => {
        let nodeColor = p.color;
        if (!confidenceColoring) nodeColor = 'rgba(255,200,50,0.8)';
        if (colorBlind) nodeColor = 'rgba(0,200,255,0.8)';
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, reduceMotion ? 4 : p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw forecast arrows (direction of predicted surges)
      particles.forEach((p) => {
        if (!p.predictedTarget) return;
        const x = p.x, y = p.y;
        const pt = p.predictedTarget;
        const dx = (pt.x ?? 0) - x;
        const dy = (pt.y ?? 0) - y;
        const angle = Math.atan2(dy, dx);
        const engagement = p.predictedEngagement || 0;
        const arrowLength = reduceMotion ? 20 : 20 + engagement * 40;
        const endX = x + Math.cos(angle) * arrowLength;
        const endY = y + Math.sin(angle) * arrowLength;

        let stroke = confidenceColoring
          ? (colorBlind ? `rgba(0,200,255,${0.5 + engagement * 0.5})` : `rgba(255,${200 - engagement * 150},0,${0.5 + engagement * 0.5})`)
          : 'rgba(255,200,50,0.7)';
        ctx.strokeStyle = stroke;
        ctx.lineWidth = reduceMotion ? 2 : 2 + engagement * 3;
        // main line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        // arrowhead
        const headLength = reduceMotion ? 6 : 6 + engagement * 4;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = stroke;
        ctx.fill();
      });
      // advance shimmer counters
      setLineShimmers(prev => (prev && prev.length)
        ? prev.map(row => row.map(val => val + 0.05))
        : prev
      );
      requestAnimationFrame(draw);
    }
    draw();
  }, [particles, lineShimmers, lineTrails]);

  return <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block', margin: '0 auto', background: 'rgba(10,10,30,0.7)', borderRadius: 16 }} />;
}
// helper: generate constellation pattern
function generateConstellation(nodes, intensity) {
  const coords = nodes.map((node, i) => ({
    x: 200 + i * 200,
    y: 200 + Math.sin(i) * 150,
  }));
  return coords.map((c) => ({
    ...c,
    size: 5 + intensity * 5,
    color: `rgba(255, 215, 0, ${0.5 + intensity * 0.5})`,
    velocity: { x: 0, y: 0 },
  }));
}

// helper: create shimmer counters for lines
function generateLineShimmers(particles) {
  const shimmerMatrix = [];
  for (let i = 0; i < particles.length; i++) {
    shimmerMatrix[i] = [];
    for (let j = 0; j < particles.length; j++) {
      shimmerMatrix[i][j] = Math.random() * Math.PI * 2;
    }
  }
  return shimmerMatrix;
}

// placeholder for regular particle updates
function updateParticles(data) {
  return [];
}
