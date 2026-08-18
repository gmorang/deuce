import { type MatchFormatDef, type SetScore, computeWinner, isTiebreakSet } from '../features/matches/score'
import { Avatar } from './Avatar'

const played = (s: SetScore) => s.a !== 0 || s.b !== 0
const setWinner = (s: SetScore): 'a' | 'b' | null => (!played(s) ? null : s.a > s.b ? 'a' : s.b > s.a ? 'b' : null)
const clamp = (value: string, max: number) => Math.max(0, Math.min(max, Number.parseInt(value, 10) || 0))

const gameCell =
  'h-11 w-full rounded-lg border bg-surface text-center text-lg font-semibold tabular outline-none transition-colors [appearance:textfield] focus:border-accent focus:ring-2 focus:ring-[var(--ring)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

const cellTone = (isWinner: boolean, isPlayed: boolean) =>
  isWinner ? 'border-accent bg-accent/[0.06] text-accent' : isPlayed ? 'border-border-strong text-fg' : 'border-border text-fg'

/**
 * Tennis-style scoreboard: players as rows, sets as columns. Game scores are
 * typed per set, the set/match winner is derived, and 7-6 sets get an optional
 * tie-break points field. Controlled — parent owns the `sets` state.
 */
export function Scoreboard({
  nameA,
  nameB,
  sets,
  def,
  onChange,
}: {
  nameA: string
  nameB: string
  sets: SetScore[]
  def: MatchFormatDef
  onChange: (sets: SetScore[]) => void
}) {
  const setGame = (i: number, side: 'a' | 'b', value: string) => onChange(sets.map((s, idx) => (idx === i ? { ...s, [side]: clamp(value, 99) } : s)))
  const setTb = (i: number, value: string) => onChange(sets.map((s, idx) => (idx === i ? { ...s, tb: clamp(value, 99) } : s)))

  const winner = computeWinner(sets, def)
  const wonA = sets.filter(s => setWinner(s) === 'a').length
  const wonB = sets.filter(s => setWinner(s) === 'b').length
  const showTiebreakRow = !def.tiebreak && sets.some(isTiebreakSet)

  const columnLabel = (i: number) => (def.tiebreak ? 'TB' : def.maxSets === 1 ? 'Set' : `S${i + 1}`)
  const gridCols = `minmax(0,1fr) repeat(${def.maxSets}, minmax(2.5rem, 3rem))`

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      <div className="grid items-center gap-x-2 gap-y-2.5" style={{ gridTemplateColumns: gridCols }}>
        {/* Column headers */}
        <div />
        {sets.map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional set columns
          <div key={`h${i}`} className="text-center text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
            {columnLabel(i)}
          </div>
        ))}

        {/* Player A */}
        <PlayerCell name={nameA} isWinner={winner === 'a'} setsWon={wonA} />
        {sets.map((s, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional set columns
            key={`a${i}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={s.a || ''}
            onChange={e => setGame(i, 'a', e.target.value)}
            className={`${gameCell} ${cellTone(setWinner(s) === 'a', played(s))}`}
            placeholder="0"
            aria-label={`${nameA} — ${columnLabel(i)}`}
          />
        ))}

        {/* Player B */}
        <PlayerCell name={nameB} isWinner={winner === 'b'} setsWon={wonB} />
        {sets.map((s, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional set columns
            key={`b${i}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={s.b || ''}
            onChange={e => setGame(i, 'b', e.target.value)}
            className={`${gameCell} ${cellTone(setWinner(s) === 'b', played(s))}`}
            placeholder="0"
            aria-label={`${nameB} — ${columnLabel(i)}`}
          />
        ))}

        {/* Tie-break points (only for 7-6 sets) */}
        {showTiebreakRow && (
          <>
            <div className="text-xs text-fg-subtle">Tie-break</div>
            {sets.map((s, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional set columns
              <div key={`tb${i}`} className="flex justify-center">
                {isTiebreakSet(s) ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={99}
                    value={s.tb ?? ''}
                    onChange={e => setTb(i, e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-surface-2 text-center text-xs tabular outline-none transition-colors [appearance:textfield] focus:border-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="–"
                    aria-label={`Tie-break ${columnLabel(i)}`}
                  />
                ) : null}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Result */}
      <div className="mt-3 border-t border-border pt-3 text-center text-sm">
        {winner ? (
          <span>
            Vencedor: <span className="font-semibold text-accent">{winner === 'a' ? nameA : nameB}</span>
            <span className="tabular text-fg-muted">
              {' · '}
              {Math.max(wonA, wonB)}–{Math.min(wonA, wonB)}
            </span>
          </span>
        ) : (
          <span className="text-fg-subtle">Preencha o placar até definir um vencedor.</span>
        )}
      </div>
    </div>
  )
}

function PlayerCell({ name, isWinner, setsWon }: { name: string; isWinner: boolean; setsWon: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar name={name} size={28} />
      <span className={`min-w-0 flex-1 truncate text-sm font-medium ${isWinner ? 'text-accent' : ''}`}>{name}</span>
      <span className={`tabular w-4 shrink-0 text-right text-sm font-bold ${isWinner ? 'text-accent' : 'text-fg-subtle'}`}>{setsWon}</span>
    </div>
  )
}
