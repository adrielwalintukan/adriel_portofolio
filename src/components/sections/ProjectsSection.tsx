import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import { PROJECTS, type Project } from '@/lib/constants'
import { Section, SectionHeading } from '@/components/shared'
import { StaggerContainer } from '@/components/animations'
import { FeaturedProjectCard, ProjectCard, ProjectGalleryModal } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'

/**
 * Premium Project Showcase Section.
 * Implements a responsive Bento Grid to display featured and secondary projects.
 * Features a smooth expandable "View All" system and immersive local gallery overlay.
 */
export const ProjectsSection = memo(function ProjectsSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  const featuredProject = PROJECTS.find((p) => p.featured)
  const secondaryProjects = PROJECTS.filter((p) => !p.featured)
  
  // Initial 2 non-featured projects (1 featured + 2 non-featured = 3 total)
  const initialProjects = secondaryProjects.slice(0, 2)
  // The rest are hidden until expanded
  const remainingProjects = secondaryProjects.slice(2)

  return (
    <Section id="projects" className="relative">
      <AmbientGlow variant="secondary" className="top-1/4 opacity-50" />

      <SectionHeading
        label="Featured Work"
        title="Selected Projects & Digital Experiences"
        description="A collection of modern, interactive, and high-performance projects focused on design, scalability, and user experience."
      />

      {/* INITIAL VISIBLE GRID */}
      <StaggerContainer
        delay={0.1}
        staggerDelay={0.15}
        className="mx-auto flex flex-col gap-6 sm:gap-8 lg:grid lg:grid-cols-2"
      >
        {featuredProject && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            className="lg:col-span-2"
            style={{ willChange: 'opacity, transform' }}
          >
            <FeaturedProjectCard project={featuredProject} onSelectProject={setSelectedProject} />
          </motion.div>
        )}

        {initialProjects.map((project) => (
          <motion.div
            key={project.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            style={{ willChange: 'opacity, transform' }}
          >
            <ProjectCard project={project} onSelectProject={setSelectedProject} />
          </motion.div>
        ))}
      </StaggerContainer>

      {/* EXPANDABLE GRID */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-auto mt-6 flex flex-col gap-6 sm:mt-8 sm:gap-8 lg:grid lg:grid-cols-2">
              {remainingProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProjectCard project={project} onSelectProject={setSelectedProject} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXPAND TOGGLE BUTTON */}
      {remainingProjects.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 rounded-full border border-border/50 bg-surface/50 px-6 py-3 text-sm font-medium tracking-wide text-foreground-muted backdrop-blur-md transition-all duration-300 hover:border-accent/50 hover:text-foreground hover:shadow-glow sm:px-8 sm:py-4 sm:text-base"
          >
            {isExpanded ? 'Show Less' : 'View All Projects'}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <FiChevronDown className="h-5 w-5 text-accent" />
            </motion.div>
          </button>
        </motion.div>
      )}

      {/* GLOBAL CINEMATIC GALLERY MODAL OVERLAY */}
      <ProjectGalleryModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </Section>
  )
})
