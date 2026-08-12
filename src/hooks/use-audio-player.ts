'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type AudioTrack = {
  id: string
  title: string
  artist: string
  art: string
  url: string
  duration: number
}

export type AudioPlayerState = {
  ready: boolean
  playing: boolean
  title: string
  artist: string
  art: string
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  buffered: number
  trackId: string
  engine: 'audio' | 'none'
  available: boolean
  trackIndex: number
}

const INITIAL: AudioPlayerState = {
  ready: false,
  playing: false,
  title: '',
  artist: '',
  art: '',
  currentTime: 0,
  duration: 0,
  volume: 80,
  muted: false,
  buffered: 0,
  trackId: '',
  engine: 'none',
  available: false,
  trackIndex: 0,
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<AudioPlayerState>(INITIAL)
  const [loading, setLoading] = useState(true)

  const patch = useCallback((p: Partial<AudioPlayerState>) => {
    setState((s) => ({ ...s, ...p }))
  }, [])

  // ── Load the JioSaavn queue (runs in background; YouTube is primary) ──
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/music/search', { cache: 'no-store' })
        const j = await r.json()
        if (!alive) return
        if (j?.enabled && Array.isArray(j.tracks) && j.tracks.length) {
          setTracks(j.tracks)
          patch({ engine: 'audio', available: true, ready: true })
        } else {
          setTracks([])
          patch({ engine: 'none', available: false, ready: true })
        }
      } catch {
        if (alive) patch({ engine: 'none', available: false })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [patch])

  // ── Create the hidden <audio> element ──
  useEffect(() => {
    if (tracks.length === 0) return
    const a = new Audio()
    a.preload = 'metadata'
    a.volume = 0.8
    audioRef.current = a

    const onTime = () => patch({ currentTime: a.currentTime })
    const onDur = () => patch({ duration: a.duration || 0 })
    const onPlay = () => patch({ playing: true })
    const onPause = () => patch({ playing: false })
    const onProgress = () => {
      try {
        if (a.buffered.length && a.duration) {
          patch({ buffered: a.buffered.end(a.buffered.length - 1) })
        }
      } catch {}
    }
    const onEnded = () => next()
    const onErr = () => {
      // skip broken track
      setTimeout(() => next(), 800)
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onDur)
    a.addEventListener('durationchange', onDur)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('progress', onProgress)
    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onErr)

    return () => {
      a.pause()
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onDur)
      a.removeEventListener('durationchange', onDur)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('progress', onProgress)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onErr)
      audioRef.current = null
    }
  }, [tracks])

  // ── Load current track into the audio element ──
  useEffect(() => {
    const a = audioRef.current
    if (!a || tracks.length === 0) return
    const t = tracks[index]
    if (!t) return
    a.src = t.url
    a.load()
    patch({
      title: t.title,
      artist: t.artist,
      art: t.art,
      trackId: t.id,
      duration: t.duration,
      currentTime: 0,
      buffered: 0,
      trackIndex: index,
    })
  }, [index, tracks, patch])

  // ── Controls ──
  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])
  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])
  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }, [])
  const next = useCallback(() => {
    setIndex((i) => (tracks.length ? (i + 1) % tracks.length : 0))
  }, [tracks.length])
  const prev = useCallback(() => {
    const a = audioRef.current
    if (a && a.currentTime > 3) {
      a.currentTime = 0
      return
    }
    setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : 0))
  }, [tracks.length])
  const seek = useCallback((s: number) => {
    const a = audioRef.current
    if (a) {
      a.currentTime = s
      patch({ currentTime: s })
    }
  }, [patch])
  const setVolume = useCallback((v: number) => {
    const a = audioRef.current
    if (a) {
      a.volume = v / 100
      a.muted = v === 0
      patch({ volume: v, muted: v === 0 })
    }
  }, [patch])
  const toggleMute = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.muted = !a.muted
    patch({ muted: a.muted })
  }, [patch])
  const resetLocal = useCallback(() => {
    setIndex(0)
  }, [])

  return {
    state,
    tracks,
    loading,
    index,
    controls: { play, pause, toggle, next, prev, seek, setVolume, toggleMute, resetLocal },
  }
}
