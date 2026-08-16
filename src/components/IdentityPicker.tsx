import { RANKING_COLOR_KEYS, RANKING_ICONS, rankingColor } from '../features/rankings/identity'
import { RankingBadge } from './RankingBadge'

interface Props {
  icon: string
  color: string
  onIcon: (icon: string) => void
  onColor: (color: string) => void
}

/** Reusable icon + color picker for a ranking's visual identity. */
export function IdentityPicker({ icon, color, onIcon, onColor }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <RankingBadge icon={icon} color={color} size={44} />
        <span className="text-sm text-fg-muted">Como o ranking aparece na lista</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg-muted">Ícone</span>
        <div className="flex flex-wrap gap-2">
          {RANKING_ICONS.map(i => (
            <button
              type="button"
              key={i}
              onClick={() => onIcon(i)}
              className={`flex size-10 items-center justify-center rounded-lg border text-lg transition-colors ${
                icon === i ? 'border-accent bg-accent/10' : 'border-border hover:bg-surface-2'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg-muted">Cor</span>
        <div className="flex flex-wrap gap-2">
          {RANKING_COLOR_KEYS.map(key => {
            const [bg] = rankingColor(key)
            return (
              <button
                type="button"
                key={key}
                aria-label={key}
                onClick={() => onColor(key)}
                className={`size-8 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg)] transition-all ${
                  color === key ? 'ring-accent' : 'ring-transparent'
                }`}
                style={{ background: bg }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
