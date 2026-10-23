import { memo, useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Section } from '@/components/shared'
import { AnimatedCounter, Reveal } from '@/components/animations'
import { useInView } from '@/hooks'
import { cn } from '@/lib/utils'

// mirrors Day in api/github-activity.ts (kept separate: api/ is outside this TS project)
type Day = { date: string; count: number; level: number }
type Activity = { user: string; updatedAt: string; days: Day[] }

const CELL = 12 // minimum cell size; cells grow to fill wide cards
const GAP = 3
// level 0-4 from GitHub, drawn in the site accent instead of GitHub green
const LEVEL = ['bg-border', 'bg-accent/25', 'bg-accent/50', 'bg-accent/75', 'bg-accent']

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts })

function summarize(days: Day[]) {
  let total = 0
  let active = 0
  let longest = 0
  let run = 0
  for (const d of days) {
    total += d.count
    if (d.count) {
      active++
      longest = Math.max(longest, ++run)
    } else run = 0
  }
  // today may simply not have commits yet, so a streak still counts if it ended yesterday
  let current = 0
  let i = days.length - 1
  if (days[i]?.count === 0) i--
  for (; i >= 0 && days[i].count; i--) current++
  return { total, active, longest, current }
}

/** Weeks as columns (Sunday first), padded so the first column starts on the right weekday. */
function toWeeks(days: Day[]): (Day | null)[][] {
  const cells: (Day | null)[] = [...Array(new Date(`${days[0].date}T00:00:00Z`).getUTCDay()).fill(null), ...days]
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/**
 * GitHub Activity — last 12 months of contributions from /api/github-activity (public
 * calendar, cached hourly), shown as headline numbers and a heatmap in the site accent.
 */
export const GitHubActivitySection = memo(function GitHubActivitySection() {
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin: '400px', triggerOnce: true })
  const [data, setData] = useState<Activity | null>(null)
  const [failed, setFailed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // fetch only once the section is close, so it never competes with the hero
  useEffect(() => {
    if (!near) return
    fetch('/api/github-activity')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Activity) => setData(d))
      .catch(() => setFailed(true))
  }, [near])

  // on narrow screens the grid scrolls sideways: start at the most recent weeks
  useEffect(() => {
    const el = scrollRef.current
    if (el && data) el.scrollLeft = el.scrollWidth
  }, [data])

  const weeks = data ? toWeeks(data.days) : null
  const stats = data ? summarize(data.days) : null
  const profile = `https://github.com/${data?.user ?? 'adrielwalintukan'}`

  return (
    <Section id="github" className="bg-ink">
      <div ref={ref} className="mb-12 grid items-end gap-6 md:mb-16 md:grid-cols-2">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">GitHub activity</p>
          <h2 className="font-display text-[clamp(3.5rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight text-foreground">
            Building
            <br />
            <span className="text-foreground-subtle">in the open</span>
          </h2>
        </div>
        <p className="max-w-md text-base text-foreground-muted md:justify-self-end md:text-lg">
          Every commit, pull request and review from the last twelve months, pulled live from my
          GitHub profile.
        </p>
      </div>

      <dl className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-4">
        {([
          ['Contributions', stats?.total, ''],
          ['Active days', stats?.active, ''],
          ['Longest streak', stats?.longest, 'd'],
          ['Current streak', stats?.current, 'd'],
        ] as const).map(([label, value, suffix], i) => (
          <Reveal key={label} delay={i * 0.08} className="flex flex-col-reverse gap-2 border-b border-r border-border p-5 sm:p-8">
            <dt className="font-mono text-xs uppercase tracking-widest text-foreground-subtle">{label}</dt>
            <dd className="font-display text-5xl font-black text-foreground sm:text-6xl">
              {value === undefined ? (
                <span className="text-border-hover">—</span>
              ) : (
                <>
                  <AnimatedCounter to={value} />
                  {suffix}
                </>
              )}
            </dd>
          </Reveal>
        ))}
      </dl>

      <div className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-8">
        {failed ? (
          <p className="py-10 text-center text-sm text-foreground-muted">
            Couldn't load the activity right now. It's all on{' '}
            <a href={profile} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
              GitHub
            </a>
            .
          </p>
        ) : (
          <div ref={scrollRef} className="overflow-x-auto pb-2">
            {/* month labels share the heatmap's column grid so they line up with the weeks */}
            <div
              className="mb-2 grid font-mono text-[11px] text-foreground-subtle"
              style={{ gridTemplateColumns: `repeat(${weeks?.length ?? 53}, minmax(${CELL}px, 1fr))`, columnGap: GAP }}
              aria-hidden="true"
            >
              {weeks?.map((week, w) => {
                // label the week that holds the 1st of a month (month starts are 4+ weeks apart, so labels never collide)
                const first = week.find((d) => d?.date.endsWith('-01'))
                return (
                  <span key={w} className="whitespace-nowrap">
                    {first ? fmt(first.date, { month: 'short' }) : ''}
                  </span>
                )
              })}
            </div>
            <div
              role="img"
              aria-label={stats ? `${stats.total} GitHub contributions in the last year` : 'Loading GitHub activity'}
              className="grid"
              style={{ gridTemplateRows: 'repeat(7, auto)', gridAutoColumns: `minmax(${CELL}px, 1fr)`, gridAutoFlow: 'column', gap: GAP }}
            >
              {(weeks ?? Array.from({ length: 53 }, () => Array(7).fill(null))).flatMap((week, w) =>
                week.map((day: Day | null, d: number) => (
                  <span
                    key={`${w}-${d}`}
                    title={day ? `${day.count || 'No'} contribution${day.count === 1 ? '' : 's'} on ${fmt(day.date, { month: 'short', day: 'numeric', year: 'numeric' })}` : undefined}
                    className={cn('aspect-square rounded-[3px]', day ? LEVEL[day.level] : weeks ? 'invisible' : 'animate-pulse bg-border/60')}
                  />
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5 text-xs text-foreground-subtle">
          <div className="flex items-center gap-2" aria-hidden="true">
            Less
            {LEVEL.map((c) => (
              <span key={c} className={cn('h-3 w-3 rounded-[3px]', c)} />
            ))}
            More
          </div>
          <div className="flex items-center gap-5">
            {data && <span>Updated {new Date(data.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
            <a
              href={profile}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-accent"
            >
              View on GitHub
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </Section>
  )
})
