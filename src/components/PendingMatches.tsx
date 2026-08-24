import { useState } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import { matchFormat } from '../features/matches/score'
import type { Match } from '../features/matches/types'
import { useApproveMatch, usePendingMatches, useRejectMatch } from '../features/matches/useMatches'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Button } from './Button'

/**
 * Match-approval surface for the ranking home. Shows matches awaiting the current
 * user's approval (approve / reject) and matches they recorded that are still
 * waiting on the opponent (which they may cancel).
 */
export function PendingMatches({ rankingId, members }: { rankingId: string; members: { id: string; displayName: string }[] }) {
  const { user } = useAuth()
  const { data: pending } = usePendingMatches(rankingId)
  const nameOf = (id: string) => members.find(m => m.id === id)?.displayName ?? 'Jogador'

  if (!user || !pending || pending.length === 0) return null

  const toApprove = pending.filter(m => m.approverId === user.uid)
  const waiting = pending.filter(m => m.approverId !== user.uid && (m.winnerId === user.uid || m.loserId === user.uid))

  if (toApprove.length === 0 && waiting.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      {toApprove.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-fg-muted">
            Para você confirmar
            <Badge tone="amber">{toApprove.length}</Badge>
          </h2>
          <ul className="flex flex-col gap-3">
            {toApprove.map(m => (
              <PendingRow key={m.id} rankingId={rankingId} match={m} nameOf={nameOf} uid={user.uid} canApprove />
            ))}
          </ul>
        </div>
      )}

      {waiting.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Aguardando confirmação</h2>
          <ul className="flex flex-col gap-3">
            {waiting.map(m => (
              <PendingRow key={m.id} rankingId={rankingId} match={m} nameOf={nameOf} uid={user.uid} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function PendingRow({
  rankingId,
  match,
  nameOf,
  uid,
  canApprove = false,
}: { rankingId: string; match: Match; nameOf: (id: string) => string; uid: string; canApprove?: boolean }) {
  const approve = useApproveMatch(rankingId)
  const reject = useRejectMatch(rankingId)
  const [error, setError] = useState<string | null>(null)
  const busy = approve.isPending || reject.isPending

  const iWon = match.winnerId === uid
  const opponent = canApprove ? nameOf(match.recordedBy === match.winnerId ? match.winnerId : match.loserId) : nameOf(match.approverId ?? '')

  const run = (fn: () => Promise<unknown>) => {
    setError(null)
    fn().catch(e => setError(e instanceof Error ? e.message : 'Erro. Tente de novo.'))
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <Avatar name={nameOf(match.winnerId)} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <span className="text-accent">{nameOf(match.winnerId)}</span>
            <span className="text-fg-subtle"> venceu </span>
            {nameOf(match.loserId)}
          </p>
          <p className="text-xs text-fg-muted">
            {match.score ? `${match.score} · ` : ''}
            {matchFormat(match.format ?? undefined).label}
            {match.roundId ? ' · rodada' : ''}
          </p>
        </div>
      </div>

      {canApprove ? (
        <>
          <p className="mt-2 text-xs text-fg-muted">{iWon ? `${opponent} registrou este resultado.` : 'Resultado registrado. Confirme se está certo.'}</p>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => run(() => approve.mutateAsync({ matchId: match.id, approvedBy: uid }))}>
              {approve.isPending ? 'Confirmando…' : 'Confirmar'}
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => run(() => reject.mutateAsync({ match, rejectedBy: uid }))}>
              {reject.isPending ? '…' : 'Recusar'}
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-fg-subtle">Aguardando {opponent}</span>
          <Button variant="ghost" disabled={busy} onClick={() => run(() => reject.mutateAsync({ match, rejectedBy: uid }))}>
            {reject.isPending ? '…' : 'Cancelar'}
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </li>
  )
}
