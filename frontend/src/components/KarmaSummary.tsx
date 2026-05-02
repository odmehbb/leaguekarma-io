import { POSITIVE_TAGS, NEGATIVE_TAGS, TAG_LABELS } from '../lib/utils'

interface Props {
  tagCounts: Record<string, number>
}

export default function KarmaSummary({ tagCounts }: Props) {
  const positiveTags = POSITIVE_TAGS.filter((t) => tagCounts[t])
    .sort((a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0))

  const negativeTags = NEGATIVE_TAGS.filter((t) => tagCounts[t])
    .sort((a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0))

  if (!positiveTags.length && !negativeTags.length) {
    return <p className="text-gray-500 text-sm">No reviews yet.</p>
  }

  return (
    <div className="space-y-4">
      {positiveTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Praised for</h3>
          <div className="flex flex-wrap gap-2">
            {positiveTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-green-900/30 border border-green-700/50 text-green-300 text-sm px-3 py-1 rounded-full"
              >
                {TAG_LABELS[tag]}
                <span className="text-green-400 font-semibold">{tagCounts[tag]}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {negativeTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Reported for</h3>
          <div className="flex flex-wrap gap-2">
            {negativeTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-3 py-1 rounded-full"
              >
                {TAG_LABELS[tag]}
                <span className="text-red-400 font-semibold">{tagCounts[tag]}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
