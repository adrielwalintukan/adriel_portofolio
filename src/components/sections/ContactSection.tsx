import { memo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { InfiniteMarquee } from '@/components/animations'
import { Button, ContactForm } from '@/components/ui'
import { CONTACT_INFO, SOCIAL_LINKS } from '@/lib/constants'
import { useLocalTime } from '@/hooks'

const MARQUEE_ITEMS = ["Let's build something", "Let's build something"]

/**
 * Closing block (PRD §6.9–6.10): accent marquee band, a tilted CTA card over the portrait,
 * then the contact details and form.
 */
export const ContactSection = memo(function ContactSection() {
  const ctaRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const time = useLocalTime(CONTACT_INFO.timeZone)
  const { scrollYProgress } = useScroll({ target: ctaRef, offset: ['start end', 'center center'] })
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, -2])
  const y = useTransform(scrollYProgress, [0, 1], [80, 0])

  return (
    <section id="contact" className="bg-ink">
      {/* Decorative band; the same words are the CTA heading below */}
      <div aria-hidden="true" className="bg-accent py-4 text-ink sm:py-6">
        <InfiniteMarquee speed={60} pauseOnHover={false}>
          {MARQUEE_ITEMS.map((text, i) => (
            <span
              key={i}
              className="flex items-center gap-6 whitespace-nowrap font-display text-6xl font-black uppercase leading-none sm:gap-8 sm:text-8xl"
            >
              {text}
              <span className="text-4xl sm:text-6xl">✦</span>
            </span>
          ))}
        </InfiniteMarquee>
      </div>

      {/* CTA card over a dimmed portrait */}
      <div ref={ctaRef} className="relative overflow-hidden px-[var(--spacing-container)] py-24 sm:py-32">
        <img
          src="/images/adriel.jpg"
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%] opacity-25 grayscale"
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute inset-0 translate-x-3 translate-y-3 -rotate-6 rounded-2xl bg-paper/15" aria-hidden="true" />
          <motion.div
            style={reduceMotion ? { rotate: -2 } : { rotate, y }}
            className="relative rounded-2xl bg-paper p-8 text-center text-ink sm:p-12"
          >
            <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest text-paper-fg-muted">
              <span className="h-2.5 w-2.5 bg-accent" aria-hidden="true" />
              Let&apos;s work together
            </p>
            <h2 className="mt-5 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-black uppercase leading-[0.9] tracking-tight text-ink">
              Let&apos;s bring
              <br />
              <span className="text-paper-dim">your ideas</span> to life.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm text-paper-fg-muted sm:text-base">
              Have a project, an internship or a collaboration in mind? Tell me about it and I&apos;ll get back to you.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="#contact-form" variant="ink" icon={<ArrowUpRight className="h-4 w-4" />}>
                Contact me
              </Button>
            </div>
            <div className="mt-10 flex justify-between border-t border-paper-line pt-4 font-mono text-xs uppercase text-paper-fg-muted">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                {CONTACT_INFO.city}
              </span>
              <span className="tabular-nums">
                {time} {CONTACT_INFO.timeZoneLabel}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact details + form */}
      <div id="contact-form" className="section-container grid scroll-mt-24 gap-12 pb-24 pt-8 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">Get in touch</p>
          <h3 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tight text-foreground sm:text-7xl">
            Say hello
          </h3>
          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="mt-8 block break-all text-xl font-medium text-foreground underline-offset-4 hover:text-accent hover:underline sm:text-2xl"
          >
            {CONTACT_INFO.email}
          </a>
          <p className="mt-3 flex items-center gap-2 text-sm text-foreground-muted">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {CONTACT_INFO.availability}
          </p>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {SOCIAL_LINKS.filter((s) => s.name !== 'Email').map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-lg text-foreground hover:text-accent">
                  {s.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm />
      </div>
    </section>
  )
})
