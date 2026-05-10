import { memo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EXPERIENCE_TIMELINE } from '@/lib/constants'
import { Section, SectionHeading } from '@/components/shared'
import { StaggerContainer } from '@/components/animations'
import { TimelineCard } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'

/**
 * Premium cinematic Experience / Journey Timeline Section.
 * Features a scroll-linked glowing timeline and alternating cards.
 */
export const ExperienceSection = memo(function ExperienceSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress within this specific section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  // Map scroll progress to the height of the glowing line
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <Section id="experience" className="relative">
      <AmbientGlow variant="secondary" className="right-[-10%] top-[30%] opacity-30" />
      <AmbientGlow variant="primary" className="left-[-10%] top-[70%] opacity-30" />

      <SectionHeading
        label="Journey"
        title="My Experience & Growth Timeline"
        description="A timeline of learning, building, experimenting, and creating modern digital experiences through technology and design."
      />

      <div ref={containerRef} className="relative mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* The static background line */}
        <div className="absolute bottom-0 left-8 top-0 w-px bg-border/40 lg:left-1/2 lg:-translate-x-1/2" />
        
        {/* The animated glowing scroll progress line */}
        <motion.div
          className="absolute left-8 top-0 w-px bg-gradient-to-b from-accent via-neon-cyan to-transparent lg:left-1/2 lg:-translate-x-1/2"
          style={{ height: lineHeight, willChange: 'height' }}
        />

        <StaggerContainer
          delay={0.1}
          staggerDelay={0.15}
          className="relative flex flex-col gap-12 lg:gap-0"
        >
          {EXPERIENCE_TIMELINE.map((item, index) => {
            const isEven = index % 2 === 0

            return (
              <div
                key={item.id}
                className="relative flex w-full flex-col lg:flex-row lg:justify-between"
              >
                {/* Mobile-only node (desktop node is inside TimelineCard to handle alternating sides easily) */}
                <div className="absolute -left-[5px] top-8 h-3 w-3 rounded-full border-2 border-accent bg-background shadow-[0_0_10px_rgba(0,255,255,0.5)] lg:hidden" />
                
                {/* 
                  On mobile, push content right of the line.
                  On desktop, TimelineCard handles alternating sides.
                */}
                <div className="w-full pl-12 lg:pl-0">
                  <TimelineCard item={item} isEven={isEven} />
                </div>
              </div>
            )
          })}
        </StaggerContainer>
      </div>
    </Section>
  )
})
