import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiLinkedin, FiInstagram, FiMail, FiMapPin } from 'react-icons/fi'
import { Section, SectionHeading } from '@/components/shared'
import { StaggerContainer } from '@/components/animations'
import { ContactForm, Badge } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'
import { CONTACT_INFO, SOCIAL_LINKS } from '@/lib/constants'

import type { IconType } from 'react-icons'

// Map string icon names from constants to actual React Icons
const IconMap: Record<string, IconType> = {
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiMail,
}

/**
 * Premium cinematic Contact Section.
 * Features an asymmetric split layout with a contact form.
 */
export const ContactSection = memo(function ContactSection() {
  return (
    <Section id="contact" className="relative overflow-hidden">
      <AmbientGlow variant="accent" className="left-[-10%] top-[20%] opacity-20" />
      <AmbientGlow variant="primary" className="right-[-10%] top-[60%] opacity-20" />

      <SectionHeading
        label="Contact"
        title="Let's Build Something Exceptional"
        description="Feel free to reach out for collaboration, freelance projects, creative ideas, or opportunities to build impactful digital experiences together."
      />

      <div className="section-container relative z-10 mt-16 w-full">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-8">
          
          {/* LEFT COLUMN: Contact Info & Socials */}
          <StaggerContainer
            delay={0.2}
            staggerDelay={0.1}
            className="flex flex-col lg:col-span-2"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <Badge className="mb-8 w-fit bg-accent/10 text-accent border-accent/20">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                {CONTACT_INFO.availability}
              </Badge>
            </motion.div>

            <motion.h3 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="mb-4 text-2xl font-display font-bold text-foreground sm:text-3xl"
            >
              Get in Touch
            </motion.h3>

            <motion.p 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="mb-8 max-w-md text-foreground-muted"
            >
              Whether you have a question, a project proposal, or just want to say hi, I&apos;ll try my best to get back to you!
            </motion.p>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="mb-12 flex flex-col gap-6"
            >
              <div className="flex items-center gap-4 text-foreground-subtle transition-colors hover:text-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-surface/30 backdrop-blur-sm">
                  <FiMail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">Email</p>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="text-base font-medium">{CONTACT_INFO.email}</a>
                </div>
              </div>

              <div className="flex items-center gap-4 text-foreground-subtle transition-colors hover:text-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-surface/30 backdrop-blur-sm">
                  <FiMapPin className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">Location</p>
                  <p className="text-base font-medium">{CONTACT_INFO.location}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="mt-auto"
            >
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-foreground-muted">Socials</p>
              <div className="flex flex-wrap gap-4">
                {SOCIAL_LINKS.map((link) => {
                  const Icon = IconMap[link.icon]
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-surface/30 text-foreground-subtle backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface/60 hover:text-accent hover:shadow-glow"
                      aria-label={link.name}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </a>
                  )
                })}
              </div>
            </motion.div>
          </StaggerContainer>

          {/* RIGHT COLUMN: Contact Form */}
          <div className="lg:col-span-3 lg:pl-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ContactForm />
            </motion.div>
          </div>

        </div>
      </div>
    </Section>
  )
})
