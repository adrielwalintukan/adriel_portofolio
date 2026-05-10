import { useState } from 'react'

import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Premium cinematic glassmorphism contact form.
 */
export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission delay
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      
      // Reset after success message
      setTimeout(() => setIsSubmitted(false), 3000)
    }, 1500)
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
            placeholder="John Doe"
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
            placeholder="john@example.com"
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
          placeholder="Project Inquiry"
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
          placeholder="Tell me about your project..."
          className="w-full resize-none rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-foreground-muted/50 focus:border-accent focus:bg-background focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isSubmitted}
        className={cn(
          "group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-8 py-4 text-sm font-semibold text-background transition-all duration-500",
          (isSubmitting || isSubmitted) ? "opacity-80" : "hover:bg-foreground/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-1"
        )}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isSubmitting ? (
            'Sending...'
          ) : isSubmitted ? (
            'Message Sent!'
          ) : (
            <>
              Send Message
              <Send className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </>
          )}
        </span>
        
        {/* Subtle hover gradient inside the button */}
        {!isSubmitting && !isSubmitted && (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        )}
      </button>
    </form>
  )
}
