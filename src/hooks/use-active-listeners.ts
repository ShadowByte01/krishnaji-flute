'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AMBIENT_LISTENERS } from '@/lib/player-config'

// ── Active listeners (heartbeat polling, free + Vercel-compatible) ──
// Posts a heartbeat every 30s and re-polls the count every 15s. Adds a
// small ambient baseline so a freshly deployed site feels lived-in.
export function useActiveListeners() {
  const [count, setCount] = useState<number>(AMBIENT_LISTENERS + 1)
  const [displayCount, setDisplayCount] = useState<number>(AMBIENT_LISTENERS + 1)
  const idRef = useRef<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    // stable per-tab id
    let id = sessionStorage.getItem('kf_id')
    if (!id) {
      id = 't_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('kf_id', id)
    }
    idRef.current = id

    const beat = async () => {
      try {
        await fetch('/api/active-players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      } catch {}
    }
    const poll = async () => {
      try {
        const r = await fetch('/api/active-players', { cache: 'no-store' })
        const j = await r.json()
        const real = Number(j?.count) || 0
        setCount(Math.max(real, 1) + AMBIENT_LISTENERS)
      } catch {
        // keep last value
      }
    }
    beat()
    poll()
    const beatTimer = setInterval(beat, 30_000)
    const pollTimer = setInterval(poll, 15_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        beat()
        poll()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(beatTimer)
      clearInterval(pollTimer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  useEffect(() => {
    setDisplayCount(count)
    const id = setInterval(() => {
      // Random jitter between -3 and +3 to feel "alive"
      const jitter = Math.floor(Math.random() * 7) - 3
      setDisplayCount(Math.max(1, count + jitter))
    }, 4000 + Math.random() * 3000)
    return () => clearInterval(id)
  }, [count])

  return displayCount
}
