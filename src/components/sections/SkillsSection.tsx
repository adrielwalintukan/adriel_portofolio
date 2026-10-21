import { memo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { SKILLS_DATA, type SkillCategory } from '@/lib/constants'
import { getSkillIcon } from '@/lib/skillIcons'
import { cn } from '@/lib/utils'

const COUNT = SKILLS_DATA.length
const pad = (n: number) => String(n).padStart(2, '0')
const SEGMENT_VH = 80 // scroll distance per category while pinned

function CategoryCard({ group }: { group: SkillCategory }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8 lg:p-10">
      <h3 className="font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground sm:text-5xl">
        {group.category}
      </h3>
      <p className="mt-3 max-w-md text-sm text-foreground-muted sm:text-base">{group.description}</p>
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-3">
        {group.skills.map((skill) => (
          <li
            key={skill.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm font-medium text-foreground sm:py-3"
          >
            <span className="text-xl" aria-hidden="true">
              {getSkillIcon(skill.icon, skill.name)}
            </span>
            {skill.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Heading() {
  return (
    <>
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">Skills</p>
      <h2 className="font-display text-[clamp(2.75rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight text-foreground">
        What
        <br />
        <span className="text-foreground-subtle">I do</span>
      </h2>
    </>
  )
}

/**
 * What I Do — pinned section: scrolling steps through skill categories with a
 * 01/03 counter (PRD §6.4). Reduced motion gets a plain stacked list.
 */
export const SkillsSection = memo(function SkillsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const pinned = !reduceMotion

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(COUNT - 1, Math.floor(v * COUNT)))
  })

  // Jump to the middle of a category's scroll segment
  const goTo = (i: number) => {
    if (!ref.current) return
    const segment = (window.innerHeight * SEGMENT_VH) / 100
    window.scrollTo({ top: ref.current.offsetTop + segment * (i + 0.5), behavior: 'smooth' })
  }

  if (!pinned) {
    return (
      <section id="skills" className="bg-ink py-16 sm:py-20">
        <div className="section-container">
          <Heading />
          <div className="mt-12 flex flex-col gap-6">
            {SKILLS_DATA.map((group) => (
              <CategoryCard key={group.category} group={group} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="skills" className="bg-ink">
      <div ref={ref} style={{ height: `${100 + COUNT * SEGMENT_VH}vh` }}>
        {/* mobile: compact heading + counter on top, card below (pt clears the fixed header) */}
        <div className="sticky top-0 flex h-[100svh] items-start pt-20 lg:items-center lg:pt-0">
          <div className="section-container grid w-full items-center gap-6 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
            <div className="flex items-end justify-between gap-4 lg:block">
              <div>
                <Heading />
              </div>
              <p className="font-display text-4xl font-black tabular-nums text-foreground lg:mt-10 lg:text-5xl">
                {pad(active + 1)}
                <span className="text-xl text-foreground-subtle lg:text-2xl"> / {pad(COUNT)}</span>
              </p>
              <ul className="mt-6 hidden space-y-1 lg:block">
                {SKILLS_DATA.map((group, i) => (
                  <li key={group.category}>
                    <button
                      onClick={() => goTo(i)}
                      aria-current={i === active ? 'step' : undefined}
                      className={cn(
                        'font-display text-xl font-extrabold uppercase tracking-wide transition-colors hover:text-foreground',
                        i === active ? 'text-accent' : 'text-foreground-subtle'
                      )}
                    >
                      {group.category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <CategoryCard group={SKILLS_DATA[active]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
})
