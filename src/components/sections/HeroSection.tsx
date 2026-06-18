import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { FiGithub, FiLinkedin, FiInstagram } from 'react-icons/fi'
import { StaggerContainer, TextReveal, Reveal } from '@/components/animations'
import { HeroScene } from '@/components/3d'
import { Button, Badge } from '@/components/ui'

/**
 * Premium cinematic Hero Section.
 * Features a split layout with animated typography and an interactive 3D visual.
 */
export const HeroSection = memo(function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-20"
    >
      <div className="section-container relative z-10 w-full">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-12">

          {/* LEFT COLUMN: Content */}
          <StaggerContainer
            delay={0.2}
            staggerDelay={0.1}
            className="flex flex-col items-center text-center lg:items-start lg:text-left lg:pl-8 xl:pl-16 2xl:pl-24"
          >
            {/* Mobile Cinematic Portrait (Hidden on Desktop) */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="relative mb-8 -mt-8 flex justify-center lg:hidden"
            >
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-48 w-36"
              >
                {/* Holographic Glow & Rings */}
                <div className="absolute -inset-4 rounded-full bg-accent/20 blur-[40px]" />
                <div className="absolute -inset-1 animate-[spin_12s_linear_infinite] rounded-[40px] border border-accent/30 border-t-accent/80 border-r-neon-cyan/50" />
                <div className="absolute -inset-2 animate-[spin_15s_linear_infinite_reverse] rounded-[48px] border border-neon-cyan/10 border-b-neon-cyan/60" />

                {/* Portrait Container */}
                <div className="relative h-full w-full overflow-hidden rounded-[40px] border border-border/40 bg-surface/50 shadow-[0_0_30px_rgba(108,92,231,0.2)]">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                  <img
                    src="/images/adriel_profile.png"
                    alt="Adriel"
                    loading="lazy"
                    className="h-full w-full object-cover mix-blend-luminosity opacity-90 transition-all duration-700 active:mix-blend-normal active:opacity-100"
                  />
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <Badge className="mb-4 sm:mb-6">
                Available for new opportunities
              </Badge>
            </motion.div>

            <h1 className="mb-4 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              <motion.span
                className="block text-foreground"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                Hi, I&apos;m <span className="text-gradient">Adriel</span>
              </motion.span>
            </h1>

            {/* Typography Fix: Clearer wrapping and hierarchy */}
            <div className="mb-6 flex flex-col gap-1 text-[1.2rem] font-semibold leading-tight sm:text-2xl lg:text-3xl">
              <TextReveal
                text="Information System Student"
                delay={0.4}
                className="text-foreground-muted justify-center lg:justify-start"
              />
              <TextReveal
                text="& Fullstack Developer"
                delay={0.5}
                className="text-foreground-muted justify-center lg:justify-start"
              />
            </div>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="mb-8 max-w-[320px] text-sm leading-relaxed text-foreground-subtle sm:max-w-xl sm:text-lg lg:max-w-xl lg:text-xl"
            >
              Passionate about AI Integration, Web Developer, Mobile App Developer, and building modern digital solutions with clean architecture and immersive user experiences.
            </motion.p>

            {/* Social Links integrated higher into the flow */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="mb-8 flex items-center gap-6 text-foreground-muted sm:mb-10 lg:gap-5"
            >
              <div className="hidden h-px w-12 bg-border lg:block" />
              <a href="https://github.com/AdrielWalintukan" target="_blank" rel="noreferrer" className="p-2 transition-all duration-300 hover:-translate-y-1 hover:text-accent hover:shadow-glow sm:p-0 sm:hover:shadow-none" aria-label="GitHub">
                <FiGithub className="h-6 w-6 sm:h-5 sm:w-5" />
              </a>
              <a href="https://www.linkedin.com/in/adriel-walintukan-56ba48259/" target="_blank" rel="noreferrer" className="p-2 transition-all duration-300 hover:-translate-y-1 hover:text-accent hover:shadow-glow sm:p-0 sm:hover:shadow-none" aria-label="LinkedIn">
                <FiLinkedin className="h-6 w-6 sm:h-5 sm:w-5" />
              </a>
              <a href="https://www.instagram.com/adrielw_/" target="_blank" rel="noreferrer" className="p-2 transition-all duration-300 hover:-translate-y-1 hover:text-accent hover:shadow-glow sm:p-0 sm:hover:shadow-none" aria-label="Instagram">
                <FiInstagram className="h-6 w-6 sm:h-5 sm:w-5" />
              </a>
            </motion.div>

            {/* CTA Section - Touch friendly layout */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row lg:justify-start"
            >
              <Button href="#contact" variant="primary" className="w-full sm:w-auto" icon={<ArrowRight className="h-4 w-4" />}>
                Contact Me
              </Button>
              <Button href="/resume.pdf" variant="secondary" className="w-full sm:w-auto">
                View Resume
              </Button>
            </motion.div>
          </StaggerContainer>

          {/* RIGHT COLUMN: 3D Visual */}
          {/* We keep the wrapper here to ensure layout space is maintained, but HeroScene itself hides on mobile */}
          <div className="relative hidden h-[400px] w-full items-center justify-center lg:flex lg:h-[600px] xl:h-[700px] gpu-accelerated">
            <Reveal direction="left" delay={0.3} className="h-full w-full">
              <HeroScene />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
})
