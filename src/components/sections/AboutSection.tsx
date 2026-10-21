import { memo } from 'react'
import { Section } from '@/components/shared'
import { Reveal, ScrollRevealText } from '@/components/animations'

const MANIFESTO =
  "I'm Adriel, an Information Systems student who builds AI-powered web and mobile products that solve real, everyday problems, from clean architecture to the last pixel."

const FACTS = [
  { label: 'Currently', title: 'System Development Intern', detail: 'LLDIKTI Wilayah XVI · Remote' },
  { label: 'Studying', title: 'Information Systems', detail: 'Klabat University · 2023 – 2027' },
  { label: 'Recognition', title: 'Best Technical Excellence Award', detail: 'Proxo Coris 2026 · Mobile App Development' },
]

/**
 * About — one large manifesto paragraph that lights up word by word on scroll (PRD §6.2),
 * followed by three quick facts.
 */
export const AboutSection = memo(function AboutSection() {
  return (
    <Section id="about" className="bg-ink">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr] lg:gap-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent lg:pt-4">About me</p>
        <ScrollRevealText
          text={MANIFESTO}
          highlight={['AI-powered', 'web', 'mobile']}
          className="font-display text-[clamp(2.25rem,5vw,5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-foreground"
        />
      </div>

      <div className="mt-16 grid gap-8 border-t border-border pt-8 sm:grid-cols-3 lg:ml-[248px] lg:mt-24">
        {FACTS.map((fact, i) => (
          <Reveal key={fact.label} delay={i * 0.08}>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-foreground-subtle">{fact.label}</p>
            <p className="font-display text-2xl font-extrabold uppercase leading-tight text-foreground">{fact.title}</p>
            <p className="mt-1 text-sm text-foreground-muted">{fact.detail}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
})
