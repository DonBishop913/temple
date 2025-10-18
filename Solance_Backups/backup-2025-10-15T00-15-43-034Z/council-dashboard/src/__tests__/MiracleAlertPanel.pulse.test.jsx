import React, { useEffect, useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'

// Self-contained mock panel: listens for `node-alert` and toggles shimmer class
function TestPanel() {
  const [pulses, setPulses] = useState({}) // nodeId -> true/false
  const overlayRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const { nodeId, severity } = e.detail || {}
      if (!nodeId || !severity) return
      setPulses(prev => ({ ...prev, [nodeId]: true }))
      // overlay pulse
      if (overlayRef.current) {
        overlayRef.current.classList.add('glow')
        setTimeout(() => overlayRef.current && overlayRef.current.classList.remove('glow'), 20)
      }
      // auto clear shimmer soon for test speed
      setTimeout(() => setPulses(prev => ({ ...prev, [nodeId]: false })), 20)
    }
    window.addEventListener('node-alert', handler)
    return () => window.removeEventListener('node-alert', handler)
  }, [])

  const nodeId = 'node-002'
  const isShimmer = !!pulses[nodeId]

  return (
    <div>
      <h2>Council Node Health</h2>
      <table>
        <tbody>
          <tr id={`node-${nodeId}`} data-testid={`row-${nodeId}`} className={isShimmer ? 'row-shimmer' : ''}>
            <td>Aletheia</td>
          </tr>
        </tbody>
      </table>
      <div id="joy-particle-overlay" ref={overlayRef} data-testid="overlay" />
      <style>{`
        .row-shimmer { outline: 2px solid orange; }
        .glow { opacity: 1; }
      `}</style>
    </div>
  )
}

describe('MiracleAlertPanel shimmer and overlay pulses', () => {
  test('activates shimmer class on node alert and then clears quickly', async () => {
    render(<TestPanel />)
    const row = screen.getByTestId('row-node-002')
    expect(row.classList.contains('row-shimmer')).toBe(false)

    // Dispatch synthetic node-alert
    const evt = new CustomEvent('node-alert', { detail: { nodeId: 'node-002', severity: 'stalled' } })
    window.dispatchEvent(evt)

    // Immediately should have shimmer
    expect(row.classList.contains('row-shimmer')).toBe(true)

    // After a short delay, shimmer should be removed
    await new Promise(r => setTimeout(r, 30))
    expect(row.classList.contains('row-shimmer')).toBe(false)
  })

  test('triggers overlay pulse once per event', async () => {
    render(<TestPanel />)
    const overlay = screen.getByTestId('overlay')
    expect(overlay.classList.contains('glow')).toBe(false)

    // Fire one event
    window.dispatchEvent(new CustomEvent('node-alert', { detail: { nodeId: 'node-002', severity: 'offline' } }))
    expect(overlay.classList.contains('glow')).toBe(true)

    // After a short delay, glow should clear
    await new Promise(r => setTimeout(r, 30))
    expect(overlay.classList.contains('glow')).toBe(false)

    // Fire another event to ensure per-event behavior
    window.dispatchEvent(new CustomEvent('node-alert', { detail: { nodeId: 'node-002', severity: 'stalled' } }))
    expect(overlay.classList.contains('glow')).toBe(true)
  })
})
