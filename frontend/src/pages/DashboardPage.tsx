import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, linkRiot, getPlayerMatches, getPlayerProfile } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import MatchCard, { type MatchData } from '../components/MatchCard'
import KarmaSummary from '../components/KarmaSummary'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { ExternalLink } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [riotInput, setRiotInput] = useState('')
  const [linkError, setLinkError] = useState('')

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!user,
  })

  const riotAccount = me?.riotAccount

  const { data: myMatches } = useQuery({
    queryKey: ['my-matches', riotAccount?.gameName, riotAccount?.tagLine],
    queryFn: () => getPlayerMatches(riotAccount!.gameName, riotAccount!.tagLine),
    enabled: !!riotAccount,
  })

  const { data: myProfile } = useQuery({
    queryKey: ['player', riotAccount?.gameName, riotAccount?.tagLine],
    queryFn: () => getPlayerProfile(riotAccount!.gameName, riotAccount!.tagLine),
    enabled: !!riotAccount,
  })

  const linkMutation = useMutation({
    mutationFn: () => {
      const [gameName, tagLine] = riotInput.split('#')
      if (!gameName?.trim() || !tagLine?.trim()) throw new Error('Use format: PlayerName#TAG')
      return linkRiot(gameName.trim(), tagLine.trim())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setLinkError('')
    },
    onError: (err: { message?: string; response?: { data?: { error?: string } } }) => {
      setLinkError(err?.response?.data?.error ?? err?.message ?? 'Failed to link account')
    },
  })

  if (isLoading) {
    return <div className="h-32 bg-surface rounded-lg animate-pulse" />
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-5">Sign in to access your dashboard.</p>
        <Button onClick={() => (window.location.href = '/api/auth/google')}>
          Sign in with Google
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">{me?.email}</p>
        </div>
        {riotAccount && (
          <button
            onClick={() => navigate(`/player/${riotAccount.gameName}/${riotAccount.tagLine}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
          >
            View profile <ExternalLink size={13} />
          </button>
        )}
      </div>

      {/* Link Riot account */}
      {!riotAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>Link your Riot account</CardTitle>
            <p className="text-muted text-sm">Enter your Riot ID to start syncing matches.</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 max-w-sm">
              <Input
                value={riotInput}
                onChange={(e) => setRiotInput(e.target.value)}
                placeholder="PlayerName#EUW"
                onKeyDown={(e) => e.key === 'Enter' && linkMutation.mutate()}
              />
              <Button
                onClick={() => linkMutation.mutate()}
                disabled={linkMutation.isPending}
              >
                {linkMutation.isPending ? 'Linking…' : 'Link'}
              </Button>
            </div>
            {linkError && <p className="text-negative text-sm mt-2">{linkError}</p>}
          </CardContent>
        </Card>
      ) : (
        /* Riot account + own karma */
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-3">Riot Account</p>
              <p className="text-white font-semibold text-lg">
                {riotAccount.gameName}
                <span className="text-muted font-normal">#{riotAccount.tagLine}</span>
              </p>
              <p className="text-muted text-sm mt-0.5">Level {riotAccount.summonerLevel}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Your Karma</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">{myProfile?.reviewCount ?? 0}</span>
                <span className="text-muted text-sm">reviews received</span>
              </div>
              {myProfile?.reviewCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(myProfile.tagCounts as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([tag, count]) => (
                      <Badge key={tag} variant="neutral">
                        {tag} · {count}
                      </Badge>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Own karma summary */}
      {riotAccount && myProfile?.reviewCount > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Your Reputation</h2>
          <Card>
            <CardContent className="pt-5">
              <KarmaSummary tagCounts={myProfile?.tagCounts ?? {}} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent matches */}
      {myMatches && myMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Recent Matches
            <span className="text-muted font-normal normal-case ml-2 text-xs">(expand to review teammates)</span>
          </h2>
          <div className="space-y-2">
            {myMatches.map((match: MatchData) => (
              <MatchCard
                key={match.id}
                match={match}
                myPuuid={riotAccount?.puuid}
              />
            ))}
          </div>
        </div>
      )}

      {riotAccount && myMatches?.length === 0 && (
        <Card>
          <CardContent className="pt-5 text-center py-10">
            <p className="text-muted text-sm">Your matches are being synced in the background.</p>
            <p className="text-muted text-xs mt-1">Check back in a moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
