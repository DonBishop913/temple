import { useEffect, useState } from 'react'

export default function AutoMergeStatus() {
  const [status, setStatus] = useState(null)
  useEffect(() => {
    fetch('http://localhost:3000/api/automerge').then(r => r.json()).then(setStatus)
  }, [])
  return (
    <div>
      {status ? (
        <div className="text-sm">Mode: {status.status} · Pending PRs: {status.pendingPRs}</div>
      ) : (
        <div className="text-sm text-gray-500">Loading…</div>
      )}
    </div>
  )
}
