import { POSITIVE_TAGS, NEGATIVE_TAGS, TAG_LABELS } from '../lib/utils'
import { Badge } from './ui/Badge'

interface Props {
  tagCounts: Record<string, number>
  reviewCount?: number
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

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <div>
        <p className="text-xs font-semibold text-positive uppercase tracking-wider mb-2">
          Praised for
        </p>
        <div className="space-y-1.5">
          {positiveTags.length > 0 ? (
            positiveTags.map((tag) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{TAG_LABELS[tag]}</span>
                <Badge variant="positive">{tagCounts[tag]}</Badge>
              </div>
            ))
          ) : (
            <p className="text-muted text-sm">No positive tags yet.</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-negative uppercase tracking-wider mb-2">
          Reported for
        </p>
        <div className="space-y-1.5">
          {negativeTags.length > 0 ? (
            negativeTags.map((tag) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{TAG_LABELS[tag]}</span>
                <Badge variant="negative">{tagCounts[tag]}</Badge>
              </div>
            ))
          ) : (
            <p className="text-muted text-sm">No negative tags yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
