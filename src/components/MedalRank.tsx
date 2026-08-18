const MEDAL: Record<number, { bg: string; color: string; ring: string }> = {
  1: { bg: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold-fg)', ring: 'color-mix(in srgb, var(--gold) 30%, transparent)' },
  2: { bg: 'color-mix(in srgb, var(--silver) 15%, transparent)', color: 'var(--silver)', ring: 'color-mix(in srgb, var(--silver) 30%, transparent)' },
  3: { bg: 'color-mix(in srgb, var(--bronze) 15%, transparent)', color: 'var(--bronze)', ring: 'color-mix(in srgb, var(--bronze) 30%, transparent)' },
}

/** Rank indicator at the left of a leaderboard row: medal disc for 1–3, plain number for 4+. */
export function MedalRank({ rank, size = 24 }: { rank: number; size?: number }) {
  const medal = MEDAL[rank]
  if (!medal) {
    return (
      <span className="tabular text-center text-sm text-fg-subtle" style={{ width: size }}>
        {rank}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-xs font-bold"
      style={{ width: size, height: size, background: medal.bg, color: medal.color, boxShadow: `inset 0 0 0 1px ${medal.ring}` }}
    >
      {rank}
    </span>
  )
}
