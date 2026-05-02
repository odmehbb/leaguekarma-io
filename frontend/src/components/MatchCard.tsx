interface Match {
  id: string
  riotMatchId: string
  gameMode: string
  queueId: number
  gameDuration: number
  gameEndTimestamp: string
  participant?: {
    championName: string
    win: boolean
    kills: number
    deaths: number
    assists: number
    role?: string
  }
}

interface Props {
  match: Match
  onReview?: (matchId: string) => void
  reviewed?: boolean
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function queueLabel(queueId: number) {
  if (queueId === 420) return 'Ranked Solo'
  if (queueId === 400) return 'Normal Draft'
  return 'Other'
}

export default function MatchCard({ match, onReview, reviewed }: Props) {
  const p = match.participant
  const win = p?.win

  return (
    <div
      className={`border rounded-lg p-4 flex items-center justify-between gap-4 ${
        win === true
          ? 'border-blue-700/50 bg-blue-900/10'
          : win === false
          ? 'border-red-700/50 bg-red-900/10'
          : 'border-karma-border bg-karma-surface'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {p && (
          <div className="text-center w-12 shrink-0">
            <div className="text-xs text-gray-400">{p.championName}</div>
            <div className={`text-sm font-bold ${win ? 'text-blue-400' : 'text-red-400'}`}>
              {win ? 'WIN' : 'LOSS'}
            </div>
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm text-white font-medium">{queueLabel(match.queueId)}</div>
          {p && (
            <div className="text-xs text-gray-400">
              {p.kills}/{p.deaths}/{p.assists} · {p.role ?? '—'} · {formatDuration(match.gameDuration)}
            </div>
          )}
          <div className="text-xs text-gray-600 mt-0.5">
            {new Date(match.gameEndTimestamp).toLocaleDateString()}
          </div>
        </div>
      </div>

      {onReview && (
        <button
          onClick={() => onReview(match.id)}
          disabled={reviewed}
          className={`shrink-0 text-sm px-3 py-1.5 rounded font-medium transition-colors ${
            reviewed
              ? 'bg-gray-800 text-gray-500 cursor-default'
              : 'bg-karma-gold text-karma-dark hover:opacity-90'
          }`}
        >
          {reviewed ? 'Reviewed' : 'Review'}
        </button>
      )}
    </div>
  )
}
