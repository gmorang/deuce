import { rankingColor } from '../features/rankings/identity'

/** The ranking's emoji icon on its colored disc. */
export function RankingBadge({ icon, color, size = 36 }: { icon: string; color: string; size?: number }) {
  const [bg, fg] = rankingColor(color)
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.5 }}
    >
      {icon}
    </span>
  )
}
