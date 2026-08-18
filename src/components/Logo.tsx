import { useId } from 'react'

/**
 * The Deuce "Rally" mark — the arc of a returned shot rising to a chartreuse
 * ball, in the brand emerald→chartreuse gradient. See /public/logo.svg.
 */
export function Logo({ size = 20 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Deuce" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#c8e64a" />
        </linearGradient>
      </defs>
      <path d="M14 74 C34 74 40 26 62 26" fill="none" stroke={`url(#${id})`} strokeWidth="10" strokeLinecap="round" />
      <path d="M38 74 C58 74 64 26 86 26" fill="none" stroke={`url(#${id})`} strokeWidth="10" strokeLinecap="round" opacity=".45" />
      <circle cx="62" cy="26" r="9" fill="#c8e64a" />
    </svg>
  )
}
