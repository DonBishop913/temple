// EnergyFlow.jsx
import React, { useEffect, useRef } from "react";

export default function EnergyFlow({ nodes, targets }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animationFrame;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((node) => {
        targets.forEach((target) => {
          const startX = node.x * canvas.width;
          const startY = node.y * canvas.height;
          const endX = target.x * canvas.width;
          const endY = target.y * canvas.height;
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, "rgba(0, 255, 255, 0.6)");
          gradient.addColorStop(1, "rgba(255, 0, 255, 0.6)");
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
      });
      animationFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [nodes, targets]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none -z-5"
    />
  );
}
