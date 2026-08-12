import { NextResponse } from 'next/server'
import { PLAYER_CONFIG, JIOSAAVN_API_BASE } from '@/lib/player-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Normalizes a JioSaavn song object into a minimal track the player needs.
type Track = {
  id: string
  title: string
  artist: string
  art: string
  url: string
  duration: number
}

function normalize(raw: any): Track | null {
  try {
    const id = raw?.id || raw?._id || raw?.url?.split('/')?.pop() || Math.random().toString(36)
    const name = raw?.name || raw?.title || 'Unknown'
    const artists =
      raw?.artists?.primary?.map((a: any) => a.name).filter(Boolean).join(', ') ||
      raw?.primaryArtists ||
      raw?.subtitle?.split('•')[0]?.trim() ||
      ''
    const downloadUrl = raw?.downloadUrl
    const url = Array.isArray(downloadUrl) && downloadUrl.length
      ? downloadUrl[downloadUrl.length - 1]?.url
      : typeof downloadUrl === 'string'
        ? downloadUrl
        : ''
    const image = raw?.image
    const art = Array.isArray(image) && image.length
      ? image[image.length - 1]?.url
      : typeof image === 'string'
        ? image
        : ''
    const duration = Number(raw?.duration) || 0
    if (!url) return null
    return { id: String(id), title: String(name), artist: String(artists), art: String(art), url: String(url), duration }
  } catch {
    return null
  }
}

async function searchOne(query: string): Promise<Track[]> {
  const base = JIOSAAVN_API_BASE.replace(/\/$/, '')
  const u = `${base}/api/search/songs?query=${encodeURIComponent(query)}&limit=12`
  const res = await fetch(u, {
    headers: { Accept: 'application/json' },
    // short cache window so repeat loads are fast but content stays fresh
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`saavn ${res.status}`)
  const j = await res.json()
  const results =
    j?.data?.results || j?.data || j?.results || []
  return (results as any[])
    .map(normalize)
    .filter((t): t is Track => !!t)
}

export async function GET() {
  if (!JIOSAAVN_API_BASE) {
    return NextResponse.json(
      { enabled: false, tracks: [], message: 'JioSaavn API not configured. Set JIOSAAVN_API_BASE env var.' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    // Run all configured searches in parallel, then dedupe by id.
    const batches = await Promise.allSettled(
      PLAYER_CONFIG.jiosaavnSearchQueries.map(searchOne),
    )
    const seen = new Set<string>()
    const tracks: Track[] = []
    for (const b of batches) {
      if (b.status !== 'fulfilled') continue
      for (const t of b.value) {
        if (!seen.has(t.id)) {
          seen.add(t.id)
          tracks.push(t)
        }
      }
    }
    return NextResponse.json(
      { enabled: true, tracks, count: tracks.length },
      { headers: { 'Cache-Control': 'public, max-age=3600' } },
    )
  } catch (e: any) {
    return NextResponse.json(
      { enabled: true, tracks: [], error: e?.message || 'search failed' },
      { headers: { 'Cache-Control': 'no-store' } },
      { status: 502 },
    )
  }
}
