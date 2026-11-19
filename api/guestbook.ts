// Vercel function behind the studio's guest book. Notes live in Upstash Redis (added through the
// Vercel Marketplace), reached over its REST API with plain fetch: no client library.
import { clean, type Note } from '../src/lib/guestbook.js' // .js: Vercel runs this as plain Node ESM

const KEY = 'gb:notes'
const KEEP = 50 // older notes fall off the list
const SHOW = 8 // the cork board has room for eight
const PER_HOUR = 3 // posts per IP per hour

const json = (status: number, body: object, cache = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  })

// the Marketplace integration names them KV_*; a direct Upstash setup uses UPSTASH_*
const url = () => process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = () => process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

/** Runs Redis commands in one round trip; null when storage is not set up or unreachable. */
const redis = async (...commands: (string | number)[][]): Promise<unknown[] | null> => {
  if (!url() || !token()) return null
  const res = await fetch(`${url()}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  }).catch(() => null)
  if (!res?.ok) return null
  const out = (await res.json()) as { result?: unknown; error?: string }[]
  return out.some((r) => r.error) ? null : out.map((r) => r.result)
}

const readNotes = (raw: unknown): Note[] =>
  (Array.isArray(raw) ? raw : []).flatMap((item) => {
    try {
      const n = JSON.parse(String(item)) as Note
      return typeof n.name === 'string' && typeof n.message === 'string' ? [n] : []
    } catch {
      return []
    }
  })

export async function GET(): Promise<Response> {
  const out = await redis(['LRANGE', KEY, 0, SHOW - 1])
  // no storage yet (local dev, preview deploys): an empty board, not an error
  return json(200, { notes: readNotes(out?.[0]) }, 'public, s-maxage=15, stale-while-revalidate=60')
}

export async function POST(request: Request): Promise<Response> {
  if (!url() || !token()) return json(503, { error: 'The guest book is offline.' })
  const body = await request.json().catch(() => null)
  const checked = clean(body)
  if (!checked.ok) return json(400, { error: checked.error })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const count = await redis(['INCR', `gb:ip:${ip}`], ['EXPIRE', `gb:ip:${ip}`, 3600, 'NX'])
  if (!count) return json(503, { error: 'The guest book is offline.' })
  if (Number(count[0]) > PER_HOUR) return json(429, { error: 'That is plenty for now. Try again in an hour.' })

  const note: Note = { ...checked.note, at: Date.now() }
  const saved = await redis(['LPUSH', KEY, JSON.stringify(note)], ['LTRIM', KEY, 0, KEEP - 1])
  if (!saved) return json(503, { error: 'The guest book is offline.' })
  return json(201, { note })
}
