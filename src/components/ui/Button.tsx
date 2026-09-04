import { type ReactNode, memo, forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Magnetic } from '@/components/animations'
import { useDeviceDetect } from '@/hooks'

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  className?: string
  href?: string
  target?: string
  rel?: string
  download?: string
}

/**
 * Premium CTA button with glassmorphism and magnetic hover effects.
 * Uses `forwardRef` to allow Framer Motion animations when used in a staggered list.
 */
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { children, variant = 'primary', size = 'md', icon, className, href, target, rel, download, ...props },
    ref
  ) {
    const { isTouchDevice } = useDeviceDetect()

    const baseStyles =
      'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-all duration-300 will-change-transform'

    const variants = {
      primary:
        'bg-accent text-white shadow-glow hover:bg-accent-hover hover:shadow-glow-lg',
      secondary:
        'glass-strong glow-border text-foreground hover:bg-surface-hover hover:shadow-glow',
      outline:
        'border border-border bg-transparent text-foreground hover:border-accent/50 hover:bg-accent/10',
      ghost:
        'bg-transparent text-foreground-muted hover:text-foreground hover:bg-white/5',
    }

    const sizes = {
      sm: 'h-9 px-4 text-xs sm:text-sm',
      md: 'h-11 px-6 text-sm sm:text-base',
      lg: 'h-12 px-8 text-base sm:text-lg',
    }

    const content = (
      <>
        {/* Glow effect behind primary buttons */}
        {variant === 'primary' && (
          <span className="absolute inset-0 z-0 bg-gradient-to-r from-accent to-neon-purple opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-50" />
        )}
        
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {icon && (
            <span className="transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-0">
              {icon}
            </span>
          )}
        </span>
      </>
    )

    const Component = (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {content}
      </motion.button>
    )

    if (href) {
      return (
        <Magnetic disabled={isTouchDevice} strength={0.15}>
          <a
            href={href}
            download={download}
            target={target}
            rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
            className="inline-block"
          >
            {Component}
          </a>
        </Magnetic>
      )
    }

    return (
      <Magnetic disabled={isTouchDevice} strength={0.15}>
        {Component}
      </Magnetic>
    )
  })
)
