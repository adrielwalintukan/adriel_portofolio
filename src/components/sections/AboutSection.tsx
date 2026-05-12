import { memo } from 'react'
import { motion } from 'framer-motion'
import { ABOUT_STATS, CORE_STRENGTHS } from '@/lib/constants'
import { Section, SectionHeading } from '@/components/shared'
import { StaggerContainer, Reveal } from '@/components/animations'
import { StatCard, SkillCard, AchievementCard } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'

/**
 * Premium cinematic About Section.
 * Implements an asymmetric split layout with a visual composition on the left
 * and a personal storytelling & stats area on the right.
 */
export const AboutSection = memo(function AboutSection() {
  return (
    <Section id="about" className="relative">
      <AmbientGlow variant="primary" className="left-[-10%] top-[20%] opacity-40" />

      <SectionHeading
        label="About Me"
        title="Crafting Digital Experiences With Precision & Creativity"
        description="I build modern digital products focused on performance, interaction, scalability, and immersive user experiences."
      />

      <div className="mx-auto mt-12 grid grid-cols-1 items-start gap-16 lg:grid-cols-2 lg:gap-12 xl:gap-20">

        {/* LEFT COLUMN: Visual Composition (Hidden on mobile as it moves to Hero) */}
        <div className="relative mx-auto hidden w-full max-w-md lg:sticky lg:top-32 lg:block lg:max-w-none">
          <Reveal direction="up" delay={0.2} className="relative z-10 aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border/40 glass-strong shadow-glow-lg">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />

            {/* The profile image using object-cover */}
            <img
              src="/images/adriel_profile.png"
              alt="Adriel - Profile Photo"
              loading="lazy"
              className="h-full w-full object-cover"
            />

            {/* Floating decorative labels */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 top-20 z-20 hidden rounded-full border border-accent/30 bg-background/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-md lg:block"
              style={{ willChange: 'transform' }}
            >
              Fullstack Developer
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-4 bottom-32 z-20 hidden rounded-full border border-neon-cyan/30 bg-background/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-md lg:block"
              style={{ willChange: 'transform' }}
            >
              Mobile App Developer
            </motion.div>
          </Reveal>

          {/* Ambient glow behind the image */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-20 blur-[100px]" />
        </div>

        {/* RIGHT COLUMN: Content & Story */}
        <StaggerContainer delay={0.3} staggerDelay={0.1} className="flex flex-col">

          {/* Story Text */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mb-10">
            <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hello, I'm <span className="text-gradient">Adriel Walintukan</span>.
            </h3>
            <p className="mb-6 text-base leading-relaxed text-foreground-subtle sm:text-lg">
              I'm an Information System student at Klabat University. I have a strong interest in AI Integration, Web Developer, Mobile App Developer, Python, and Software Testing.
            </p>
            <p className="mb-6 text-base leading-relaxed text-foreground-subtle sm:text-lg">
              I believe technology can become a real solution to everyday problems, which motivates me to continuously learn, explore, and grow as a developer and technology enthusiast.
            </p>
            <p className="text-base leading-relaxed text-foreground-subtle sm:text-lg">
              <strong className="text-foreground">Career Goals:</strong> To become a professional capable of integrating AI into modern applications, creating impactful digital solutions, and helping others solve problems through technology.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {ABOUT_STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                style={{ willChange: 'opacity, transform' }}
                // Make the 3rd item span 2 columns on small screens, or 1 column on larger
                className={idx === 2 ? 'col-span-2 sm:col-span-1' : ''}
              >
                <StatCard label={stat.label} value={stat.value} suffix={stat.suffix} />
              </motion.div>
            ))}
          </div>

          {/* Core Strengths */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground-muted">
              Core Strengths
            </h4>
            <div className="flex flex-wrap gap-3">
              {CORE_STRENGTHS.map((skill) => (
                <SkillCard key={skill} name={skill} />
              ))}
            </div>
          </motion.div>

          {/* Featured Achievement */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <AchievementCard />
          </motion.div>

        </StaggerContainer>
      </div>
    </Section>
  )
})
