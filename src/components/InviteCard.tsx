import { useState } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import { DEFAULT_RANKING_SETTINGS, type Ranking } from '../features/rankings/types'
import { useRegenerateCode } from '../features/rankings/useRankings'
import { Button } from './Button'
import { InviteButton } from './InviteButton'

const copyToClipboard = (text: string) =>
  navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)

/** Invite block on the ranking page: share by code (typed on the home) or by
 * link (opening it drops the person straight into the ranking). */
export function InviteCard({ ranking, isAdmin }: { ranking: Ranking; isAdmin: boolean }) {
  const { user } = useAuth()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const regenerate = useRegenerateCode(ranking.id)
  const code = ranking.inviteCode
  const link = code ? `${window.location.origin}/entrar/${code}` : ''

  const copy = async (what: 'code' | 'link') => {
    if (await copyToClipboard(what === 'code' ? code : link)) {
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const generate = () => {
    if (!user) return
    regenerate.mutate({ startRating: (ranking.settings ?? DEFAULT_RANKING_SETTINGS).startRating, ownerId: user.uid })
  }

  if (!code) {
    if (!isAdmin) return null
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
        <h2 className="font-medium">Convidar pessoas</h2>
        <p className="mt-1 text-sm text-fg-muted">Este ranking ainda não tem um convite.</p>
        <Button variant="outline" onClick={generate} disabled={regenerate.isPending} className="mt-4">
          {regenerate.isPending ? 'Gerando…' : 'Gerar convite'}
        </Button>
        {regenerate.isError && <p className="mt-2 text-xs text-danger">{(regenerate.error as Error)?.message ?? 'Erro ao gerar o convite.'}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <h2 className="font-medium">Convidar pessoas</h2>
      <p className="mt-1 text-sm text-fg-muted">Compartilhe o código ou o link — quem abrir o link entra direto no ranking.</p>

      {/* Código */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-center font-mono text-lg font-semibold tracking-[0.3em]">
          {code}
        </span>
        <Button variant="outline" onClick={() => copy('code')} className="sm:flex-none">
          {copied === 'code' ? 'Copiado ✓' : 'Copiar código'}
        </Button>
      </div>

      {/* Link */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="min-w-0 flex-1 truncate rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg-muted">{link}</span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => copy('link')} className="flex-1 sm:flex-none">
            {copied === 'link' ? 'Copiado ✓' : 'Copiar link'}
          </Button>
          <InviteButton code={code} name={ranking.name} />
        </div>
      </div>
    </section>
  )
}
