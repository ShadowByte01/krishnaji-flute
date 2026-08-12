// Unified player state — both the JioSaavn audio engine and the YouTube
// fallback engine map into this shape so the glass player bar doesn't care
// which one is active.
export type PlayerState = {
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
}

export type PlayerControls = {
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (s: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  resetLocal?: () => void
}
