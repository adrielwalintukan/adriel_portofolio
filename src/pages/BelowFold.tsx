import {
  AboutSection,
  ProjectsSection,
  ExperienceSection,
  SkillsSection,
  GitHubActivitySection,
  NumbersSection,
  CertificatesSection,
  ContactSection,
} from '@/components/sections'

/** All sections after the hero, in page order. Lazy-loaded by HomePage. */
export default function BelowFold() {
  return (
    <>
      <AboutSection />
      <ProjectsSection />
      <ExperienceSection />
      <SkillsSection />
      <GitHubActivitySection />
      <NumbersSection />
      <CertificatesSection />
      <ContactSection />
    </>
  )
}
