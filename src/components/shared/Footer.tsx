import { memo } from 'react'
import { ArrowUp } from 'lucide-react'
import { FiGithub, FiLinkedin, FiInstagram, FiMail } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { CONTACT_INFO, SOCIAL_LINKS } from '@/lib/constants'

const IconMap: Record<string, IconType> = { FiGithub, FiLinkedin, FiInstagram, FiMail }

const FOOTER_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

/**
 * Footer — full accent block with portrait, contact, links and the name set edge to edge (PRD §6.11).
 */
export const Footer = memo(function Footer() {
  return (
    <footer className="overflow-hidden bg-accent text-ink [--focus-ring:var(--color-ink)]">
      <div className="section-container pt-16 sm:pt-20">
        <div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-start">
          <div className="aspect-square w-40 overflow-hidden rounded-xl bg-ink sm:w-52">
            <img
              src="/images/adriel.webp"
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-[50%_25%] grayscale contrast-125"
            />
          </div>
          <div className="sm:text-right">
            <p className="font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">Let&apos;s chat</p>
            <p className="mt-5 font-mono text-xs uppercase tracking-widest">/email</p>
            <a href={`mailto:${CONTACT_INFO.email}`} className="text-lg font-medium underline-offset-4 hover:underline">
              {CONTACT_INFO.email}
            </a>
            <p className="mt-3 font-mono text-xs uppercase tracking-widest">/based in</p>
            <p className="text-lg font-medium">{CONTACT_INFO.city}</p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6">
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-display text-2xl font-extrabold uppercase tracking-wide underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            ))}
            <span className="flex gap-2">
              {SOCIAL_LINKS.map((link) => {
                const Icon = IconMap[link.icon]
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noreferrer"
                    aria-label={link.name}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-paper transition-colors hover:bg-paper hover:text-ink"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                  </a>
                )
              })}
            </span>
          </nav>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-wide"
          >
            Back to top
            <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
          </button>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="mt-8 whitespace-nowrap text-center font-display text-[12vw] font-black uppercase leading-[0.8] tracking-tight"
      >
        Adriel Walintukan
      </p>

      <div className="section-container flex justify-between gap-4 py-5 font-mono text-xs uppercase">
        <span>&copy; {new Date().getFullYear()} Adriel Walintukan</span>
        <span>Built with React &amp; Framer Motion</span>
      </div>
    </footer>
  )
})
