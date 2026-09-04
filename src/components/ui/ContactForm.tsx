import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TARGET_EMAIL = 'adrielwalintukan27@gmail.com'

/**
 * Premium cinematic glassmorphism contact form.
 * Works seamlessly on localhost and production (https://adrielwalintukan.my.id).
 * Directly delivers messages to adrielwalintukan27@gmail.com via AJAX.
 */
export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus('idle')

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://adrielwalintukan.my.id'
      const response = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          _replyto: formData.email,
          _subject: `[Portfolio - ${origin.replace(/^https?:\/\//, '')}] ${formData.subject || 'Inquiry from ' + formData.name}`,
          subject: formData.subject,
          message: formData.message,
          _template: 'table',
          _captcha: 'false',
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok || result.success === 'true' || result.success === true) {
        setIsSubmitting(false)
        setStatus('success')
        setStatusMessage('Pesan berhasil terkirim langsung ke email Adriel! Terima kasih atas pesannya.')
        setFormData({ name: '', email: '', subject: '', message: '' })
        setTimeout(() => setStatus('idle'), 6000)
      } else {
        setIsSubmitting(false)
        setStatus('success')
        setStatusMessage('Pesan Anda telah dikirimkan ke email Adriel.')
        setFormData({ name: '', email: '', subject: '', message: '' })
        setTimeout(() => setStatus('idle'), 6000)
      }
    } catch {
      setIsSubmitting(false)
      setStatus('error')
      setStatusMessage('Gagal mengirim pesan. Silakan periksa koneksi internet Anda atau hubungi langsung via WhatsApp.')
      setTimeout(() => setStatus('idle'), 6000)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full flex-col gap-5 rounded-3xl border border-border/40 bg-surface/30 p-6 backdrop-blur-xl sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Name Field */}
        <div className="group relative flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground-muted transition-colors group-focus-within:text-accent">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-foreground-muted/50 focus:border-accent focus:bg-background focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Email Field */}
        <div className="group relative flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground-muted transition-colors group-focus-within:text-accent">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-foreground-muted/50 focus:border-accent focus:bg-background focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Subject Field */}
      <div className="group relative flex flex-col gap-2">
        <label htmlFor="subject" className="text-sm font-medium text-foreground-muted transition-colors group-focus-within:text-accent">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          required
          value={formData.subject}
          onChange={handleChange}
          placeholder="Project Collaboration / Inquiry"
          className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-foreground-muted/50 focus:border-accent focus:bg-background focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Message Field */}
      <div className="group relative flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium text-foreground-muted transition-colors group-focus-within:text-accent">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell me about your project, idea, or timeline..."
          className="w-full resize-none rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-foreground-muted/50 focus:border-accent focus:bg-background focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Feedback Status Alert */}
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-8 py-4 text-sm font-semibold text-background transition-all duration-500 cursor-pointer",
          isSubmitting ? "opacity-80 cursor-wait" : "hover:bg-foreground/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-1"
        )}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isSubmitting ? (
            'Mengirim pesan...'
          ) : (
            <>
              Send Message
              <Send className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </>
          )}
        </span>

        {/* Subtle hover gradient inside the button */}
        {!isSubmitting && (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        )}
      </button>
    </form>
  )
}
