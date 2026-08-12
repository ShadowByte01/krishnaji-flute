'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'
import { TopBar } from '@/components/player/top-bar'
import { GlassPlayerBar } from '@/components/player/glass-player-bar'
import { SpotifyModal } from '@/components/player/spotify-modal'
import { LiquidGlass as LiquidGlassJS } from '@ybouane/liquidglass'
import { LiquidGlass } from '@/components/player/liquid-glass'
import { PLAYER_CONFIG } from '@/lib/player-config'
import type { PlayerState, PlayerControls } from '@/lib/player-types'
import { Khand } from 'next/font/google'

const khand = Khand({ weight: '700', subsets: ['devanagari'] })

const YT_CONTAINER = 'yt-player'
// When YouTube errors this many times in a row (embedding disabled etc),
// fall back to the JioSaavn audio engine if it's available.
const YT_FALLBACK_THRESHOLD = 4

export default function Home() {
  const audio = useAudioPlayer() // JioSaavn — fallback
  const yt = useYouTubePlayer(YT_CONTAINER) // YouTube Music — primary

  const [spotifyOpen, setSpotifyOpen] = useState(false)
  const [forceAudio, setForceAudio] = useState(false)
  const [isFloating, setIsFloating] = useState(false)

  // YouTube is primary. If YouTube breaks, fallback to Audio Engine.
  const youtubeBroken = yt.state.errorCount >= YT_FALLBACK_THRESHOLD
  const useAudioEngine = forceAudio || (youtubeBroken && audio.state.available)

  // Map the active engine into the unified state/controls the bar expects.
  const state: PlayerState = useMemo(() => {
    if (useAudioEngine) {
      return {
        ready: audio.state.ready,
        playing: audio.state.playing,
        title: audio.state.title,
        artist: audio.state.artist,
        art: audio.state.art,
        currentTime: audio.state.currentTime,
        duration: audio.state.duration,
        volume: audio.state.volume,
        muted: audio.state.muted,
        buffered: audio.state.buffered,
        trackId: audio.state.trackId,
      }
    }
    return {
      ready: yt.state.ready,
      playing: yt.state.playing,
      title: yt.state.title,
      artist: yt.state.author,
      art: yt.state.videoId
        ? `https://i.ytimg.com/vi/${yt.state.videoId}/hqdefault.jpg`
        : '',
      currentTime: yt.state.currentTime,
      duration: yt.state.duration,
      volume: yt.state.volume,
      muted: yt.state.muted,
      buffered: yt.state.buffered,
      trackId: yt.state.videoId,
    }
  }, [useAudioEngine, audio.state, yt.state])

  const controls: PlayerControls = useMemo(() => {
    const active = useAudioEngine ? audio.controls : yt.controls
    return {
      play: () => active.play(),
      pause: () => active.pause(),
      toggle: () => active.toggle(),
      next: () => active.next(),
      prev: () => active.prev(),
      seek: (s) => active.seek(s),
      setVolume: (v) => active.setVolume(v),
      toggleMute: () => active.toggleMute(),
    }
  }, [useAudioEngine, audio.controls, yt.controls])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.code === 'Space') {
        e.preventDefault()
        controls.toggle()
      } else if (e.code === 'ArrowRight') {
        if (e.shiftKey) controls.next()
        else controls.seek(state.currentTime + 5)
      } else if (e.code === 'ArrowLeft') {
        if (e.shiftKey) controls.prev()
        else controls.seek(Math.max(0, state.currentTime - 5))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [controls, state.currentTime])

  // Initialize liquid glass
  useEffect(() => {
    let instance: any
    const root = document.getElementById('liquid-glass-root')
    // Wait a tick for elements to be fully rendered in the DOM
    const timeout = setTimeout(() => {
      const mainPlayer = document.getElementById('main-player-glass')
      const toggleBtn = document.getElementById('toggle-player-glass')
      const topTime = document.getElementById('top-time-glass')
      const topSpotify = document.getElementById('top-socials-glass')
      
      if (root && mainPlayer) {
        const elements = [mainPlayer]
        if (toggleBtn) elements.push(toggleBtn)
        if (topTime) elements.push(topTime)
        if (topSpotify) elements.push(topSpotify)

        LiquidGlassJS.init({
          root,
          glassElements: elements,
          defaults: {
            cornerRadius: 30,
            refraction: 0.69
          }
        }).then((inst: any) => {
          instance = inst
        }).catch((err: any) => console.error('LiquidGlass error:', err))
      }
    }, 100)

    return () => {
      clearTimeout(timeout)
      if (instance) instance.destroy()
    }
  }, [])

  return (
    <main id="liquid-glass-root" className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* ── Background: flute poster ── */}
      <div className="fixed inset-0 z-0 bg-[#0a0f18]">
        <div
          className="absolute inset-0 hidden bg-cover bg-center sm:block"
          style={{ backgroundImage: 'url(/flute-bg-new.png)' }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center sm:hidden"
          style={{ backgroundImage: 'url(/flute-bg-new.png)' }}
        />
        
        {/* Title Text Overlay (Right Side) */}
        <div className="absolute inset-y-0 right-[5%] sm:right-[15%] z-10 flex pointer-events-none select-none flex-col justify-center">
          <h1 className={`${khand.className} text-[#fef9f0] text-7xl sm:text-8xl lg:text-[10rem] leading-[0.85] text-right flex flex-col items-end`}>
            <span>कृष्ण जी</span>
            <span>बाँसुरी</span>
          </h1>
        </div>
      </div>

      {/* ── Hidden YouTube engine (primary; always mounted) ── */}
      {!useAudioEngine && (
        <div
          id={YT_CONTAINER}
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] top-0 h-16 w-16 opacity-0"
        />
      )}

      {/* ── Top bar ── */}
      <TopBar
        onSpotify={() => setSpotifyOpen(true)}
        onYouTube={() =>
          window.open(PLAYER_CONFIG.youtubePlaylistUrl, '_blank', 'noopener')
        }
        spotifyActive={spotifyOpen}
        isFloating={isFloating}
      />

      {/* ── Liquid-glass player bar (bottom) ── */}
      <GlassPlayerBar state={state} controls={controls} isFloating={isFloating} />

      {/* ── Spotify modal ── */}
      <SpotifyModal open={spotifyOpen} onClose={() => setSpotifyOpen(false)} />

      {/* ── Floating Toggle Button ── */}
      <LiquidGlass
        id="toggle-player-glass"
        className="pointer-events-auto fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 rounded-full text-xs font-medium text-white/85"
        config={{ button: true, cornerRadius: 20 }}
      >
        <button
          onClick={() => setIsFloating(!isFloating)}
          className="flex h-full w-full items-center justify-center px-4 py-2 hover:text-white"
        >
          {isFloating ? 'Liquid Glass ON' : 'Liquid Glass OFF'}
        </button>
      </LiquidGlass>

      {/* ── Footer ── */}
      <div className="pointer-events-none fixed bottom-3 left-4 sm:bottom-4 sm:left-5 z-50 text-[10px] text-white/40">
        crafted by Lostt Weeds
      </div>
    </main>
  )
}
