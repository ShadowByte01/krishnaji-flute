'use client'

import { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { PLAYER_CONFIG } from '@/lib/player-config'
import { LiquidGlass } from '@/components/player/liquid-glass'

export function SpotifyModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const embed = `https://open.spotify.com/embed/playlist/${PLAYER_CONFIG.spotifyPlaylistId}?utm_source=generator&theme=0`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Glass panel */}
      <LiquidGlass className="relative w-full max-w-md overflow-hidden rounded-3xl p-1">
        <div className="relative z-[2] rounded-[22px] bg-black/20 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <SpotifyGlyph className="h-4 w-4 text-emerald-300" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Spotify Playlist</p>
                <p className="text-[11px] text-white/50">Krishnaji Flute</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <iframe
            key={embed}
            src={embed}
            title="Krishnaji Flute — Spotify"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="h-[420px] w-full rounded-2xl border border-white/10"
          />

          <a
            href={PLAYER_CONFIG.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Open in Spotify
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </LiquidGlass>
    </div>
  )
}

function SpotifyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.59 14.43a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.8-.87 7.07-.5 9.71 1.1.3.18.39.57.22.86zm1.22-2.72a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.25 1.07zm.1-2.84C14.8 8.99 9.4 8.76 6.3 9.7a.93.93 0 11-.54-1.78c3.56-1.08 9.52-.87 13.27 1.36a.93.93 0 11-.95 1.6z" />
    </svg>
  )
}
