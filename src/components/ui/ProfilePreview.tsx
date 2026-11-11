import { MapPin } from 'lucide-react'
import type { SocialProfile } from '@/lib/constants'

/**
 * Hover/focus card previewing a social profile.
 * CSS-only: the trigger wrapper provides `group` (and `sm:relative`); this renders the card.
 * `section-dark` re-points the palette so it reads as a dark panel on the light hero.
 */
export function ProfilePreview({ profile }: { profile: SocialProfile }) {
  return (
    <div
      aria-hidden="true"
      className="section-dark pointer-events-none invisible absolute bottom-full left-0 z-20 mb-3 w-[min(20rem,calc(100vw-2rem))] translate-y-1 rounded-xl border border-border opacity-0 shadow-2xl transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      <div className="flex items-center gap-3 p-4">
        <img
          src={profile.avatar}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-full object-cover object-[50%_25%] ring-1 ring-border-hover"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-extrabold uppercase leading-none tracking-tight text-foreground">
            {profile.name}
          </p>
          <p className="mt-1 truncate font-mono text-[11px] text-foreground-subtle">{profile.handle}</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-sm font-medium text-foreground">{profile.headline}</p>
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-foreground-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {profile.location}
        </p>
      </div>

      {profile.stats && (
        <dl className="flex border-t border-border">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="flex flex-1 flex-col-reverse px-4 py-3">
              <dt className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
                {stat.label}
              </dt>
              <dd className="font-display text-xl font-black tabular-nums text-foreground">
                {stat.value.toLocaleString('en-US')}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {profile.achievements && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-semibold text-foreground">Achievements</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.achievements.map((achievement) => (
              <li key={achievement.name} className="relative">
                <img
                  src={achievement.image}
                  alt={achievement.name}
                  width={36}
                  height={36}
                  loading="lazy"
                  className="h-9 w-9"
                />
                {achievement.count && (
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-accent px-1 font-mono text-[9px] font-bold leading-4 text-ink">
                    x{achievement.count}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}