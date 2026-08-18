import type { CSSProperties, ReactNode } from 'react'

type Tone = 'accent' | 'neutral' | 'amber' | 'danger'
type Shape = 'pill' | 'tag'

const TONES: Record<Tone, CSSProperties> = {
  accent: { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' },
  neutral: { background: 'var(--surface-2)', color: 'var(--fg-subtle)' },
  amber: { background: 'color-mix(in srgb, #f59e0b 15%, transparent)', color: '#b45309' },
  danger: { background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' },
}

/** Small status pill — "você", "provisório", "admin", round-status chips. */
export function Badge({
  tone = 'neutral',
  shape = 'pill',
  uppercase = false,
  className = '',
  children,
}: {
  tone?: Tone
  shape?: Shape
  uppercase?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 py-0.5 text-[10px] font-semibold leading-[1.4] ${shape === 'tag' ? 'rounded-lg' : 'rounded-full'} ${
        uppercase ? 'px-2 uppercase tracking-[0.02em]' : 'px-1.5'
      } ${className}`}
      style={TONES[tone]}
    >
      {children}
    </span>
  )
}
