import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPlayerProfile, getPlayerMatches, getMe, getPublicReviews } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import KarmaSummary from '../components/KarmaSummary'
import MatchCard, { type MatchData } from '../components/MatchCard'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ArrowLeft, Copy, Check, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import { TAG_LABELS, POSITIVE_TAGS, timeAgo } from '../lib/utils'

const TIER_COLORS: Record<string, string> = {
  IRON: '#a1a1aa', BRONZE: '#b45309', SILVER: '#94a3b8',
  GOLD: '#facc15', PLATINUM: '#2dd4bf', EMERALD: '#34d399',
  DIAMOND: '#60a5fa', MASTER: '#c084fc', GRANDMASTER: '#fb7185', CHALLENGER: '#7dd3fc',
}

const DDRAGON_VERSION = '16.9.1'

function ProfileIcon({ iconId }: { iconId: number }) {
  return (
    <img
      src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${iconId}.png`}
      alt="Profile icon"
      className="w-16 h-16 rounded-lg border border-border shrink-0"
    />
  )
}

function RankBadge({ tier, rank, lp, wins, losses }: { tier: string; rank: string; lp: number; wins: number; losses: number }) {
  const color = TIER_COLORS[tier] ?? '#8899BB'
  const games = wins + losses
  const wr = games > 0 ? Math.round((wins / games) * 100) : null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-bold" style={{ color }}>
        {tier.charAt(0) + tier.slice(1).toLowerCase()} {rank}
      </span>
      <span className="text-xs text-muted">{lp} LP</span>
      {wr !== null && (
        <span className="text-xs text-muted">{wins}W {losses}L · {wr}% WR</span>
      )}
    </div>
  )
}

function ShareButton({ gameName, tagLine }: { gameName: string; tagLine: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white border border-border hover:border-gold/40 rounded-md px-2.5 py-1.5 transition-colors"
    >
      {copied ? <Check size={12} className="text-positive" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}

const POSITIVE_TAG_SET = new Set(POSITIVE_TAGS as readonly string[])

function ReviewCard({ review }: { review: { tags: string[]; note?: string | null; createdAt: string } }) {
  const isPositive = review.tags.some((t) => POSITIVE_TAG_SET.has(t))
  return (
    <div className={`rounded-lg border p-3.5 space-y-2 ${isPositive ? 'border-positive/20 bg-positive/5' : 'border-negative/20 bg-negative/5'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isPositive
            ? <ThumbsUp size={13} className="text-positive shrink-0" />
            : <ThumbsDown size={13} className="text-negative shrink-0" />}
          <div className="flex flex-wrap gap-1">
            {review.tags.map((tag) => (
              <Badge
                key={tag}
                variant={POSITIVE_TAG_SET.has(tag) ? 'positive' : 'negative'}
                className="text-[10px] px-1.5 py-0"
              >
                {TAG_LABELS[tag] ?? tag}
              </Badge>
            ))}
          </div>
        </div>
        <span className="text-[10px] text-muted shrink-0">{timeAgo(review.createdAt)}</span>
      </div>
      {review.note && (
        <p className="text-xs text-gray-300 italic leading-relaxed pl-5">"{review.note}"</p>
      )}
    </div>
  )
}

export default function PlayerPage() {
  const { gameName, tagLine } = useParams<{ gameName: string; tagLine: string }>()
  const { user } = useAuth()

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: !!user, retry: false })
  const { data: profile, isLoading } = useQuery({
    queryKey: ['player', gameName, tagLine],
    queryFn: () => getPlayerProfile(gameName!, tagLine!),
  })
  const { data: matches } = useQuery({
    queryKey: ['player-matches', gameName, tagLine],
    queryFn: () => getPlayerMatches(gameName!, tagLine!),
  })
  const { data: publicReviews } = useQuery({
    queryKey: ['public-reviews', gameName, tagLine],
    queryFn: () => getPublicReviews(gameName!, tagLine!),
    enabled: (profile?.reviewCount ?? 0) > 0,
  })

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-4 bg-surface rounded w-24 animate-pulse" />
        <div className="h-32 bg-surface rounded-lg animate-pulse" />
        <div className="h-48 bg-surface rounded-lg animate-pulse" />
      </div>
    )
  }

  const myPuuid = me?.riotAccount?.puuid
  const isSelf = myPuuid && profile?.account?.puuid === myPuuid

  // Separate reviews with notes from those without
  const reviewsWithNotes = (publicReviews ?? []).filter((r: { note?: string | null }) => r.note)
  const allReviews = publicReviews ?? []

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
        <ArrowLeft size={14} /> Search
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            {profile?.account?.profileIconId && (
              <ProfileIcon iconId={profile.account.profileIconId} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                    {gameName}
                    <span className="text-muted font-normal text-xl">#{tagLine}</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {profile?.account?.summonerLevel && (
                      <span className="text-xs text-muted">Lvl {profile.account.summonerLevel}</span>
                    )}
                    {!profile?.registered && (
                      <span className="text-xs text-muted italic">Not yet registered</span>
                    )}
                  </div>
                  {profile?.account?.soloTier && (
                    <div className="mt-2">
                      <RankBadge
                        tier={profile.account.soloTier}
                        rank={profile.account.soloRank}
                        lp={profile.account.soloLp}
                        wins={profile.account.soloWins}
                        losses={profile.account.soloLosses}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{profile?.reviewCount ?? 0}</div>
                    <div className="text-xs text-muted uppercase tracking-wider">reviews</div>
                  </div>
                  <ShareButton gameName={gameName!} tagLine={tagLine!} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No reviews CTA */}
      {(profile?.reviewCount ?? 0) === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center">
            <MessageSquare size={28} className="text-muted mx-auto mb-2" />
            <p className="text-white font-medium">No reviews yet</p>
            {isSelf ? (
              <p className="text-muted text-sm mt-1">Play some games and your teammates can leave you reviews.</p>
            ) : matches && matches.length > 0 ? (
              <p className="text-muted text-sm mt-1">
                {user
                  ? 'Expand a match below to leave the first review.'
                  : 'Sign in to leave the first review.'}
              </p>
            ) : (
              <p className="text-muted text-sm mt-1">This player hasn't been seen in any synced matches yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Karma summary */}
      {(profile?.reviewCount ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">Reputation</h2>
          <Card className="border-t-2 border-t-gold/60">
            <CardContent className="pt-5">
              <KarmaSummary tagCounts={profile?.tagCounts ?? {}} reviewCount={profile?.reviewCount} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* What people say — show all reviews if with notes, else just the notes ones */}
      {allReviews.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            What People Say
            <span className="text-muted font-normal normal-case ml-2 text-xs">— anonymous</span>
          </h2>
          <div className="space-y-2">
            {(reviewsWithNotes.length > 0 ? reviewsWithNotes : allReviews.slice(0, 5)).map(
              (review: { tags: string[]; note?: string | null; createdAt: string }, i: number) => (
                <ReviewCard key={i} review={review} />
              )
            )}
          </div>
        </div>
      )}

      {/* Recent matches */}
      {matches && matches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Recent Matches
            {isSelf && (
              <span className="text-muted font-normal normal-case ml-2 text-xs">— expand to review teammates</span>
            )}
          </h2>
          <div className="space-y-2">
            {matches.map((match: MatchData) => (
              // Only enable reviewing on your own profile — on others' profiles, review buttons would error
              // since the viewer likely wasn't in those matches
              <MatchCard key={match.id} match={match} myPuuid={isSelf ? myPuuid : undefined} />
            ))}
          </div>
        </div>
      )}

      {matches?.length === 0 && (profile?.reviewCount ?? 0) > 0 && (
        <p className="text-muted text-sm">No recent matches found.</p>
      )}
    </div>
  )
}
