import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/Button'
import { IdentityPicker } from '../components/IdentityPicker'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { DEFAULT_MATCH_FORMAT, MATCH_FORMATS, type MatchFormat } from '../features/matches/score'
import { DEFAULT_RANKING_COLOR, DEFAULT_RANKING_ICON } from '../features/rankings/identity'
import { useCreateRanking } from '../features/rankings/useRankings'

const schema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto'),
  description: z.string().trim().max(280, 'Máximo 280 caracteres').optional(),
})
type Form = z.infer<typeof schema>

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-[var(--ring)]'

/** Admin-only screen for creating a ranking: name, description and identity. */
export function CreateRankingPage() {
  const { user } = useAuth()
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin()
  const navigate = useNavigate()
  const createRanking = useCreateRanking()

  const [icon, setIcon] = useState(DEFAULT_RANKING_ICON)
  const [color, setColor] = useState(DEFAULT_RANKING_COLOR)
  const [format, setFormat] = useState<MatchFormat>(DEFAULT_MATCH_FORMAT)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ name, description }) => {
    if (!user) return
    const id = await createRanking.mutateAsync({
      name,
      ownerId: user.uid,
      description: description?.trim() ? description.trim() : null,
      icon,
      color,
      type: 'singles',
      format,
    })
    navigate(`/r/${id}`)
  })

  if (adminLoading) return null
  if (!isAdmin) return <Navigate to="/rankings" replace />

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link to="/rankings" className="text-sm text-fg-muted transition-colors hover:text-fg">
          ‹ Rankings
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Novo ranking</h1>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Nome</span>
            <input {...register('name')} placeholder="Ex: Ranking da firma" className={inputClass} autoComplete="off" />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Descrição (opcional)</span>
            <input {...register('description')} placeholder="Ex: toda sexta, quadra do clube" className={inputClass} autoComplete="off" />
            {errors.description && <span className="text-xs text-danger">{errors.description.message}</span>}
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Tipo</span>
            <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
              <span className="flex-1 rounded-lg bg-surface px-3 py-1.5 text-center text-sm font-medium text-fg shadow-sm">Simples</span>
              <span className="flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium text-fg-subtle">Duplas · em breve</span>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Formato das partidas</span>
            <select value={format} onChange={e => setFormat(e.target.value as MatchFormat)} className={inputClass}>
              {MATCH_FORMATS.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-fg-subtle">Todas as partidas deste ranking usam este formato.</span>
          </label>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <IdentityPicker icon={icon} color={color} onIcon={setIcon} onColor={setColor} />
        </div>

        <Button type="submit" disabled={createRanking.isPending} className="w-full py-3">
          {createRanking.isPending ? 'Criando…' : 'Criar ranking'}
        </Button>
      </form>
    </div>
  )
}
