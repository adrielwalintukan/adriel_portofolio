import { memo } from 'react'
import { Section } from '@/components/shared'
import { Reveal } from '@/components/animations'
import { WORK_PROCESS } from '@/lib/constants'

/**
 * How I Work — four-step process in bordered columns (PRD §6.5).
 */
export const HowIWorkSection = memo(function HowIWorkSection() {
  return (
    <Section id="process" className="bg-ink">
      <div className="mb-12 grid items-end gap-6 md:mb-16 md:grid-cols-2">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            Work process
          </p>
          <h2 className="font-display text-[clamp(3.5rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight text-foreground">
            How I
            <br />
            work
          </h2>
        </div>
        <p className="max-w-md text-base text-foreground-muted md:justify-self-end md:text-lg">
          A simple process that takes an idea from a rough problem statement to a product people
          actually use.
        </p>
      </div>

      <ol className="grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4">
        {WORK_PROCESS.map((step, i) => (
          <li key={step.title} className="border-b border-r border-border">
            <Reveal delay={i * 0.1} className="flex h-full flex-col p-6 sm:p-8">
              <span className="font-display text-6xl font-black text-foreground">{i + 1}.</span>
              <h3 className="mt-16 font-display text-3xl font-black uppercase tracking-tight text-foreground lg:mt-24">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
                {step.description}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  )
})
