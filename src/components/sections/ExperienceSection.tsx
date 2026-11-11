import { memo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EXPERIENCE_TIMELINE } from '@/lib/constants'
import { Section } from '@/components/shared'
import { Reveal } from '@/components/animations'

/**
 * Experience — dark section right after Selected Work (which stays the one light section),
 * with a two-column timeline inside one large card; the accent line grows with scroll progress (PRD §6.7).
 */
export const ExperienceSection = memo(function ExperienceSection() {
  const listRef = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start center', 'end center'] })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <Section id="experience" className="section-dark text-foreground">
      <div className="mb-12 text-center md:mb-16">
        <span className="inline-block rounded-full border border-border-hover bg-surface px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent">
          My journey
        </span>
        <h2 className="mt-6 font-display text-[clamp(2.75rem,7vw,6.5rem)] font-black uppercase leading-[0.9] tracking-tight text-foreground">
          Turning ideas into
          <br />
          <span className="text-foreground-subtle">working</span> software
        </h2>
      </div>

      <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-surface p-4 sm:p-8 lg:p-12">
        <div className="relative">
          {/* Track + scroll-linked progress line (left on mobile, centered on md+) */}
          <div
            className="absolute bottom-2 left-[7px] top-2 w-px bg-border-hover md:left-1/2"
            aria-hidden="true"
          />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-accent md:left-1/2"
            aria-hidden="true"
          />

          <ol ref={listRef}>
            {EXPERIENCE_TIMELINE.map((item, i) => (
              <li
                key={item.id}
                className="relative grid gap-3 pb-10 pl-8 last:pb-0 md:grid-cols-2 md:gap-x-16 md:pl-0"
              >
                <span
                  className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-surface bg-accent md:left-1/2 md:-translate-x-1/2"
                  aria-hidden="true"
                />
                {/* logo sits on the timeline side: left on mobile, right of the text on md+ */}
                <Reveal delay={i * 0.05} className="flex items-start gap-4 md:flex-row-reverse md:text-right">
                  {item.logo && (
                    <img
                      src={item.logo}
                      alt={`${item.role} logo`}
                      width={56}
                      height={56}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-3xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-foreground">{item.role}</p>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                      {item.year}
                    </p>
                  </div>
                </Reveal>
                <Reveal delay={i * 0.05 + 0.05}>
                  <span className="inline-block rounded-full border border-border-hover px-3 py-0.5 font-mono text-[11px] uppercase tracking-wider text-foreground-muted">
                    {item.category}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
                    {item.description}
                  </p>
                  {item.technologies && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-full border border-border-hover px-3 py-1 text-xs text-foreground-muted"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
                {/* sub-entries: indented under the track, aligned with the parent's prose column */}
                {item.children && (
                  <ol className="mt-3 space-y-4 pl-6 md:col-start-2 md:mt-1">
                    {item.children.map((child) => (
                      <li key={child.id} className="relative">
                        <span
                          className="absolute left-[-29px] top-2 h-2.5 w-2.5 rounded-full border-2 border-border-hover bg-surface"
                          aria-hidden="true"
                        />
                        <div className="flex items-start gap-3">
                          {child.logo && (
                            <img
                              src={child.logo}
                              alt={`${child.role} logo`}
                              width={28}
                              height={28}
                              loading="lazy"
                              className="h-7 w-7 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="inline-block rounded-full border border-border-hover px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
                              {child.category}
                            </span>
                            <p className="mt-1.5 text-sm font-semibold text-foreground-muted">
                              {child.title}
                            </p>
                            <p className="text-xs text-foreground-subtle">
                              {child.role} ·{' '}
                              <span className="font-mono uppercase tracking-wider">{child.year}</span>
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                              {child.description}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
})
