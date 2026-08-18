import { useState } from 'react'

/**
 * Lets any member invite others: shares (or copies) a message with the ranking's
 * invite code. Uses the native share sheet on mobile, clipboard elsewhere.
 */
export function InviteButton({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    const url = `${window.location.origin}/entrar/${code}`
    const text = `Entre no ranking "${name}" no Deuce`

    if (navigator.share) {
      await navigator.share({ title: 'Deuce', text, url }).catch(() => undefined)
      return
    }
    const ok = await navigator.clipboard
      .writeText(`${text}: ${url}`)
      .then(() => true)
      .catch(() => false)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
    >
      {copied ? 'Copiado ✓' : 'Convidar'}
    </button>
  )
}
