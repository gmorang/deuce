import { useId } from 'react'

/**
 * Elo evolution line: a compact inline-SVG sparkline of a player's rating over
 * time. No chart library — the DS wants one accent and a light footprint. The
 * viewBox is fixed and the SVG scales to its container's width.
 */
export function RatingChart({ values }: { values: number[] }) {
  const gradientId = useId()
  if (values.length < 2) return null

  const w = 640
  const h = 180
  const padX = 6
  const padY = 16
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const x = (i: number) => padX + (i / (values.length - 1)) * (w - 2 * padX)
  const y = (v: number) => padY + (1 - (v - min) / range) * (h - 2 * padY)

  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${padX},${h - padY} ${line} ${w - padX},${h - padY}`
  const last = values.length - 1
  const rising = values[last] >= values[0]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 'auto' }} role="img" aria-label="Evolução do rating">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={x(last)} cy={y(values[last])} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <title>{rising ? 'Em alta' : 'Em queda'}</title>
    </svg>
  )
}
