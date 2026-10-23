import { memo, useState, type MouseEvent } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { Section } from '@/components/shared'
import { CertificateModal } from '@/components/ui'
import { CERTIFICATES_DATA, type Certificate } from '@/lib/constants'
import { useDeviceDetect } from '@/hooks'
import { cn } from '@/lib/utils'

const pad = (n: number) => String(n).padStart(2, '0')
const PREVIEW = 7 // rows shown before "Show all"; the list is ordered best-known issuer first

/**
 * Certificates — scannable table (issuer · title · date). On desktop the hovered row's
 * thumbnail follows the cursor; on touch it shows inline. Rows open the detail modal (PRD §6.8).
 */
export const CertificatesSection = memo(function CertificatesSection() {
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [hovered, setHovered] = useState<Certificate | null>(null)
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? CERTIFICATES_DATA : CERTIFICATES_DATA.slice(0, PREVIEW)
  const { isTouchDevice } = useDeviceDetect()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  return (
    <Section id="certificates" className="bg-ink">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            Certificates
          </p>
          <h2 className="font-display text-[clamp(3.5rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight text-foreground">
            Certified
            <br />
            <span className="text-foreground-subtle">skills</span>
          </h2>
        </div>
        <p className="max-w-xs text-sm text-foreground-muted sm:text-base">
          {pad(CERTIFICATES_DATA.length)} credentials in cybersecurity, AI, web engineering and
          testing. Select one to see details and the original PDF.
        </p>
      </div>

      <div
        className="relative rounded-2xl border border-border"
        onMouseMove={isTouchDevice ? undefined : onMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="hidden grid-cols-[14rem_1fr_7rem] gap-6 border-b border-border px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground-subtle md:grid">
          <span>Issuer</span>
          <span>Certificate</span>
          <span className="text-right">Date</span>
        </div>

        <ul>
          {shown.map((cert) => (
            <li key={cert.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => setSelected(cert)}
                onMouseEnter={() => setHovered(cert)}
                onFocus={() => setHovered(cert)}
                className="group grid w-full grid-cols-[4rem_1fr_auto] items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-surface focus-visible:bg-surface md:grid-cols-[14rem_1fr_7rem] md:gap-6 md:px-6"
              >
                {/* Inline thumbnail on touch / small screens; cursor-follow preview on desktop */}
                <img
                  src={cert.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-16 rounded object-cover md:hidden"
                />
                <span className="hidden text-sm text-foreground-muted md:block">{cert.issuer}</span>
                <span className="min-w-0">
                  <span className="block font-display text-xl font-extrabold uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent group-focus-visible:text-accent sm:text-2xl">
                    {cert.title}
                  </span>
                  <span className="mt-1 block text-xs text-foreground-subtle md:hidden">
                    {cert.issuer}
                  </span>
                </span>
                <span className="flex items-center justify-end gap-2 font-mono text-xs uppercase text-foreground-muted">
                  {cert.date ?? cert.year}
                  <ArrowUpRight className="hidden h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
                </span>
              </button>
            </li>
          ))}
        </ul>

        {!isTouchDevice && (
          <AnimatePresence>
            {hovered && (
              // outer div follows the cursor (framer owns its transform); inner img does the centering offset
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                style={{ x: springX, y: springY }}
                className="pointer-events-none absolute left-0 top-0 z-10 hidden lg:block"
              >
                <img
                  src={hovered.image}
                  alt=""
                  className="w-64 max-w-none -translate-x-1/2 -translate-y-[110%] rounded-lg border border-border-hover object-cover shadow-elevated"
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {CERTIFICATES_DATA.length > PREVIEW && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="group inline-flex h-12 items-center gap-2 rounded-full border border-border-hover px-6 font-mono text-xs uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {expanded ? 'Show less' : `Show all ${pad(CERTIFICATES_DATA.length)}`}
            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      )}

      <CertificateModal certificate={selected} onClose={() => setSelected(null)} />
    </Section>
  )
})
