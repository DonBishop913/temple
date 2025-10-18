// Hybrid telemetry hook: merges SSE and WebSocket, handles backoff, exposes unified state
import { useEffect, useRef, useState } from 'react'

export default function useOversoulHeartbeat({ wsUrl = 'ws://localhost:4322', sseUrl = '/api/livefeed/stream' } = {}) {
  const [state, setState] = useState({
    nodes: [], harmony: {}, energy: {}, override: {}, schumann: { hz: 7.83 }, joyparticle: { level: 0.5 },
    planetary: [], nodeMap: {}, pulses: []
  })
  const backoffRef = useRef(1000)
  const wsRef = useRef(null)
  const sseRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    // SSE
    const es = new EventSource(sseUrl)
    sseRef.current = es
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        setState((prev) => ({ ...prev, sse: msg, lastPulse: msg.timestamp }))
      } catch { /* ignore */ }
    }
    es.onerror = () => {
      es.close()
      sseRef.current = null
      // SSE will auto-retry by default; no manual backoff needed
    }

    // WS connect with backoff
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
        ws.onopen = () => { backoffRef.current = 1000 }
        ws.onmessage = (ev) => {
          try {
            const { type, payload } = JSON.parse(ev.data)
            setState((prev) => ({ ...prev, [type]: payload }))
          } catch { /* ignore */ }
        }
        ws.onclose = () => {
          wsRef.current = null
          const delay = Math.min(16000, backoffRef.current * 2)
          backoffRef.current = delay
          clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(connect, delay)
        }
        ws.onerror = () => ws.close()
      } catch {
        const delay = Math.min(16000, backoffRef.current * 2)
        backoffRef.current = delay
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(connect, delay)
      }
    }
    connect()

    return () => {
      if (wsRef.current) wsRef.current.close()
      if (sseRef.current) sseRef.current.close()
      clearTimeout(timeoutRef.current)
    }
  }, [wsUrl, sseUrl])

  return state
}
