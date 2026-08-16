import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/Button'
import { useAuth } from '../features/auth/AuthProvider'
import { useRecordMatch } from '../features/matches/useMatches'
import { useMembers } from '../features/rankings/useMembers'

const schema = z
  .object({
    winnerId: z.string().min(1, 'Selecione o vencedor'),
    loserId: z.string().min(1, 'Selecione o perdedor'),
    score: z.string().trim().optional(),
  })
  .refine(v => v.winnerId !== v.loserId, { message: 'Escolha dois jogadores diferentes', path: ['loserId'] })

type Form = z.infer<typeof schema>

const controlClass =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-[var(--ring)]'

export function RecordMatchPage() {
  const { rankingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: members } = useMembers(rankingId)
  const recordMatch = useRecordMatch(rankingId ?? '')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async values => {
    setError(null)
    try {
      await recordMatch.mutateAsync({ ...values, recordedBy: user?.uid ?? 'unknown' })
      navigate(`/r/${rankingId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar a partida.')
    }
  })

  const options = members ?? []

  if (options.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-fg-muted">
        Este ranking precisa de pelo menos dois jogadores antes de registrar partidas.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <Field label="Vencedor" error={errors.winnerId?.message}>
        <PlayerSelect {...register('winnerId')} options={options} />
      </Field>
      <Field label="Perdedor" error={errors.loserId?.message}>
        <PlayerSelect {...register('loserId')} options={options} />
      </Field>
      <Field label="Placar (opcional)" error={errors.score?.message}>
        <input {...register('score')} placeholder="6-4 3-6 7-5" className={controlClass} autoComplete="off" />
      </Field>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full py-3">
        {isSubmitting ? 'Registrando…' : 'Registrar resultado'}
      </Button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in via `children` and wrapped by this label
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-muted">{label}</span>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}

const PlayerSelect = ({ options, ...props }: { options: { id: string; displayName: string }[] } & React.ComponentProps<'select'>) => (
  <select {...props} className={controlClass}>
    <option value="">Selecione…</option>
    {options.map(p => (
      <option key={p.id} value={p.id}>
        {p.displayName}
      </option>
    ))}
  </select>
)
