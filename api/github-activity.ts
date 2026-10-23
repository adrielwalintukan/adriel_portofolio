// Vercel function behind the GitHub Activity section. Reads the public contributions calendar
// (the same HTML github.com shows on a profile, no token needed) and returns it as JSON.
const USER = 'adrielwalintukan'

export type Day = { date: string; count: number; level: number }

const json = (status: number, body: object, cache = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  })

/** Pulls each day (date, level 0-4, count) out of GitHub's calendar markup, oldest first. */
export function parseContributions(html: string): Day[] {
  // counts live in tooltips that point at the cell ids: "3 contributions on ..." / "No contributions on ..."
  const counts = new Map<string, number>()
  for (const [, id, text] of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^([\d,]+) contribution/.exec(text.trim())
    counts.set(id, n ? Number(n[1].replace(/,/g, '')) : 0)
  }
  const days: Day[] = []
  for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
    const date = /data-date="([^"]+)"/.exec(tag)![1]
    const id = /\bid="([^"]+)"/.exec(tag)?.[1]
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? 0)
    days.push({ date, level, count: (id && counts.get(id)) || 0 })
  }
  return days.sort((a, b) => a.date.localeCompare(b.date))
}

export async function GET(): Promise<Response> {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, {
    headers: { 'User-Agent': 'adrielwalintukan.my.id portfolio' },
  }).catch(() => null)
  if (!res?.ok) return json(502, { error: 'upstream' })
  const days = parseContributions(await res.text())
  // an empty result means GitHub changed its markup: fail loudly instead of showing a blank year
  if (!days.length) return json(502, { error: 'parse' })
  // cached at Vercel's edge for an hour, so visitors never hit GitHub directly
  return json(200, { user: USER, updatedAt: new Date().toISOString(), days }, 'public, s-maxage=3600, stale-while-revalidate=86400')
}
