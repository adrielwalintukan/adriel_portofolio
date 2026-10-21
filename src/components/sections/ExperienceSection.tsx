import { memo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EXPERIENCE_TIMELINE } from '@/lib/constants'
import { Section } from '@/components/shared'
import { Reveal } from '@/components/animations'

/**
 * Experience — paper section with a two-column timeline inside one large card; the
 * accent line grows with scroll progress (PRD §6.7).
 */
export const ExperienceSection = memo(function ExperienceSection() {
  const listRef = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start center', 'end center'] })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <Section id="experience" className="bg-paper text-ink">
      <div className="mb-12 text-center md:mb-16">
        <span className="inline-block rounded-full bg-ink px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent">
          My journey
        </span>
        <h2 className="mt-6 font-display text-[clamp(2.75rem,7vw,6.5rem)] font-black uppercase leading-[0.9] tracking-tight text-ink">
          Turning ideas into
          <br />
          <span className="text-paper-dim">working</span> software
        </h2>
      </div>

      <div className="mx-auto max-w-5xl rounded-3xl border border-paper-line bg-white/50 p-4 sm:p-8 lg:p-12">
        <div className="relative">
          {/* Track + scroll-linked progress line (left on mobile, centered on md+) */}
          <div
            className="absolute bottom-2 left-[7px] top-2 w-px bg-paper-line md:left-1/2"
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
                className="relative grid gap-3 pb-10 pl-8 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0"
              >
                <span
                  className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-paper bg-accent md:left-1/2 md:-translate-x-1/2"
                  aria-hidden="true"
                />
                <Reveal delay={i * 0.05} className="md:text-right">
                  <h3 className="font-display text-2xl font-black uppercase leading-tight tracking-tight text-ink sm:text-3xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-ink">{item.role}</p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-paper-fg-muted">
                    {item.year}
                  </p>
                </Reveal>
                <Reveal delay={i * 0.05 + 0.05}>
                  <span className="inline-block rounded-full border border-paper-line px-3 py-0.5 font-mono text-[11px] uppercase tracking-wider text-paper-fg-muted">
                    {item.category}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-paper-fg-muted sm:text-base">
                    {item.description}
                  </p>
                  {item.technologies && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-paper"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
})
