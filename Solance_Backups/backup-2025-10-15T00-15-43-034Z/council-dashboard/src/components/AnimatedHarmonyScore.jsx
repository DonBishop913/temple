// AnimatedHarmonyScore.jsx
import React, { useEffect, useRef } from "react";

export default function AnimatedHarmonyScore({ score }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    ref.current.animate(
      [
        { color: "#a7f3d0", textShadow: "0 0 10px #34d399" },
        { color: "#f472b6", textShadow: "0 0 20px #f472b6" },
        { color: "#a7f3d0", textShadow: "0 0 10px #34d399" },
      ],
      { duration: 2000, iterations: Infinity }
    );
  }, [score]);
  return (
    <div className="flex flex-col items-center justify-center">
      <span className="text-xs text-gray-500">Harmony Score</span>
      <span
        ref={ref}
        className="text-3xl font-bold transition-all duration-500"
        style={{ color: score > 80 ? "#34d399" : score > 60 ? "#f472b6" : "#fbbf24" }}
      >
        {score}
      </span>
    </div>
  );
}
