/** Visual identity options for a ranking: an emoji icon on a colored disc. */

export const RANKING_COLORS: Record<string, [bg: string, fg: string]> = {
  green: ['#dcfce7', '#166534'],
  blue: ['#dbeafe', '#1e40af'],
  amber: ['#fef3c7', '#92400e'],
  rose: ['#ffe4e6', '#9f1239'],
  violet: ['#ede9fe', '#5b21b6'],
  cyan: ['#cffafe', '#155e75'],
}

export const RANKING_COLOR_KEYS = Object.keys(RANKING_COLORS)

export const RANKING_ICONS = ['🏆', '🎾', '🥇', '🔥', '⚡', '🎯', '👑', '💪', '🏓', '⭐']

export const DEFAULT_RANKING_ICON = '🏆'
export const DEFAULT_RANKING_COLOR = 'green'

export function rankingColor(key: string): [string, string] {
  return RANKING_COLORS[key] ?? RANKING_COLORS.green
}
