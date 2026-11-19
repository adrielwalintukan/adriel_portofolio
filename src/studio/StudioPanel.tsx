import { memo, useEffect, useRef } from 'react'
import { ArrowUpRight, X, Mail, MapPin } from 'lucide-react'
import { FiGithub, FiLinkedin, FiInstagram } from 'react-icons/fi'
import {
  CERTIFICATES_DATA,
  CONTACT_INFO,
  CORE_STRENGTHS,
  EXPERIENCE_TIMELINE,
  SKILLS_DATA,
  SOCIAL_LINKS,
  type Certificate,
} from '@/lib/constants'
import { getSkillIcon } from '@/lib/skillIcons'
import { STATION_BY_ID, type StationId } from './data'

const SOCIAL_ICONS = { FiGithub, FiLinkedin, FiInstagram } as const

interface StudioPanelProps {
  station: StationId
  onClose: () => void
  onOpenCertificate: (certificate: Certificate) => void
}

function SkillsPanel() {
  return (
    <div className="space-y-5">
      {SKILLS_DATA.map((group) => (
        <section key={group.category}>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#5f7186]">{group.category}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {group.skills.map((skill) => (
              <li
                key={skill.name}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-[#dbe5ea]"
              >
                <span className="text-sm" aria-hidden="true">
                  {getSkillIcon(skill.icon, skill.name)}
                </span>
                {skill.name}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ExperiencePanel() {
  return (
    <ol className="space-y-4">
      {EXPERIENCE_TIMELINE.map((item) => (
        <li key={item.id} className="border-l border-white/10 pl-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#3fb0b7]">{item.year}</p>
          <p className="mt-0.5 font-display text-base font-extrabold uppercase leading-tight tracking-wide text-[#eef2f3]">
            {item.title}
          </p>
          <p className="text-xs text-[#8fa0ad]">{item.role}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#a7b0bd]">{item.description}</p>
        </li>
      ))}
    </ol>
  )
}

function CertificatesPanel({ onOpenCertificate }: Pick<StudioPanelProps, 'onOpenCertificate'>) {
  return (
    <ul className="space-y-2">
      {CERTIFICATES_DATA.map((certificate) => (
        <li key={certificate.id}>
          <button
            onClick={() => onOpenCertificate(certificate)}
            className="group flex w-full items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.06]"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-sm font-extrabold uppercase tracking-wide text-[#eef2f3]">
                {certificate.title}
              </span>
              <span className="mt-0.5 block text-xs text-[#8fa0ad]">
                {certificate.issuer} · {certificate.year}
              </span>
            </span>
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5f7186] group-hover:text-[#3fb0b7]" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function AboutPanel() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-[#a7b0bd]">
      <p>
        I&apos;m Adriel, an Information Systems student in Manado building AI-powered web and mobile products —
        from the database schema to the last hover state.
      </p>
      <ul className="space-y-1">
        {CORE_STRENGTHS.map((strength) => (
          <li key={strength} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3fb0b7]" aria-hidden="true" />
            {strength}
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-white/10 pt-3 font-mono text-[11px] text-[#8fa0ad]">
        <p className="flex items-center gap-2">
          <MapPin className="h-3 w-3" aria-hidden="true" /> {CONTACT_INFO.city}
        </p>
        <p className="flex items-center gap-2">
          <Mail className="h-3 w-3" aria-hidden="true" /> {CONTACT_INFO.email}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {SOCIAL_LINKS.filter((s) => s.icon in SOCIAL_ICONS).map((social) => {
          const Icon = SOCIAL_ICONS[social.icon as keyof typeof SOCIAL_ICONS]
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-[#dbe5ea] transition-colors hover:border-[#3fb0b7]/50 hover:text-[#3fb0b7]"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {social.name}
            </a>
          )
        })}
      </div>
      <a
        href="/#contact"
        className="inline-flex items-center gap-2 rounded-lg bg-[#3fb0b7] px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wide text-[#0b1226] transition-colors hover:bg-[#5cc2c8]"
      >
        Let&apos;s talk <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}

/** The right-hand HTML panel: real text, real links, real scroll — the 3D only sets the scene. */
export const StudioPanel = memo(function StudioPanel({
  station,
  onClose,
  onOpenCertificate,
}: StudioPanelProps) {
  const panel = useRef<HTMLDivElement>(null)
  const meta = STATION_BY_ID[station]

  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
  }, [station])

  return (
    <div
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-label={`${meta.label} — ${meta.where}`}
      style={{ outline: 'none' }}
      className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 glass-dark outline-none"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#3fb0b7]">the {meta.where}</p>
          <h2 className="mt-0.5 font-display text-2xl font-black uppercase tracking-tight text-[#eef2f3]">
            {station === 'certificates' ? 'Certificates' : meta.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Back to the room"
          className="mt-0.5 rounded-md border border-white/10 p-1.5 text-[#8fa0ad] transition-colors hover:border-white/25 hover:text-[#eef2f3]"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {station === 'skills' && <SkillsPanel />}
        {station === 'experience' && <ExperiencePanel />}
        {station === 'certificates' && <CertificatesPanel onOpenCertificate={onOpenCertificate} />}
        {station === 'about' && <AboutPanel />}
      </div>
    </div>
  )
})
