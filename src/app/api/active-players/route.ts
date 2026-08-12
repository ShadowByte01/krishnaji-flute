import { NextResponse } from 'next/server'

// ── Active-listeners heartbeat store ──
// Free, dependency-free, Vercel-compatible.
// Tracks sessions by id (or IP) that sent a heartbeat in the last 90s.
// On Vercel serverless this is per-instance; for a small personal site
// that's fine and always feels alive (frontend adds an ambient baseline).

type Beat = { at: number }
const store = new Map<string, Beat>()
const WINDOW_MS = 90_000

function activeCount() {
  const now = Date.now()
  for (const [k, v] of store) {
    if (now - v.at > WINDOW_MS) store.delete(k)
  }
  return store.size
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(
    { count: activeCount(), ts: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}

export async function POST(req: Request) {
  let id = ''
  try {
    const body = await req.json().catch(() => ({}))
    id = String(body?.id || '')
  } catch {
    /* ignore */
  }
  if (!id) {
    id =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'anon'
  }
  store.set(id, { at: Date.now() })
  return NextResponse.json(
    { ok: true, count: activeCount(), ts: Date.now() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
