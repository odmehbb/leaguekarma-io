import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPlayerProfile, getPlayerMatches, getMe } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import KarmaSummary from '../components/KarmaSummary'
import MatchCard, { type MatchData } from '../components/MatchCard'
import { Card, CardContent } from '../components/ui/Card'
import { ArrowLeft } from 'lucide-react'

export default function PlayerPage() {
  const { gameName, tagLine } = useParams<{ gameName: string; tagLine: string }>()
  const { user } = useAuth()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!user,
    retry: false,
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['player', gameName, tagLine],
    queryFn: () => getPlayerProfile(gameName!, tagLine!),
  })

  const { data: matches } = useQuery({
    queryKey: ['player-matches', gameName, tagLine],
    queryFn: () => getPlayerMatches(gameName!, tagLine!),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-4 bg-surface rounded w-24 animate-pulse" />
        <div className="h-24 bg-surface rounded-lg animate-pulse" />
      </div>
    )
  }

  const myPuuid = me?.riotAccount?.puuid

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
        <ArrowLeft size={14} /> Search
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {gameName}
                <span className="text-muted font-normal text-2xl">#{tagLine}</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {profile?.account && (
                  <span className="text-sm text-muted">
                    Level {profile.account.summonerLevel}
                  </span>
                )}
                {!profile?.registered && (
                  <span className="text-sm text-muted italic">
                    Hasn't joined leaguekarma.io yet
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0 border-l border-border pl-4">
              <div className="text-3xl font-bold text-white">{profile?.reviewCount ?? 0}</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-0.5">reviews</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Karma summary */}
      <div>
        <h2 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">Karma</h2>
        <Card className="border-t-2 border-t-gold/60">
          <CardContent className="pt-5">
            <KarmaSummary tagCounts={profile?.tagCounts ?? {}} reviewCount={profile?.reviewCount} />
          </CardContent>
        </Card>
      </div>

      {/* Recent matches */}
      {matches && matches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Recent Matches
            {user && <span className="text-muted font-normal normal-case ml-2 text-xs">(expand to review)</span>}
          </h2>
          <div className="space-y-2">
            {matches.map((match: MatchData) => (
              <MatchCard
                key={match.id}
                match={match}
                myPuuid={myPuuid}
              />
            ))}
          </div>
        </div>
      )}

      {matches?.length === 0 && (
        <p className="text-muted text-sm">No matches synced yet.</p>
      )}
    </div>
  )
}
