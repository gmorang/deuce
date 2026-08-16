import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { useMembers } from '../features/rankings/useMembers'
import type { Fixture, Round } from '../features/rounds/types'
import {
  useCloseRound,
  useCreateRound,
  useDrawRound,
  useFixtures,
  useParticipants,
  useRecordFixture,
  useRounds,
  useToggleParticipation,
} from '../features/rounds/useRounds'

export function RoundPage() {
  const { rankingId } = useParams()
  const { data: rounds, isLoading } = useRounds(rankingId)
  const current = rounds?.[0]

  if (isLoading) return <div className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-sm text-fg-muted">Carregando…</div>
  if (!current) return <NoRound rankingId={rankingId} />

  return <RoundView key={current.id} rankingId={rankingId ?? ''} round={current} />
}

function NoRound({ rankingId }: { rankingId?: string }) {
  const { user } = useAuth()
  const { data: isAdmin } = useIsAdmin()
  const createRound = useCreateRound(rankingId ?? '')

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm text-fg-muted">Nenhuma rodada aberta.</p>
      {isAdmin && (
        <Button disabled={createRound.isPending} onClick={() => user && createRound.mutate({ createdBy: user.uid })}>
          {createRound.isPending ? 'Abrindo…' : 'Abrir rodada'}
        </Button>
      )}
    </div>
  )
}

function RoundView({ rankingId, round }: { rankingId: string; round: Round }) {
  const { user } = useAuth()
  const { data: isAdmin } = useIsAdmin()
  const { data: members } = useMembers(rankingId)
  const { data: participants } = useParticipants(rankingId, round.id)
  const { data: fixtures } = useFixtures(rankingId, round.id)

  const createRound = useCreateRound(rankingId)
  const myMember = members?.find(m => m.id === user?.uid)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rodada {round.number}</h2>
        <StatusPill status={round.status} />
      </div>

      {round.status === 'confirming' && (
        <ConfirmingPanel rankingId={rankingId} roundId={round.id} isAdmin={!!isAdmin} member={myMember} participants={participants ?? []} />
      )}

      {(round.status === 'drawn' || round.status === 'closed') && (
        <DrawnPanel rankingId={rankingId} round={round} isAdmin={!!isAdmin} fixtures={fixtures ?? []} myId={user?.uid} />
      )}

      {round.status === 'closed' && isAdmin && (
        <Button variant="outline" disabled={createRound.isPending} onClick={() => user && createRound.mutate({ createdBy: user.uid })}>
          {createRound.isPending ? 'Abrindo…' : 'Abrir próxima rodada'}
        </Button>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: Round['status'] }) {
  const map = {
    confirming: ['Confirmando', 'bg-amber-500/15 text-amber-600'],
    drawn: ['Sorteada', 'bg-accent/15 text-accent'],
    closed: ['Encerrada', 'bg-surface-2 text-fg-muted'],
  } as const
  const [label, cls] = map[status]
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

function ConfirmingPanel({
  rankingId,
  roundId,
  isAdmin,
  member,
  participants,
}: {
  rankingId: string
  roundId: string
  isAdmin: boolean
  member?: { id: string; displayName: string }
  participants: { id: string; displayName: string }[]
}) {
  const toggle = useToggleParticipation(rankingId, roundId)
  const draw = useDrawRound(rankingId, roundId)
  const [error, setError] = useState<string | null>(null)
  const confirmed = !!member && participants.some(p => p.id === member.id)

  return (
    <div className="flex flex-col gap-5">
      {member ? (
        <Button
          variant={confirmed ? 'outline' : 'primary'}
          disabled={toggle.isPending}
          onClick={() => toggle.mutate({ uid: member.id, displayName: member.displayName, confirmed: !confirmed })}
        >
          {confirmed ? 'Cancelar presença' : 'Confirmar presença nesta rodada'}
        </Button>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-fg-muted">
          Entre no ranking para participar da rodada.
        </p>
      )}

      <section>
        <h3 className="mb-2 text-sm font-medium text-fg-muted">Confirmados ({participants.length})</h3>
        {participants.length === 0 ? (
          <p className="text-sm text-fg-subtle">Ninguém confirmou ainda.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {participants.map(p => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={p.displayName} size={32} />
                <span className="text-sm font-medium">{p.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <div className="flex flex-col gap-2">
          <Button
            disabled={draw.isPending || participants.length < 2}
            onClick={() => {
              setError(null)
              draw.mutate(undefined, { onError: e => setError(e instanceof Error ? e.message : 'Erro ao sortear.') })
            }}
          >
            {draw.isPending ? 'Sorteando…' : 'Sortear confrontos'}
          </Button>
          {participants.length < 2 && <p className="text-xs text-fg-subtle">Precisa de pelo menos 2 confirmados.</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  )
}

function DrawnPanel({
  rankingId,
  round,
  isAdmin,
  fixtures,
  myId,
}: {
  rankingId: string
  round: Round
  isAdmin: boolean
  fixtures: Fixture[]
  myId?: string
}) {
  const closeRound = useCloseRound(rankingId, round.id)
  const closed = round.status === 'closed'

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {fixtures.map(f => (
          <FixtureRow key={f.id} rankingId={rankingId} roundId={round.id} fixture={f} mine={f.aId === myId || f.bId === myId} canRecord={!closed} />
        ))}
      </ul>

      {round.byeId && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-fg-muted">
          🎾 <span className="font-medium">{round.byeName}</span> folga nesta rodada
        </p>
      )}

      {isAdmin && !closed && (
        <Button variant="outline" disabled={closeRound.isPending} onClick={() => closeRound.mutate()}>
          {closeRound.isPending ? 'Encerrando…' : 'Encerrar rodada'}
        </Button>
      )}
    </div>
  )
}

function FixtureRow({
  rankingId,
  roundId,
  fixture,
  mine,
  canRecord,
}: {
  rankingId: string
  roundId: string
  fixture: Fixture
  mine: boolean
  canRecord: boolean
}) {
  const { user } = useAuth()
  const record = useRecordFixture(rankingId, roundId)
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState('')
  const [error, setError] = useState<string | null>(null)
  const played = fixture.status === 'played'

  const submit = async (winnerId: string, loserId: string) => {
    setError(null)
    try {
      await record.mutateAsync({ fixtureId: fixture.id, winnerId, loserId, score: score.trim() || undefined, recordedBy: user?.uid ?? 'unknown' })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar.')
    }
  }

  return (
    <li className={`rounded-2xl border bg-surface p-4 ${mine ? 'border-accent/40' : 'border-border'}`}>
      <div className="flex items-center gap-2">
        <Side name={fixture.aName} won={played && fixture.winnerId === fixture.aId} />
        <span className="px-2 text-xs font-medium text-fg-subtle">vs</span>
        <Side name={fixture.bName} won={played && fixture.winnerId === fixture.bId} right />
      </div>

      {played ? (
        fixture.score && <p className="mt-2 text-center text-xs text-fg-muted">{fixture.score}</p>
      ) : canRecord ? (
        <div className="mt-3">
          {open ? (
            <div className="flex flex-col gap-2">
              <input
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="Placar (opcional) — 6-4 6-3"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring)]"
              />
              <div className="flex gap-2">
                <Button className="flex-1" disabled={record.isPending} onClick={() => submit(fixture.aId, fixture.bId)}>
                  {fixture.aName} venceu
                </Button>
                <Button className="flex-1" disabled={record.isPending} onClick={() => submit(fixture.bId, fixture.aId)}>
                  {fixture.bName} venceu
                </Button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-fg-subtle hover:text-fg">
                cancelar
              </button>
            </div>
          ) : (
            <Button variant="ghost" className="w-full" onClick={() => setOpen(true)}>
              Registrar resultado
            </Button>
          )}
        </div>
      ) : null}
    </li>
  )
}

function Side({ name, won, right }: { name: string; won: boolean; right?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <Avatar name={name} size={32} />
      <span className={`min-w-0 truncate text-sm ${won ? 'font-semibold text-accent' : 'font-medium'}`}>{name}</span>
    </div>
  )
}
