import React, { useEffect, useRef } from 'react'

// PlanetOrbits: renders simple animated circular orbits; rotation speed scales with pulseCadence
export default function PlanetOrbits({ planets = [], pulseCadence = 1, glowIntensity = 0.5 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    let raf
    const start = performance.now()
    const animate = (t) => {
      const elapsed = (t - start) / 1000 // seconds
      const container = containerRef.current
      if (container) {
        // rotate container by cadence-scaled speed
        const speed = Math.max(0.1, pulseCadence) * 5 // deg/s
        container.style.transform = `rotate(${(elapsed * speed) % 360}deg)`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [pulseCadence])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {planets.map((p, idx) => {
        const radius = 40 + idx * 25
        const size = 8 + (p.mass || 1) * 2
        const color = p.color || `rgba(135,206,250,${0.4 + glowIntensity * 0.6})`
        return (
          <div key={p.name || idx} style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: `${radius * 2}px`, height: `${radius * 2}px`, borderRadius: '50%',
            border: `1px dashed rgba(255,255,255,${0.25})`, filter: `drop-shadow(0 0 ${4 + glowIntensity * 8}px ${color})`
          }}>
            <div style={{
              position: 'absolute', left: '50%', top: 0,
              width: `${size}px`, height: `${size}px`, marginLeft: `-${size/2}px`, borderRadius: '50%',
              background: color
            }} />
          </div>
        )
      })}
    </div>
  )
}
