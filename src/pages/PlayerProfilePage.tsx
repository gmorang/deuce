import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { MedalRank } from '../components/MedalRank'
import { RatingChart } from '../components/RatingChart'
import { useAuth } from '../features/auth/AuthProvider'
import { matchFormat } from '../features/matches/score'
import type { Match } from '../features/matches/types'
import { usePlayerMatches } from '../features/matches/useMatches'
import { useMembers } from '../features/rankings/useMembers'
import { useRanking } from '../features/rankings/useRankings'

/** One match seen from the profiled player's side. */
interface PlayerMatch {
  id: string
  won: boolean
  opponentId: string
  ratingBefore: number
  ratingAfter: number
  delta: number
  score?: string | null
  format?: string | null
  playedAt: number
}

function fromPlayerSide(match: Match, playerId: string): PlayerMatch {
  const won = match.winnerId === playerId
  return {
    id: match.id,
    won,
    opponentId: won ? match.loserId : match.winnerId,
    // Non-null on approved matches (the only ones usePlayerMatches returns).
    ratingBefore: (won ? match.winnerRatingBefore : match.loserRatingBefore) ?? 0,
    ratingAfter: (won ? match.winnerRatingAfter : match.loserRatingAfter) ?? 0,
    delta: (won ? match.ratingDelta : -(match.ratingDelta ?? 0)) ?? 0,
    score: match.score,
    format: match.format,
    playedAt: match.playedAt,
  }
}

export function PlayerProfilePage() {
  const { rankingId, playerId } = useParams()
  const { user } = useAuth()
  const { data: ranking } = useRanking(rankingId)
  const { data: members, isLoading: membersLoading } = useMembers(rankingId)
  const { data: rawMatches, isLoading: matchesLoading } = usePlayerMatches(rankingId, playerId)

  const member = members?.find(m => m.id === playerId)
  const nameOf = useMemo(() => {
    const map = new Map(members?.map(m => [m.id, m.displayName]))
    return (id: string) => map.get(id) ?? 'Jogador removido'
  }, [members])

  // Oldest-first, from this player's perspective.
  const matches = useMemo(() => (rawMatches ?? []).map(m => fromPlayerSide(m, playerId ?? '')), [rawMatches, playerId])

  const series = useMemo(() => {
    if (matches.length === 0) return []
    return [matches[0].ratingBefore, ...matches.map(m => m.ratingAfter)]
  }, [matches])

  const peak = series.length ? Math.max(...series) : member?.rating
  const streak = useMemo(() => currentStreak(matches), [matches])
  const form = matches.slice(-5).map(m => m.won)
  const headToHead = useMemo(() => buildHeadToHead(matches), [matches])
  const recent = useMemo(() => [...matches].reverse().slice(0, 12), [matches])

  if (membersLoading) return null
  if (!member) return <Navigate to={`/r/${rankingId}`} replace />

  const isMe = member.id === user?.uid
  const total = member.wins + member.losses
  const winRate = total > 0 ? Math.round((member.wins / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/r/${rankingId}`} className="text-sm text-fg-muted transition-colors hover:text-fg">
          ‹ {ranking?.name ?? 'Ranking'}
        </Link>
      </div>

      {/* Header */}
      <section className="rise flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
        <Avatar name={member.displayName} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 truncate text-2xl font-semibold tracking-tight">
            {member.displayName}
            {isMe && <Badge tone="accent">você</Badge>}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-fg-muted">
            <MedalRank rank={member.rank} size={20} />
            <span>{ordinal(member.rank)} no ranking</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`tabular text-3xl font-bold ${member.rank === 1 ? 'text-accent' : ''}`}>{member.rating}</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-fg-subtle">pts</p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Vitórias" value={`${member.wins}`} />
        <Stat label="Derrotas" value={`${member.losses}`} />
        <Stat label="Aproveitamento" value={total > 0 ? `${winRate}%` : '—'} />
        <Stat
          label="Sequência"
          value={streak.count > 0 ? `${streak.count}${streak.won ? 'V' : 'D'}` : '—'}
          tone={streak.count > 0 ? (streak.won ? 'up' : 'down') : undefined}
        />
      </section>

      {form.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <span>Forma</span>
          <div className="flex gap-1">
            {form.map((won, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed short form list, order is the identity
                key={i}
                title={won ? 'Vitória' : 'Derrota'}
                className={`inline-flex size-5 items-center justify-center rounded-md text-[10px] font-bold text-white ${won ? 'bg-accent' : 'bg-danger'}`}
              >
                {won ? 'V' : 'D'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Elo evolution */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-medium">Evolução do rating</h2>
          {peak != null && <span className="text-sm text-fg-muted">pico {peak}</span>}
        </div>
        {series.length >= 2 ? (
          <RatingChart values={series} />
        ) : (
          <p className="py-8 text-center text-sm text-fg-subtle">Jogue algumas partidas para ver a evolução.</p>
        )}
      </section>

      {/* Head-to-head */}
      {headToHead.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Confrontos</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow)]">
            {headToHead.map(h => (
              <li key={h.opponentId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={nameOf(h.opponentId)} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{nameOf(h.opponentId)}</span>
                <span className="tabular text-sm">
                  <span className={h.wins > h.losses ? 'font-semibold text-accent' : ''}>{h.wins}</span>
                  <span className="text-fg-subtle"> · </span>
                  <span className={h.losses > h.wins ? 'font-semibold text-danger' : ''}>{h.losses}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent matches */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Últimas partidas</h2>
        {matchesLoading && <p className="text-sm text-fg-subtle">Carregando…</p>}
        {!matchesLoading && recent.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-fg-muted">Nenhuma partida ainda.</div>
        )}
        {recent.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow)]">
            {recent.map(m => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${m.won ? 'bg-accent' : 'bg-danger'}`}
                >
                  {m.won ? 'V' : 'D'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">vs {nameOf(m.opponentId)}</p>
                  <p className="text-xs text-fg-muted">
                    {m.score ? `${m.score} · ` : ''}
                    {matchFormat(m.format ?? undefined).label} · {formatDate(m.playedAt)}
                  </p>
                </div>
                <span className={`tabular text-sm font-semibold ${m.delta >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {m.delta >= 0 ? '+' : ''}
                  {m.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const valueColor = tone === 'up' ? 'text-accent' : tone === 'down' ? 'text-danger' : ''
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      <p className={`tabular text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-fg-muted">{label}</p>
    </div>
  )
}

function currentStreak(matches: PlayerMatch[]): { count: number; won: boolean } {
  if (matches.length === 0) return { count: 0, won: false }
  const last = matches[matches.length - 1]
  let count = 0
  for (let i = matches.length - 1; i >= 0; i--) {
    if (matches[i].won === last.won) count++
    else break
  }
  return { count, won: last.won }
}

function buildHeadToHead(matches: PlayerMatch[]): { opponentId: string; wins: number; losses: number }[] {
  const map = new Map<string, { opponentId: string; wins: number; losses: number }>()
  for (const m of matches) {
    const h = map.get(m.opponentId) ?? { opponentId: m.opponentId, wins: 0, losses: 0 }
    if (m.won) h.wins++
    else h.losses++
    map.set(m.opponentId, h)
  }
  return [...map.values()].sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
}

function ordinal(rank: number): string {
  return `${rank}º`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
