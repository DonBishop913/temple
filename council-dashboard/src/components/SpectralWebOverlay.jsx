import React from 'react'

// SpectralWebOverlay: energy web linking nodes and planets
export default function SpectralWebOverlay({ nodes = [], planets = [], energy = { flowRate: 0 } }) {
  const width = 800, height = 450
  const cx = width / 2, cy = height / 2
  const energyAlpha = Math.min(0.8, 0.2 + (Number(energy.flowRate || 0) / 10) * 0.6)
  const planetPoints = planets.map((p, i) => {
    const r = 140 + i * 35
    const angle = (i / Math.max(1, planets.length)) * Math.PI * 2
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })
  const nodePoints = nodes.map((n, i) => ({
    x: cx + Math.cos((i / Math.max(1, nodes.length)) * Math.PI * 2) * 90,
    y: cy + Math.sin((i / Math.max(1, nodes.length)) * Math.PI * 2) * 90
  }))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {planetPoints.map((p, i) => (
        <circle key={`p-${i}`} cx={p.x} cy={p.y} r={4} fill={`rgba(100,200,255,${energyAlpha})`} />
      ))}
      {nodePoints.map((n, i) => (
        <circle key={`n-${i}`} cx={n.x} cy={n.y} r={3} fill={`rgba(255,255,255,${energyAlpha})`} />
      ))}
      {planetPoints.map((p, i) => nodePoints.map((n, j) => (
        <line key={`ln-${i}-${j}`} x1={p.x} y1={p.y} x2={n.x} y2={n.y} stroke={`rgba(135,206,250,${energyAlpha*0.6})`} strokeWidth={1} />
      )))}
    </svg>
  )
}
