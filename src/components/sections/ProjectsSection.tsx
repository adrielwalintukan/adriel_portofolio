import { memo, useState } from 'react'
import { PROJECTS, type Project } from '@/lib/constants'
import { Section, SectionHeading } from '@/components/shared'
import { InfiniteMarquee } from '@/components/animations'
import { FeaturedProjectCard, ProjectCard, ProjectGalleryModal } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'

/**
 * Premium Project Showcase Section.
 * Implements a responsive Bento Grid to display featured and secondary projects.
 * Features a smooth expandable "View All" system and immersive local gallery overlay.
 */
export const ProjectsSection = memo(function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <Section id="projects" className="relative" fullWidth={true}>
      <AmbientGlow variant="secondary" className="top-1/4 opacity-50" />

      <div className="section-container">
        <SectionHeading
          label="Featured Work"
          title="Selected Projects & Digital Experiences"
          description="A collection of modern, interactive, and high-performance projects focused on design, scalability, and user experience."
        />
      </div>

      {/* INFINITE MARQUEE SHOWCASE */}
      <div className="mt-8 sm:mt-12 w-full overflow-hidden">
        <InfiniteMarquee direction="left" speed={25} pauseOnHover={true}>
          {PROJECTS.map((project, idx) => {
            const isFeatured = project.featured;
            return (
              <div
                key={`${project.id}-${idx}`}
                className="shrink-0 transition-transform duration-500 w-[85vw] sm:w-[45vw] md:w-[35vw] lg:w-[28vw]"
              >
                {isFeatured ? (
                  <FeaturedProjectCard project={project} onSelectProject={setSelectedProject} />
                ) : (
                  <ProjectCard project={project} onSelectProject={setSelectedProject} />
                )}
              </div>
            )
          })}
        </InfiniteMarquee>
      </div>

      {/* GLOBAL CINEMATIC GALLERY MODAL OVERLAY */}
      <ProjectGalleryModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </Section>
  )
})
