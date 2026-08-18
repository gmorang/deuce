import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Scoreboard } from '../components/Scoreboard'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { type MatchFormatDef, type SetScore, computeWinner, formatScore, matchFormat } from '../features/matches/score'
import { useMembers } from '../features/rankings/useMembers'
import { useRanking } from '../features/rankings/useRankings'
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

const emptySets = (n: number): SetScore[] => Array.from({ length: n }, () => ({ a: 0, b: 0 }))

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
    confirming: ['Confirmando', 'amber'],
    drawn: ['Sorteada', 'accent'],
    closed: ['Encerrada', 'neutral'],
  } as const
  const [label, tone] = map[status]
  return <Badge tone={tone}>{label}</Badge>
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
          {error && <p className="text-xs text-danger">{error}</p>}
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
  const { data: ranking } = useRanking(rankingId)
  const def = matchFormat(ranking?.settings?.defaultFormat)
  const closed = round.status === 'closed'

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {fixtures.map(f => (
          <FixtureRow key={f.id} rankingId={rankingId} roundId={round.id} fixture={f} mine={f.aId === myId || f.bId === myId} canRecord={!closed} def={def} />
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
  def,
}: {
  rankingId: string
  roundId: string
  fixture: Fixture
  mine: boolean
  canRecord: boolean
  def: MatchFormatDef
}) {
  const { user } = useAuth()
  const record = useRecordFixture(rankingId, roundId)
  const [open, setOpen] = useState(false)
  const [sets, setSets] = useState<SetScore[]>(() => emptySets(def.maxSets))
  const [error, setError] = useState<string | null>(null)
  const played = fixture.status === 'played'
  const winner = computeWinner(sets, def)

  const close = () => {
    setOpen(false)
    setSets(emptySets(def.maxSets))
    setError(null)
  }

  const submit = async () => {
    if (!winner) return
    setError(null)
    const winnerId = winner === 'a' ? fixture.aId : fixture.bId
    const loserId = winner === 'a' ? fixture.bId : fixture.aId
    try {
      await record.mutateAsync({
        fixtureId: fixture.id,
        winnerId,
        loserId,
        score: formatScore(sets, winner),
        format: def.value,
        recordedBy: user?.uid ?? 'unknown',
      })
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar.')
    }
  }

  return (
    <li className={`rounded-2xl border bg-surface p-4 ${mine ? 'border-accent/40' : 'border-border'}`}>
      {open ? (
        <div className="flex flex-col gap-3">
          <Scoreboard nameA={fixture.aName} nameB={fixture.bName} sets={sets} def={def} onChange={setSets} />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" disabled={record.isPending || !winner} onClick={submit}>
              {record.isPending ? 'Registrando…' : 'Salvar resultado'}
            </Button>
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Side name={fixture.aName} won={played && fixture.winnerId === fixture.aId} />
            <span className="px-2 text-xs font-medium text-fg-subtle">vs</span>
            <Side name={fixture.bName} won={played && fixture.winnerId === fixture.bId} right />
          </div>

          {played
            ? fixture.score && <p className="mt-2 text-center text-xs text-fg-muted">{fixture.score}</p>
            : canRecord && (
                <Button variant="ghost" className="mt-3 w-full" onClick={() => setOpen(true)}>
                  Registrar resultado
                </Button>
              )}
        </>
      )}
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
