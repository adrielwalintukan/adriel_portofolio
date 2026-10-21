import { memo } from 'react'
import { Section } from '@/components/shared'
import { AnimatedCounter, Reveal, ScrollRevealText } from '@/components/animations'
import {
  CERTIFICATES_DATA,
  CONTACT_INFO,
  PROJECTS,
  SKILLS_DATA,
  YEARS_EXPERIENCE,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

const STATS = [
  {
    value: YEARS_EXPERIENCE,
    suffix: '+',
    label: 'Years experience',
    note: 'Building web, mobile and AI projects since starting university.',
  },
  {
    value: PROJECTS.length,
    suffix: '',
    label: 'Projects shipped',
    note: 'From AI assistants to clinic and library management systems.',
    accent: true,
  },
  {
    value: SKILLS_DATA.reduce((n, g) => n + g.skills.length, 0),
    suffix: '',
    label: 'Technologies',
    note: 'Across backend, AI, frontend, mobile and tooling.',
  },
  {
    value: CERTIFICATES_DATA.length,
    suffix: '',
    label: 'Certificates',
    note: 'In cybersecurity, AI, web engineering and testing.',
  },
]

/**
 * Numbers — scroll-lit statement plus four big counters taken from the data (PRD §6.6).
 */
export const NumbersSection = memo(function NumbersSection() {
  return (
    <Section id="numbers" className="bg-ink pt-0 sm:pt-0 md:pt-0 lg:pt-0">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr] lg:gap-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent lg:pt-3">
          Why work with me
        </p>
        <div>
          <ScrollRevealText
            text="I build products that are fast, accessible and genuinely useful, with an eye for detail from the database to the interface."
            highlight={['fast', 'accessible', 'useful']}
            className="font-display text-[clamp(2rem,4.5vw,4.25rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-foreground"
          />
          <p className="mt-8 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-foreground-muted sm:text-sm">
            <span className="h-3 w-3 bg-accent" aria-hidden="true" />[ Based in {CONTACT_INFO.city}{' '}
            {'//'} Available for opportunities ]
          </p>
        </div>
      </div>

      <div className="mt-16 grid border-l border-t border-border sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 0.08}
            className="flex flex-col border-b border-r border-border p-6 sm:p-8"
          >
            <p className="text-sm text-foreground-muted">{stat.note}</p>
            <p
              className={cn(
                'mt-auto pt-10 font-display text-7xl font-black leading-none tabular-nums lg:text-8xl',
                stat.accent ? 'text-accent' : 'text-foreground'
              )}
            >
              <AnimatedCounter to={stat.value} />
              {stat.suffix}
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-foreground">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
})
