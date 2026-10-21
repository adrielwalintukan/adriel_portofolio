import { memo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ArrowDown } from 'lucide-react'
import { FiGithub, FiLinkedin, FiInstagram } from 'react-icons/fi'
import { TextReveal } from '@/components/animations'
import { Button } from '@/components/ui'
import { CORE_STRENGTHS, SOCIAL_LINKS } from '@/lib/constants'
import { useAppReady } from '@/hooks'

const SOCIAL_ICONS = { FiGithub, FiLinkedin, FiInstagram } as const
const HERO_SOCIALS = SOCIAL_LINKS.filter((s) => s.icon in SOCIAL_ICONS)
const NAME_LINES = ['Adriel', 'Walintukan']
const PHOTO = '/images/adriel.jpg'

// Grayscale photo multiplied onto the red section = red/black duotone, no image editing needed.
const photoClass = 'h-full w-full object-cover object-[50%_25%] grayscale contrast-125 mix-blend-multiply'

/**
 * Hero — signal-red editorial layout (PRD §6.1): giant name, duotone portrait,
 * focus areas and CTA. Name reveals letter by letter once the loader is gone.
 */
export const HeroSection = memo(function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const ready = useAppReady()
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const nameY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const nameOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <section id="hero" ref={ref} className="relative min-h-[100svh] w-full overflow-hidden bg-accent text-ink [--focus-ring:var(--color-ink)]">
      {/* Desktop portrait — bleeds off the right edge */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[50%] lg:block"
        style={reduceMotion ? undefined : { y: photoY }}
      >
        <img src={PHOTO} alt="Adriel Walintukan" fetchPriority="high" width={960} height={1280} className={photoClass} />
      </motion.div>

      <div className="section-container relative z-10 flex min-h-[100svh] flex-col pb-8 pt-24 sm:pt-28">
        <motion.h1
          aria-label="Adriel Walintukan"
          className="font-display font-black uppercase leading-[0.82] tracking-tight text-ink text-[clamp(3.75rem,15vw,13rem)]"
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

        {/* Mobile portrait */}
        {/* bg-accent: this sits in the z-10 stacking context, so it needs its own red to multiply onto */}
        <div className="relative -mx-[var(--spacing-container)] mt-6 aspect-[4/5] overflow-hidden bg-accent lg:hidden">
          <img src={PHOTO} alt="" fetchPriority="high" width={960} height={1280} className={photoClass} />
        </div>

        <div className="mt-8 grid items-end gap-10 lg:mt-auto lg:max-w-[50%] lg:grid-cols-[1fr_auto] lg:gap-12">
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
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-paper transition-colors hover:bg-paper hover:text-ink"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.65)} className="flex flex-col gap-6 lg:items-end lg:text-right">
            <div>
              <p className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest lg:justify-end">
                <span className="h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
                What I do
              </p>
              <ul className="space-y-0.5 text-sm font-medium">
                {CORE_STRENGTHS.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.8)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 lg:absolute lg:bottom-8 lg:right-[var(--spacing-container)] lg:mt-0">
          <a
            href="/Resume_Adriel_Walintukan.pdf"
            download="Resume_Adriel_Walintukan.pdf"
            className="group inline-flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-wide text-ink underline-offset-4 hover:underline lg:text-paper"
          >
            Resume
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
          <Button href="#contact" variant="ink" size="lg" icon={<ArrowUpRight className="h-4 w-4" />}>
            Let&apos;s talk
          </Button>
        </motion.div>
      </div>
    </section>
  )
})
