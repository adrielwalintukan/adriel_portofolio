import { memo, useRef, type PointerEvent } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ArrowDown } from 'lucide-react'
import { FiGithub, FiLinkedin, FiInstagram } from 'react-icons/fi'
import { TextReveal } from '@/components/animations'
import { Button } from '@/components/ui'
import { CORE_STRENGTHS, SOCIAL_LINKS } from '@/lib/constants'
import { useAppReady, useDeviceDetect, useMediaQuery } from '@/hooks'

const SOCIAL_ICONS = { FiGithub, FiLinkedin, FiInstagram } as const
const HERO_SOCIALS = SOCIAL_LINKS.filter((s) => s.icon in SOCIAL_ICONS)
const NAME_LINES = ['Adriel', 'Walintukan']
const PHOTO = '/images/adriel-walintukan.webp'
const ROBOT = '/images/robot.webp'
// hero-mask.png = union of both figures' silhouettes, same framing as the photos
const XRAY_MASK =
  'radial-gradient(circle 170px at var(--mx, -999px) var(--my, -999px), #000 35%, transparent 100%), url(/images/hero-mask.png)'

// Face sits left of centre in the landscape shot; keep it in frame on portrait screens.
const photoClass = 'h-full w-full object-cover object-[19%_30%] lg:object-[30%_35%]'

/**
 * Hero — full-bleed portrait like the Matteo reference: minimal overlay (name, focus areas,
 * CTA) and a red duotone "x-ray" of the photo revealed around the cursor.
 */
export const HeroSection = memo(function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const ready = useAppReady()
  const reduceMotion = useReducedMotion()
  const { isTouchDevice } = useDeviceDetect()
  const isDesktop = useMediaQuery('lg')
  const xray = !reduceMotion && !isTouchDevice

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const nameY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const nameOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  // CSS variables instead of state: the mask follows the pointer without re-rendering
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

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
      onPointerMove={xray ? onPointerMove : undefined}
      className="group/hero relative min-h-[100svh] w-full overflow-hidden bg-accent text-paper [--focus-ring:var(--color-ink)]"
    >
      <motion.div className="pointer-events-none absolute inset-0" style={reduceMotion ? undefined : { y: photoY }}>
        <img src={PHOTO} alt="Adriel Walintukan" fetchPriority="high" width={1672} height={941} className={photoClass} />
        {xray && (
          // robot version, visible only inside a soft circle at the pointer AND on the figure (silhouette mask)
          <img
            src={ROBOT}
            alt=""
            aria-hidden="true"
            width={1672}
            height={941}
            className={`${photoClass} absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100 [mask-position:0_0,19%_30%] lg:[mask-position:0_0,30%_35%]`}
            style={{ maskImage: XRAY_MASK, WebkitMaskImage: XRAY_MASK, maskSize: 'auto, cover', maskRepeat: 'no-repeat', maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}
          />
        )}
        {/* keeps the bottom copy readable on small screens, where it overlaps the face */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent lg:hidden" />
      </motion.div>

      <div className="section-container pointer-events-none relative z-10 flex min-h-[100svh] flex-col pb-8 pt-24 sm:pt-28 [&_a]:pointer-events-auto">
        <motion.h1
          aria-label="Adriel Walintukan"
          className="mt-auto font-display font-black uppercase leading-[0.82] tracking-tight text-paper text-[clamp(2.75rem,14vw,7rem)] lg:mt-0 lg:self-end lg:text-right lg:text-ink lg:text-[clamp(4rem,7vw,8rem)]"
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

        <motion.div {...fadeUp(0.65)} className="mt-6 lg:mt-10 lg:self-end lg:text-right lg:text-ink">
          <p className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest lg:justify-end">
            <span className="h-2 w-2 rounded-full bg-accent lg:bg-ink" aria-hidden="true" />
            What I do
          </p>
          <ul className="space-y-0.5 text-sm font-medium sm:text-base">
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
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-paper text-ink transition-colors hover:bg-accent"
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
              className="group inline-flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-wide underline-offset-4 hover:underline lg:text-ink"
            >
              Resume
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <span className="pointer-events-auto">
              {/* red would vanish into the red backdrop on desktop; on mobile it sits on the dark gradient */}
              <Button href="#contact" variant={isDesktop ? 'ink' : 'primary'} size="lg" icon={<ArrowUpRight className="h-4 w-4" />}>
                Let&apos;s talk
              </Button>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
