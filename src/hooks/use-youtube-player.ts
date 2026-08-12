'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYER_CONFIG } from '@/lib/player-config'

// ── YouTube IFrame API types (minimal) ──
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

export type PlayerState = {
  ready: boolean
  playing: boolean
  title: string
  author: string
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  buffered: number
  videoId: string
  // Number of consecutive playback errors (embedding disabled, etc).
  // When this exceeds a threshold the app falls back to JioSaavn.
  errorCount: number
}

const INITIAL: PlayerState = {
  ready: false,
  playing: false,
  title: '',
  author: '',
  currentTime: 0,
  duration: 0,
  volume: 80,
  muted: false,
  buffered: 0,
  videoId: '',
  errorCount: 0,
}

let apiLoadingPromise: Promise<void> | null = null

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT && window.YT.Player) return Promise.resolve()
  if (apiLoadingPromise) return apiLoadingPromise

  apiLoadingPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    document.head.appendChild(tag)
  })
  return apiLoadingPromise
}

export function useYouTubePlayer(containerId: string) {
  const [state, setState] = useState<PlayerState>(INITIAL)
  const playerRef = useRef<any>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingSeekRef = useRef<number | null>(null)

  const patch = useCallback((p: Partial<PlayerState>) => {
    setState((s) => ({ ...s, ...p }))
  }, [])

  const sync = useCallback(() => {
    const p = playerRef.current
    if (!p || !p.getCurrentTime) return
    let currentTime = 0
    let duration = 0
    let title = ''
    let author = ''
    let videoId = ''
    let buffered = 0
    try {
      currentTime = p.getCurrentTime() || 0
    } catch {}
    try {
      duration = p.getDuration() || 0
    } catch {}
    try {
      const d = p.getVideoData?.()
      title = d?.title || ''
      author = d?.author || ''
      videoId = d?.video_id || ''
    } catch {}
    try {
      const frac = p.getVideoLoadedFraction?.() || 0
      buffered = frac * (duration || 0)
    } catch {}
    setState((s) => ({
      ...s,
      currentTime,
      duration,
      title,
      author,
      videoId,
      buffered,
      playing: p.getPlayerState?.() === 1,
    }))
  }, [])

  const startPoll = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(sync, 500)
  }, [sync])

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const init = useCallback(async () => {
    await loadYouTubeAPI()
    if (!window.YT || !window.YT.Player) return
    if (playerRef.current) return

    playerRef.current = new window.YT.Player(containerId, {
      width: '100%',
      height: '100%',
      playerVars: {
        playlist: PLAYER_CONFIG.youtubeVideoIds.slice(1).join(','),
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
      videoId: PLAYER_CONFIG.youtubeVideoIds[0],
      events: {
        onReady: (e: any) => {
          try {
            e.target.setVolume(80)
          } catch {}
          patch({ ready: true, volume: 80 })
          sync()
          startPoll()
        },
        onStateChange: (e: any) => {
          const YT = window.YT
          const code = e?.data
          const playing = code === YT?.PlayerState?.PLAYING
          patch({ playing })
          // Reset the error counter once a video actually plays.
          if (playing) patch({ errorCount: 0 })
          sync()
          if (code === YT?.PlayerState?.PLAYING) startPoll()
        },
        onError: () => {
          // A video isn't embeddable / region-blocked → skip + auto-play.
          setState((s) => ({ ...s, errorCount: s.errorCount + 1 }))
          try {
            const p = playerRef.current
            p?.nextVideo?.()
            setTimeout(() => {
              try {
                p?.playVideo?.()
              } catch {}
            }, 900)
          } catch {}
        },
      },
    })
  }, [containerId, patch, startPoll, sync])

  useEffect(() => {
    init()
    return () => {
      stopPoll()
      try {
        playerRef.current?.destroy?.()
      } catch {}
      playerRef.current = null
    }
  }, [init, stopPoll])

  // ── Controls ──
  const play = useCallback(() => {
    try {
      playerRef.current?.playVideo?.()
    } catch {}
  }, [])
  const pause = useCallback(() => {
    try {
      playerRef.current?.pauseVideo?.()
    } catch {}
  }, [])
  const toggle = useCallback(() => {
    try {
      if (playerRef.current?.getPlayerState?.() === 1) playerRef.current.pauseVideo()
      else playerRef.current?.playVideo?.()
    } catch {}
  }, [])
  const next = useCallback(() => {
    pendingSeekRef.current = 0
    try {
      playerRef.current?.nextVideo?.()
    } catch {}
  }, [])
  const prev = useCallback(() => {
    pendingSeekRef.current = 0
    try {
      const t = playerRef.current?.getCurrentTime?.() || 0
      if (t > 3) {
        playerRef.current?.seekTo?.(0, true)
      } else {
        playerRef.current?.previousVideo?.()
      }
    } catch {}
  }, [])
  const seek = useCallback((seconds: number) => {
    try {
      playerRef.current?.seekTo?.(seconds, true)
      patch({ currentTime: seconds })
    } catch {}
  }, [patch])
  const setVolume = useCallback((v: number) => {
    try {
      playerRef.current?.setVolume?.(v)
      patch({ volume: v, muted: v === 0 })
    } catch {}
  }, [patch])
  const toggleMute = useCallback(() => {
    try {
      if (playerRef.current?.isMuted?.()) {
        playerRef.current?.unMute?.()
        patch({ muted: false })
      } else {
        playerRef.current?.mute?.()
        patch({ muted: true })
      }
    } catch {}
  }, [patch])

  return {
    state,
    controls: { play, pause, toggle, next, prev, seek, setVolume, toggleMute },
  }
}
