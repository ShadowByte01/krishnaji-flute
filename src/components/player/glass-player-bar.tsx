'use client'

import { motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
} from 'lucide-react'
import type { PlayerState, PlayerControls } from '@/lib/player-types'
import { LiquidGlass } from '@/components/player/liquid-glass'

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function GlassPlayerBar({
  state,
  controls,
  isFloating,
}: {
  state: PlayerState
  controls: PlayerControls
  isFloating: boolean
}) {
  const seekRef = useRef<HTMLDivElement>(null)
  const [seeking, setSeeking] = useState<number | null>(null)
  const [volOpen, setVolOpen] = useState(false)
  const [vol, setVol] = useState(state.volume)
  const displayVol = state.muted ? 0 : vol

  const dur = state.duration || 0
  const cur = seeking ?? state.currentTime
  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0
  const bufPct = dur > 0 ? Math.min(100, (state.buffered / dur) * 100) : 0

  const seekFromEvent = useCallback(
    (clientX: number) => {
      const el = seekRef.current
      if (!el || dur <= 0) return 0
      const r = el.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
      const t = ratio * dur
      setSeeking(t)
      return t
    },
    [dur],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (dur <= 0) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    seekFromEvent(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (seeking === null) return
    seekFromEvent(e.clientX)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (seeking === null) return
    const t = seekFromEvent(e.clientX)
    controls.seek(t)
    setSeeking(null)
  }

  const VolIcon =
    displayVol === 0 ? VolumeX : displayVol < 50 ? Volume1 : Volume2
  const thumb = state.art || '/flute-art.jpg'

  return (
    <LiquidGlass
      id="main-player-glass"
      className={`pointer-events-auto fixed bottom-4 sm:bottom-6 inset-x-0 mx-auto z-40 w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden rounded-[30px] shadow-2xl ${
        isFloating ? '' : 'transition-transform duration-500'
      }`}
      config={{ floating: isFloating, cornerRadius: 30 }}
      style={{ 
        touchAction: isFloating ? 'none' : 'auto',
        transform: isFloating ? undefined : 'translate(0px, 0px)',
      }}
    >
      <div className="relative z-[2] flex items-center gap-3 p-2.5 sm:gap-3 sm:p-3">
            {/* ── Spinning vinyl CD ── */}
            <button
              onClick={controls.toggle}
              aria-label={state.playing ? 'Pause' : 'Play'}
              className="group relative h-14 w-14 shrink-0 sm:h-[60px] sm:w-[60px]"
            >
              {/* Ambient glow when playing */}
              <div
                className={`absolute -inset-1.5 rounded-full bg-amber-300/25 blur-lg transition-opacity duration-500 ${
                  state.playing ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* The disc */}
              <div
                className="kf-vinyl absolute inset-0 rounded-full"
                style={{
                  animationPlayState: state.playing ? 'running' : 'paused',
                }}
              >
                {/* Vinyl grooves */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'repeating-radial-gradient(circle at center, #0a0a0a 0px, #0a0a0a 1px, #141414 2px, #141414 3px)',
                  }}
                />
                {/* Glass sheen — light refraction across the disc */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 via-transparent via-50% to-transparent" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-white/10" />
                {/* Center label = thumbnail */}
                <div
                  className="absolute inset-[24%] rounded-full bg-cover bg-center ring-1 ring-amber-200/30"
                  style={{ backgroundImage: `url(${thumb})` }}
                />
                {/* Glassy center hole */}
                <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900 ring-1 ring-amber-100/40" />
              </div>
              {/* Play/pause hint on hover */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                {state.playing ? (
                  <Pause className="h-5 w-5 text-white" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 translate-x-0.5 text-white" fill="currentColor" />
                )}
              </div>
            </button>

            {/* Title + seek */}
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white drop-shadow-sm sm:text-[15px]">
                    {state.title || 'Krishnaji Flute'}
                  </p>
                  <p className="truncate text-[11px] text-white/60 sm:text-xs">
                    {state.artist || 'Bansuri · Meditation Music'}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-white/65 sm:flex">
                  <span>{fmt(cur)}</span>
                  <span className="text-white/30">/</span>
                  <span>{fmt(dur)}</span>
                </div>
              </div>

              {/* Seek bar — glass track */}
              <div
                ref={seekRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setSeeking(null)}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.floor(dur)}
                aria-valuenow={Math.floor(cur)}
                tabIndex={0}
                className="group relative h-3 cursor-pointer touch-none select-none"
              >
                <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-white/10 shadow-inner">
                  {/* Buffered */}
                  <div
                    className="absolute h-full rounded-full bg-white/20"
                    style={{ width: `${bufPct}%` }}
                  />
                  {/* Played — liquid gold fill */}
                  <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 shadow-[0_0_8px_rgba(252,211,77,0.6)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {/* Thumb — glass bead */}
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-white/80 opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  style={{ left: `${pct}%` }}
                />
              </div>

              {/* Mobile timestamps */}
              <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-white/50 sm:hidden">
                <span>{fmt(cur)}</span>
                <span>{fmt(dur)}</span>
              </div>
            </div>

            {/* Transport */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <IconBtn label="Previous" onClick={controls.prev}>
                <SkipBack className="h-5 w-5" fill="currentColor" />
              </IconBtn>

              {/* Main play button — liquid glass */}
              <button
                onClick={controls.toggle}
                aria-label={state.playing ? 'Pause' : 'Play'}
                className="kf-glass-btn flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 active:scale-95 sm:h-12 sm:w-12"
              >
                {state.playing ? (
                  <Pause className="h-6 w-6 text-white" fill="currentColor" />
                ) : (
                  <Play className="h-6 w-6 translate-x-0.5 text-white" fill="currentColor" />
                )}
              </button>

              <IconBtn label="Next" onClick={controls.next}>
                <SkipForward className="h-5 w-5" fill="currentColor" />
              </IconBtn>

              {/* Volume */}
              <div
                className="relative ml-0.5"
                onMouseEnter={() => setVolOpen(true)}
                onMouseLeave={() => setVolOpen(false)}
              >
                <IconBtn
                  label={state.muted ? 'Unmute' : 'Mute'}
                  onClick={controls.toggleMute}
                >
                  <VolIcon className="h-5 w-5" />
                </IconBtn>
                <div
                  className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transition-all ${
                    volOpen
                      ? 'pointer-events-auto opacity-100'
                      : 'pointer-events-none opacity-0'
                  }`}
                >
                  <div className="flex h-24 w-10 items-center justify-center rounded-2xl p-2 backdrop-blur-xl bg-white/10 ring-1 ring-white/20 shadow-xl">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={displayVol}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setVol(v)
                        controls.setVolume(v)
                      }}
                      aria-label="Volume"
                      className="kf-vol h-16 w-1.5 cursor-pointer appearance-none rounded-full bg-white/20"
                      style={{
                        background: `linear-gradient(to top, #fcd34d ${displayVol}%, rgba(255,255,255,0.2) ${displayVol}%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
      </div>
    </LiquidGlass>
  )
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white active:scale-90 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  )
}
