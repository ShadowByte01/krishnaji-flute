// ── Krishnaji Flute — player configuration ──
// Everything you might want to change lives here.

export const PLAYER_CONFIG = {
  // ── Spotify (your playlist; opens in a glass modal) ──
  spotifyPlaylistId: '3CGqBZlLv5DmUjIieiGBxm',
  spotifyUrl: 'https://open.spotify.com/playlist/3CGqBZlLv5DmUjIieiGBxm',

  // ── JioSaavn engine (drives the custom player with FULL control) ──
  // The JioSaavn unofficial API returns direct MP3 stream URLs, which the
  // HTML5 <audio> engine plays with play/pause/seek/next/prev/volume.
  //
  // ► To enable: deploy your own free instance of the API:
  //   https://github.com/sumitkolhe/jiosaavn-api  (1-click Vercel deploy)
  //   then set env var  JIOSAAVN_API_BASE  to your instance URL,
  //   e.g. https://your-saavn.vercel.app
  //
  // If unset, the player gracefully falls back to the YouTube engine.
  jiosaavnSearchQueries: [
    'krishna flute',
    'bansuri meditation',
    'krishna bansuri',
    'flute relax meditation',
  ],

  // ── YouTube fallback engine (used if JioSaavn is not configured) ──
  youtubeVideoIds: [
    '6sX74H9jmVI',
    'mLNhlEMPrNU',
    'ldkpFVqFxaQ',
    'ZwmFGdrQ_fY',
    'EoRyLbglbTA',
    'kp9s8dI9dIM',
    '78P_ATPvit8',
  ],
  youtubePlaylistUrl:
    'https://www.youtube.com/playlist?list=PLV6Ua_8J7tnS_7DdndvpVTOIFO9glkBsb',

  // Branding shown on the side of the screen.
  maker: 'Lostt Weeds',
} as const

// Read the JioSaavn API base from env (set in Vercel project settings).
// Empty string => JioSaavn disabled, YouTube engine used instead.
export const JIOSAAVN_API_BASE = process.env.JIOSAAVN_API_BASE || ''

// Ambient baseline added to the real heartbeat-based "active listeners" count
// so a freshly deployed site doesn't read "1". Set to 0 for pure honesty.
export const AMBIENT_LISTENERS = 58
