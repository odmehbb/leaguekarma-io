import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPlayerProfile, getPlayerMatches, getSharedMatches, getMyReviews } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import KarmaSummary from '../components/KarmaSummary'
import MatchCard from '../components/MatchCard'
import ReviewModal from '../components/ReviewModal'

export default function PlayerPage() {
  const { gameName, tagLine } = useParams<{ gameName: string; tagLine: string }>()
  const { user } = useAuth()
  const [reviewingMatchId, setReviewingMatchId] = useState<string | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['player', gameName, tagLine],
    queryFn: () => getPlayerProfile(gameName!, tagLine!),
  })

  const { data: sharedMatches } = useQuery({
    queryKey: ['shared-matches', gameName, tagLine],
    queryFn: () => getSharedMatches(gameName!, tagLine!),
    enabled: !!user,
  })

  const { data: myReviews } = useQuery({
    queryKey: ['my-reviews', gameName, tagLine],
    queryFn: () => getMyReviews(gameName!, tagLine!),
    enabled: !!user,
  })

  const { data: matches } = useQuery({
    queryKey: ['player-matches', gameName, tagLine],
    queryFn: () => getPlayerMatches(gameName!, tagLine!),
  })

  if (isLoading) return <div className="text-gray-500">Loading…</div>

  const reviewedMatchIds = new Set((myReviews ?? []).map((r: { matchId: string }) => r.matchId))
  const reviewingMatch = reviewingMatchId
    ? (sharedMatches ?? []).find((m: { id: string }) => m.id === reviewingMatchId)
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {gameName}
          <span className="text-gray-500">#{tagLine}</span>
        </h1>
        {profile?.account && (
          <p className="text-sm text-gray-500 mt-1">
            Level {profile.account.summonerLevel}
          </p>
        )}
        {!profile?.registered && (
          <p className="text-sm text-gray-500 mt-2">
            This player hasn't joined leaguekarma.io yet.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Karma ({profile?.reviewCount ?? 0} reviews)
        </h2>
        <KarmaSummary tagCounts={profile?.tagCounts ?? {}} />
      </div>

      {user && sharedMatches && sharedMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Matches you played together
          </h2>
          <div className="space-y-2">
            {sharedMatches.map((match: Parameters<typeof MatchCard>[0]['match'] & { theirParticipant?: Parameters<typeof MatchCard>[0]['match']['participant'] }) => (
              <MatchCard
                key={match.id}
                match={{ ...match, participant: match.theirParticipant }}
                onReview={setReviewingMatchId}
                reviewed={reviewedMatchIds.has(match.id)}
              />
            ))}
          </div>
        </div>
      )}

      {matches && matches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Matches
          </h2>
          <div className="space-y-2">
            {matches.map((match: Parameters<typeof MatchCard>[0]['match']) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {reviewingMatchId && reviewingMatch && (
        <ReviewModal
          gameName={gameName!}
          tagLine={tagLine!}
          matchId={reviewingMatchId}
          existingReview={(myReviews ?? []).find((r: { matchId: string }) => r.matchId === reviewingMatchId)}
          onClose={() => setReviewingMatchId(null)}
        />
      )}
    </div>
  )
}
