/** Thin relative-strength bar beside a rating; the leader's uses the accent color. */
export function RatingBar({ fill, leader = false, width = 64 }: { fill: number; leader?: boolean; width?: number }) {
  return (
    <div className="overflow-hidden rounded-full bg-surface-2" style={{ height: 6, width }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(fill * 100, 6)}%`,
          background: leader ? 'var(--accent)' : 'var(--fg-subtle)',
          transition: 'width var(--dur-slow) var(--ease-out)',
        }}
      />
    </div>
  )
}
