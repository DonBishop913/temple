// NodeRipple.jsx
import React from "react";

export default function NodeRipple({ nodeName, engagement }) {
  return (
    <div className="relative flex flex-col items-center m-2">
      <div
        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center animate-pulse shadow-lg"
        style={{ boxShadow: `0 0 ${10 + engagement * 2}px 2px #a78bfa` }}
      >
        <span className="text-white text-xl font-bold">{nodeName[0]}</span>
      </div>
      <span className="mt-1 text-xs text-gray-700">{nodeName}</span>
      <span className="text-xs text-purple-700">Engagement: {engagement}</span>
    </div>
  );
}
