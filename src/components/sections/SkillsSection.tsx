import { memo } from 'react'
import { motion } from 'framer-motion'
import { Section, SectionHeading } from '@/components/shared'
import { StaggerContainer } from '@/components/animations'
import { TechSkillCard } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'
import { SKILLS_DATA } from '@/lib/constants'

/**
 * Premium cinematic Skills Section.
 * Categorized grid layout showcasing technical capabilities.
 */
export const SkillsSection = memo(function SkillsSection() {
  return (
    <Section id="skills" className="relative overflow-hidden">
      <AmbientGlow variant="secondary" className="right-[-5%] top-[10%] opacity-20" />
      <AmbientGlow variant="primary" className="left-[-10%] top-[80%] opacity-20" />

      <SectionHeading
        label="Skills"
        title="Technologies & Creative Capabilities"
        description="A collection of modern technologies, frameworks, tools, and creative skills used to build scalable and immersive digital experiences."
      />

      <div className="section-container relative z-10 mt-16 w-full">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-16">
          {SKILLS_DATA.map((categoryGroup, index) => (
            <motion.div
              key={categoryGroup.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="h-px w-8 bg-accent/50" />
                <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
                  {categoryGroup.category}
                </h3>
              </div>

              <StaggerContainer
                delay={0.2}
                staggerDelay={0.1}
                className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6"
              >
                {categoryGroup.skills.map((skill) => (
                  <motion.div
                    key={skill.name}
                    variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                    className="w-28 sm:w-32"
                  >
                    <TechSkillCard name={skill.name} icon={skill.icon} />
                  </motion.div>
                ))}
              </StaggerContainer>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
})
