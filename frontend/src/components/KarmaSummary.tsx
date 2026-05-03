import { POSITIVE_TAGS, NEGATIVE_TAGS, TAG_LABELS } from '../lib/utils'

interface Props {
  tagCounts: Record<string, number>
  reviewCount?: number
}

function TagBar({ tag, count, max, variant }: { tag: string; count: number; max: number; variant: 'positive' | 'negative' }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  const barColor = variant === 'positive' ? 'bg-positive' : 'bg-negative'
  const textColor = variant === 'positive' ? 'text-positive' : 'text-negative'

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 w-36 shrink-0 truncate">{TAG_LABELS[tag]}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-5 text-right shrink-0 ${textColor}`}>{count}</span>
    </div>
  )
}

export default function KarmaSummary({ tagCounts, reviewCount }: Props) {
  const positiveTags = POSITIVE_TAGS.filter((t) => tagCounts[t])
    .sort((a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0))

  const negativeTags = NEGATIVE_TAGS.filter((t) => tagCounts[t])
    .sort((a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0))

  if (!positiveTags.length && !negativeTags.length) {
    return (
      <p className="text-muted text-sm">
        No reviews yet{reviewCount === 0 ? ' — be the first to leave one.' : '.'}
      </p>
    )
  }

  const maxPositive = positiveTags.reduce((m, t) => Math.max(m, tagCounts[t] ?? 0), 0)
  const maxNegative = negativeTags.reduce((m, t) => Math.max(m, tagCounts[t] ?? 0), 0)

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-semibold text-positive uppercase tracking-wider mb-3">
          Praised for
        </p>
        {positiveTags.length > 0 ? (
          <div className="space-y-2.5">
            {positiveTags.map((tag) => (
              <TagBar key={tag} tag={tag} count={tagCounts[tag] ?? 0} max={maxPositive} variant="positive" />
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">No positive tags yet.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-negative uppercase tracking-wider mb-3">
          Reported for
        </p>
        {negativeTags.length > 0 ? (
          <div className="space-y-2.5">
            {negativeTags.map((tag) => (
              <TagBar key={tag} tag={tag} count={tagCounts[tag] ?? 0} max={maxNegative} variant="negative" />
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">No negative tags yet.</p>
        )}
      </div>
    </div>
  )
}
