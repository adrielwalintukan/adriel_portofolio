import { memo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ArrowDown } from 'lucide-react'
import { FiGithub, FiLinkedin, FiInstagram } from 'react-icons/fi'
import { TextReveal } from '@/components/animations'
import { Button } from '@/components/ui'
import { CORE_STRENGTHS, SOCIAL_LINKS } from '@/lib/constants'
import { useAppReady } from '@/hooks'
import { HeroCharacter } from './HeroCharacter'

const SOCIAL_ICONS = { FiGithub, FiLinkedin, FiInstagram } as const
const HERO_SOCIALS = SOCIAL_LINKS.filter((s) => s.icon in SOCIAL_ICONS)
const NAME_LINES = ['Adriel', 'Walintukan']
/**
 * Hero — a 3D-rendered Adriel whose head turns to follow the cursor, over the same living
 * dot-grid backdrop as the other sections.
 */
export const HeroSection = memo(function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const ready = useAppReady()
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const nameY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const nameOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  // slide only, no fade: the copy is painted (under the loader) from the prerendered HTML,
  // which is what makes it count for LCP
  const fadeUp = (delay: number) => ({
    initial: { y: 16 },
    animate: ready ? { y: 0 } : undefined,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <section
      id="hero"
      ref={ref}
      className="section-fx relative min-h-[100svh] w-full overflow-hidden bg-background text-foreground [--focus-ring:var(--color-ink)]"
    >
      {/* character: fills the top of the screen on phones (copy overlaps its jacket), and stands
          large between the copy columns on desktop, cropped at the waist by the section edge */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-12 h-[64svh] w-[150vw] -translate-x-1/2 lg:-bottom-[14svh] lg:top-auto lg:h-[118svh] lg:w-[118svh]"
        style={reduceMotion ? undefined : { y: photoY }}
      >
        <HeroCharacter />
      </motion.div>
      {/* fades the jacket into the page so the copy laid over it stays readable on small screens */}
      <div className="pointer-events-none absolute inset-x-0 top-[34svh] h-[66svh] bg-gradient-to-b from-transparent via-background/85 via-30% to-background to-50% lg:hidden" />

      <div className="section-container pointer-events-none relative z-10 flex min-h-[100svh] flex-col pb-8 pt-[41svh] lg:pt-28 [&_a]:pointer-events-auto">
        {/* below lg the copy starts under the character's chin so the name never covers the face */}
        <motion.h1
          aria-label="Adriel Walintukan"
          className="mt-auto font-display font-black uppercase leading-[0.82] tracking-tight text-ink text-[clamp(2.75rem,14vw,7rem)] lg:mt-0 lg:self-end lg:text-right lg:text-[clamp(4rem,7vw,8rem)]"
          style={reduceMotion ? undefined : { y: nameY, opacity: nameOpacity }}
        >
          {NAME_LINES.map((line, i) => (
            <span key={line} className="block" aria-hidden="true">
              {ready ? (
                <TextReveal text={line} by="char" delay={i * 0.15} />
              ) : (
                // reserves the exact space while the loader is still up
                <span className="invisible">{line}</span>
              )}
            </span>
          ))}
        </motion.h1>

        <motion.div {...fadeUp(0.65)} className="mt-6 lg:mt-10 lg:self-end lg:text-right">
          <p className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest lg:justify-end">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            What I do
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm font-medium sm:text-base lg:block lg:space-y-0.5">
            {CORE_STRENGTHS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-8 flex flex-col gap-8 lg:mt-auto lg:flex-row lg:items-end lg:justify-between">
          <motion.div {...fadeUp(0.5)}>
            <p className="max-w-sm text-base font-medium leading-snug sm:text-lg">
              Information Systems student building AI-powered web &amp; mobile products with clean architecture.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {HERO_SOCIALS.map((s) => {
                const Icon = SOCIAL_ICONS[s.icon as keyof typeof SOCIAL_ICONS]
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.name}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-paper transition-colors hover:bg-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.8)} className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href="/Resume_Adriel_Walintukan.pdf"
              download="Resume_Adriel_Walintukan.pdf"
              className="group inline-flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-wide underline-offset-4 hover:underline"
            >
              Resume
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <span className="pointer-events-auto">
              <Button href="#contact" variant="ink" size="lg" icon={<ArrowUpRight className="h-4 w-4" />}>
                Let&apos;s talk
              </Button>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
