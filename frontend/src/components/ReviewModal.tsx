import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitReview } from '../lib/api'
import { POSITIVE_TAGS, NEGATIVE_TAGS, TAG_LABELS, cn } from '../lib/utils'

interface Props {
  gameName: string
  tagLine: string
  matchId: string
  existingReview?: { tags: string[]; note?: string }
  onClose: () => void
}

export default function ReviewModal({ gameName, tagLine, matchId, existingReview, onClose }: Props) {
  const [selectedTags, setSelectedTags] = useState<string[]>(existingReview?.tags ?? [])
  const [note, setNote] = useState(existingReview?.note ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => submitReview(gameName, tagLine, { matchId, tags: selectedTags, note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews', gameName, tagLine] })
      queryClient.invalidateQueries({ queryKey: ['player', gameName, tagLine] })
      onClose()
    },
  })

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-karma-surface border border-karma-border rounded-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-semibold text-white">
            Review {gameName}#{tagLine}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Select at least one tag</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Positive</p>
            <div className="flex flex-wrap gap-2">
              {POSITIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-sm px-3 py-1 rounded-full border transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-green-600 border-green-500 text-white'
                      : 'border-karma-border text-gray-400 hover:border-green-600 hover:text-green-300'
                  )}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Negative</p>
            <div className="flex flex-wrap gap-2">
              {NEGATIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-sm px-3 py-1 rounded-full border transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-red-700 border-red-600 text-white'
                      : 'border-karma-border text-gray-400 hover:border-red-600 hover:text-red-300'
                  )}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            placeholder="Optional note (280 chars max)..."
            className="w-full bg-karma-dark border border-karma-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-karma-gold"
            rows={3}
          />
          <p className="text-xs text-gray-600 text-right mt-1">{note.length}/280</p>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400">
            {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong'}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-karma-border text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={selectedTags.length === 0 || mutation.isPending}
            className="flex-1 py-2 rounded-lg bg-karma-gold text-karma-dark text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
