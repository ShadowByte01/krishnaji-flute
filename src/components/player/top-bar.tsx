'use client'

import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { useActiveListeners } from '@/hooks/use-active-listeners'
import { LiquidGlass } from '@/components/player/liquid-glass'

function useClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      const ap = h >= 12 ? 'pm' : 'am'
      h = h % 12 || 12
      setT(`${h}:${m} ${ap}`)
    }
    fmt()
    // Tick every second so the displayed minute is always the true current time.
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

export function TopBar({
  onSpotify,
  onYouTube,
  spotifyActive,
  isFloating,
}: {
  onSpotify: () => void
  onYouTube: () => void
  spotifyActive: boolean
  isFloating: boolean
}) {
  const time = useClock()
  const listeners = useActiveListeners()

  return (
    <>
      {/* Left: time */}
      <LiquidGlass 
        id="top-time-glass"
        className={`pointer-events-auto fixed left-4 top-4 z-40 sm:left-6 sm:top-6 flex min-h-[36px] min-w-[72px] items-center justify-center rounded-full px-4 py-2 text-[13px] font-semibold tracking-wide text-white/90 ${isFloating ? '' : 'transition-transform duration-500'}`}
        config={{ floating: isFloating, button: true, cornerRadius: 20 }}
        style={{ touchAction: isFloating ? 'none' : 'auto', transform: isFloating ? undefined : 'translate(0px, 0px)' }}
      >
        {time}
      </LiquidGlass>


      {/* Right: Spotify + Listeners + YT Music */}
      <LiquidGlass
        id="top-socials-glass"
        className={`pointer-events-auto fixed right-4 top-4 z-40 flex w-max items-center sm:right-6 sm:top-6 rounded-full p-1 transition ${isFloating ? '' : 'transition-transform duration-500'}`}
        config={{ floating: isFloating, button: true, cornerRadius: 20 }}
        style={{ touchAction: isFloating ? 'none' : 'auto', transform: isFloating ? undefined : 'translate(0px, 0px)' }}
      >
        <button
          onClick={onSpotify}
          aria-label="Open Spotify playlist"
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            spotifyActive
              ? 'bg-emerald-400/20 text-emerald-100'
              : 'text-white/85 hover:text-white'
          }`}
        >
          <SpotifyIcon className="h-4 w-4" />
        </button>

        <div className="flex h-8 items-center gap-1.5 px-2 text-xs font-semibold text-white/85 border-x border-white/10 mx-0.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="tabular-nums">{listeners.toLocaleString()}</span>
        </div>

        <button
          onClick={onYouTube}
          aria-label="YouTube Music playlist"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:text-white hover:bg-white/10"
        >
          <YouTubeIcon className="h-4 w-4 text-red-500" />
        </button>
      </LiquidGlass>
    </>
  )
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.59 14.43a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.8-.87 7.07-.5 9.71 1.1.3.18.39.57.22.86zm1.22-2.72a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.25 1.07zm.1-2.84C14.8 8.99 9.4 8.76 6.3 9.7a.93.93 0 11-.54-1.78c3.56-1.08 9.52-.87 13.27 1.36a.93.93 0 11-.95 1.6z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
    </svg>
  )
}
