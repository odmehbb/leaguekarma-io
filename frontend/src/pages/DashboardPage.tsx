import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, linkRiot, getPlayerMatches, getPlayerProfile, getReviewsGiven, syncMatches } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import MatchCard, { type MatchData } from '../components/MatchCard'
import KarmaSummary from '../components/KarmaSummary'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { ExternalLink, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react'
import { TAG_LABELS, POSITIVE_TAGS, timeAgo } from '../lib/utils'

const TIER_HEX: Record<string, string> = {
  IRON: '#a1a1aa', BRONZE: '#b45309', SILVER: '#94a3b8',
  GOLD: '#facc15', PLATINUM: '#2dd4bf', EMERALD: '#34d399',
  DIAMOND: '#60a5fa', MASTER: '#c084fc', GRANDMASTER: '#fb7185', CHALLENGER: '#7dd3fc',
}
function tierColor(tier: string) { return TIER_HEX[tier] ?? '#8899BB' }

const POSITIVE_TAG_SET = new Set(POSITIVE_TAGS as readonly string[])

type ReviewGiven = {
  id: string
  subjectPuuid: string
  subjectGameName: string | null
  subjectTagLine: string | null
  tags: string[]
  note: string | null
  createdAt: string
}

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

  const { data: reviewsGiven } = useQuery({
    queryKey: ['reviews-given'],
    queryFn: getReviewsGiven,
    enabled: !!riotAccount,
  })

  const syncMutation = useMutation({
    mutationFn: syncMatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] })
    },
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

  const topTags = myProfile?.tagCounts
    ? Object.entries(myProfile.tagCounts as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">{me?.email}</p>
        </div>
        {riotAccount && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white border border-border hover:border-gold/40 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
              title="Sync recent matches"
            >
              <RefreshCw size={12} className={syncMutation.isPending ? 'animate-spin' : ''} />
              {syncMutation.isPending ? 'Syncing…' : 'Sync matches'}
            </button>
            <button
              onClick={() => navigate(`/player/${riotAccount.gameName}/${riotAccount.tagLine}`)}
              className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
            >
              View profile <ExternalLink size={13} />
            </button>
          </div>
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
              {riotAccount.soloTier && (
                <p className="text-sm font-semibold mt-1" style={{ color: tierColor(riotAccount.soloTier) }}>
                  {riotAccount.soloTier.charAt(0) + riotAccount.soloTier.slice(1).toLowerCase()} {riotAccount.soloRank} · {riotAccount.soloLp} LP
                </p>
              )}
              {riotAccount.lastSyncedAt && (
                <p className="text-xs text-muted mt-2">
                  Last synced {timeAgo(riotAccount.lastSyncedAt)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Your Reputation</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">{myProfile?.reviewCount ?? 0}</span>
                <span className="text-muted text-sm">reviews received</span>
              </div>
              {topTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {topTags.map(([tag, count]) => (
                    <Badge key={tag} variant="neutral">
                      {TAG_LABELS[tag] ?? tag} · {count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Own karma summary */}
      {riotAccount && (myProfile?.reviewCount ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Your Reputation</h2>
          <Card>
            <CardContent className="pt-5">
              <KarmaSummary tagCounts={myProfile?.tagCounts ?? {}} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews I've given */}
      {reviewsGiven && reviewsGiven.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Reviews You've Given
            <span className="text-muted font-normal normal-case ml-2 text-xs">— {reviewsGiven.length} total</span>
          </h2>
          <div className="space-y-2">
            {reviewsGiven.slice(0, 10).map((r: ReviewGiven) => {
              const isPositive = r.tags.some((t: string) => POSITIVE_TAG_SET.has(t))
              const profilePath = r.subjectGameName && r.subjectTagLine
                ? `/player/${encodeURIComponent(r.subjectGameName)}/${encodeURIComponent(r.subjectTagLine)}`
                : null
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-lg border border-border bg-surface/50"
                >
                  <div className={`mt-0.5 shrink-0 ${isPositive ? 'text-positive' : 'text-negative'}`}>
                    {isPositive ? <ThumbsUp size={13} /> : <ThumbsDown size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {profilePath ? (
                      <Link
                        to={profilePath}
                        className="text-xs font-semibold text-white hover:text-gold transition-colors truncate block"
                      >
                        {r.subjectGameName}
                        <span className="text-muted font-normal">#{r.subjectTagLine}</span>
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-white">Unknown player</span>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.tags.slice(0, 3).map((tag: string) => (
                        <Badge
                          key={tag}
                          variant={POSITIVE_TAG_SET.has(tag) ? 'positive' : 'negative'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {TAG_LABELS[tag] ?? tag}
                        </Badge>
                      ))}
                    </div>
                    {r.note && (
                      <p className="text-[11px] text-muted italic mt-1 truncate">"{r.note}"</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted shrink-0 mt-0.5">{timeAgo(r.createdAt)}</span>
                </div>
              )
            })}
          </div>
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
