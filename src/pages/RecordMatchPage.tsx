import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../features/auth/AuthProvider'
import { DEFAULT_MATCH_FORMAT, type SetScore, computeWinner, formatScore, matchFormat } from '../features/matches/score'
import { useRecordMatch } from '../features/matches/useMatches'
import { useMembers } from '../features/rankings/useMembers'
import { useRanking } from '../features/rankings/useRankings'

const controlClass =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-[var(--ring)]'

const emptySets = (n: number): SetScore[] => Array.from({ length: n }, () => ({ a: 0, b: 0 }))
const todayISO = () => new Date().toISOString().slice(0, 10)

export function RecordMatchPage() {
  const { rankingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: members } = useMembers(rankingId)
  const { data: ranking } = useRanking(rankingId)
  const recordMatch = useRecordMatch(rankingId ?? '')

  const [aId, setAId] = useState('')
  const [bId, setBId] = useState('')
  const [sets, setSets] = useState<SetScore[]>(() => emptySets(matchFormat(DEFAULT_MATCH_FORMAT).maxSets))
  const [date, setDate] = useState(todayISO)
  const [courtName, setCourtName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Format is fixed per ranking, chosen at creation.
  const format = ranking?.settings?.defaultFormat ?? DEFAULT_MATCH_FORMAT
  const def = matchFormat(format)

  // Resize the set inputs when the format changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only on format change
  useEffect(() => {
    setSets(emptySets(def.maxSets))
  }, [format])

  const options = members ?? []
  const aName = options.find(m => m.id === aId)?.displayName
  const bName = options.find(m => m.id === bId)?.displayName
  const winner = aId && bId && aId !== bId ? computeWinner(sets, def) : null

  const setGame = (i: number, side: 'a' | 'b', value: string) => {
    const n = Math.max(0, Math.min(99, Number.parseInt(value, 10) || 0))
    setSets(prev => prev.map((s, idx) => (idx === i ? { ...s, [side]: n } : s)))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!aId || !bId) return setError('Escolha os dois jogadores.')
    if (aId === bId) return setError('Escolha dois jogadores diferentes.')
    if (!winner) return setError('Complete o placar até definir um vencedor.')
    try {
      await recordMatch.mutateAsync({
        winnerId: winner === 'a' ? aId : bId,
        loserId: winner === 'a' ? bId : aId,
        score: formatScore(sets, winner),
        format,
        courtName: courtName.trim() || undefined,
        notes: notes.trim() || undefined,
        playedAt: new Date(`${date}T12:00:00`).getTime(),
        recordedBy: user?.uid ?? 'unknown',
      })
      navigate(`/r/${rankingId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar a partida.')
    }
  }

  if (options.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-fg-muted">
        Este ranking precisa de pelo menos dois jogadores antes de registrar partidas.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Formato">
          <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm">{def.label}</div>
        </Field>
        <Field label="Data">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={controlClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Jogador A">
          <PlayerSelect value={aId} onChange={setAId} options={options} />
        </Field>
        <Field label="Jogador B">
          <PlayerSelect value={bId} onChange={setBId} options={options} />
        </Field>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="min-w-0 flex-1 truncate">{aName ?? 'Jogador A'}</span>
          <span className="px-2 text-fg-subtle">×</span>
          <span className="min-w-0 flex-1 truncate text-right">{bName ?? 'Jogador B'}</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {sets.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional set rows
            <div key={i} className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-xs font-medium uppercase tracking-wide text-fg-subtle">{def.tiebreak ? 'TB' : `S${i + 1}`}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={s.a || ''}
                onChange={e => setGame(i, 'a', e.target.value)}
                className={`${controlClass} text-center`}
                placeholder="0"
              />
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={s.b || ''}
                onChange={e => setGame(i, 'b', e.target.value)}
                className={`${controlClass} text-center`}
                placeholder="0"
              />
            </div>
          ))}
        </div>
        {winner && (
          <p className="mt-3 text-center text-sm">
            Vencedor: <span className="font-semibold text-accent">{winner === 'a' ? aName : bName}</span>
          </p>
        )}
      </div>

      <Field label="Quadra (opcional)">
        <input value={courtName} onChange={e => setCourtName(e.target.value)} placeholder="Ex: Quadra 1" className={controlClass} autoComplete="off" />
      </Field>
      <Field label="Observações (opcional)">
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre a partida" className={controlClass} autoComplete="off" />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={recordMatch.isPending || !winner} className="w-full py-3">
        {recordMatch.isPending ? 'Registrando…' : 'Registrar resultado'}
      </Button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in via `children` and wrapped by this label
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-muted">{label}</span>
      {children}
    </label>
  )
}

function PlayerSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; displayName: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={controlClass}>
      <option value="">Selecione…</option>
      {options.map(p => (
        <option key={p.id} value={p.id}>
          {p.displayName}
        </option>
      ))}
    </select>
  )
}
