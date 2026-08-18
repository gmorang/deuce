/** Visual identity options for a ranking: an emoji icon on a colored disc. */

export const RANKING_COLORS: Record<string, [bg: string, fg: string]> = {
  green: ['var(--rank-green-bg)', 'var(--rank-green-fg)'],
  blue: ['var(--rank-blue-bg)', 'var(--rank-blue-fg)'],
  amber: ['var(--rank-amber-bg)', 'var(--rank-amber-fg)'],
  rose: ['var(--rank-rose-bg)', 'var(--rank-rose-fg)'],
  violet: ['var(--rank-violet-bg)', 'var(--rank-violet-fg)'],
  cyan: ['var(--rank-cyan-bg)', 'var(--rank-cyan-fg)'],
}

export const RANKING_COLOR_KEYS = Object.keys(RANKING_COLORS)

export const RANKING_ICONS = ['🏆', '🎾', '🥇', '🔥', '⚡', '🎯', '👑', '💪', '🏓', '⭐']

export const DEFAULT_RANKING_ICON = '🏆'
export const DEFAULT_RANKING_COLOR = 'green'

export function rankingColor(key: string): [string, string] {
  return RANKING_COLORS[key] ?? RANKING_COLORS.green
}
