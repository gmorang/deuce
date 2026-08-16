import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'outline'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg ring-1 ring-inset ring-white/15 shadow-[0_2px_16px_-4px_var(--ring)] hover:brightness-110',
  outline: 'border border-border-strong text-fg hover:bg-surface-2',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
