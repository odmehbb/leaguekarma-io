import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRankings, getPlayerMatches, getMe, getStats, getActivity } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import MatchCard, { type MatchData } from '../components/MatchCard'
import { Search, ThumbsUp, ThumbsDown } from 'lucide-react'
import { TAG_LABELS, timeAgo } from '../lib/utils'

type RankingPlayer = { puuid: string; gameName: string; tagLine: string; score: number }
type ActivityItem = {
  subjectGameName: string
  subjectTagLine: string
  tags: string[]
  positive: boolean
  createdAt: string
}

export default function SearchPage() {
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: !!user, retry: false })
  const riotAccount = me?.riotAccount

  const { data: recentMatches } = useQuery({
    queryKey: ['my-matches', riotAccount?.gameName, riotAccount?.tagLine],
    queryFn: () => getPlayerMatches(riotAccount!.gameName, riotAccount!.tagLine),
    enabled: !!riotAccount,
  })

  const { data: rankings } = useQuery({ queryKey: ['rankings'], queryFn: getRankings })
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getStats, staleTime: 60_000 })
  const { data: activity } = useQuery({ queryKey: ['activity'], queryFn: getActivity, staleTime: 30_000 })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const [gameName, tagLine] = input.split('#')
    if (!gameName?.trim() || !tagLine?.trim()) return
    navigate(`/player/${encodeURIComponent(gameName.trim())}/${encodeURIComponent(tagLine.trim())}`)
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-6 pt-10">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
            Know who you're{' '}
            <span className="text-gold">queuing</span> with
          </h1>
          <p className="text-muted mt-4 max-w-md mx-auto text-base">
            Community-driven reputation for League of Legends — praise the carry, report the flamer.
          </p>
        </div>

        {/* Live stats */}
        {stats && (stats.reviewCount > 0 || stats.playerCount > 0) && (
          <div className="flex items-center justify-center gap-6 text-sm">
            <span className="text-muted">
              <span className="text-white font-semibold">{stats.reviewCount.toLocaleString()}</span> reviews left
            </span>
            <span className="text-border">·</span>
            <span className="text-muted">
              <span className="text-white font-semibold">{stats.playerCount.toLocaleString()}</span> players tracked
            </span>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="PlayerName#EUW"
            className="flex-1 h-11 text-base"
          />
          <Button type="submit" size="lg">
            <Search size={16} />
            Search
          </Button>
        </form>

        {!user && (
          <div className="max-w-sm mx-auto border border-gold/20 bg-gold/5 rounded-lg px-4 py-3 text-sm text-muted">
            <button
              onClick={() => (window.location.href = '/api/auth/google')}
              className="text-gold font-semibold hover:text-gold-light transition-colors"
            >
              Sign in with Google
            </button>{' '}
            to leave reviews after your matches
          </div>
        )}
      </div>

      {/* Recent matches */}
      {riotAccount && recentMatches && recentMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Your Recent Matches</h2>
            <button onClick={() => navigate('/dashboard')} className="text-xs text-gold hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentMatches.slice(0, 5).map((match: MatchData) => (
              <MatchCard key={match.id} match={match} myPuuid={riotAccount.puuid} />
            ))}
          </div>
        </div>
      )}

      {/* Rankings + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rankings — 2 cols */}
        {rankings && (
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Community Rankings</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-t-2 border-t-positive">
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold text-positive uppercase tracking-wider mb-3">
                    Most Praised
                  </p>
                  {rankings.praised.length === 0 ? (
                    <p className="text-muted text-sm">No data yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {rankings.praised.map((p: RankingPlayer, i: number) => (
                        <div
                          key={p.puuid}
                          onClick={() => p.gameName && navigate(`/player/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`)}
                          className="flex items-center gap-3 group cursor-pointer rounded-md px-2 py-2 border border-transparent hover:border-border hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-muted text-sm w-5 shrink-0 text-center">{i + 1}</span>
                          <span className="text-sm text-gray-300 flex-1 group-hover:text-white transition-colors truncate">
                            {p.gameName ?? 'Unknown'}
                            {p.tagLine && <span className="text-muted text-xs">#{p.tagLine}</span>}
                          </span>
                          <span className="text-positive text-sm font-semibold shrink-0">+{p.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-t-2 border-t-negative">
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold text-negative uppercase tracking-wider mb-3">
                    Most Reported
                  </p>
                  {rankings.reported.length === 0 ? (
                    <p className="text-muted text-sm">No data yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {rankings.reported.map((p: RankingPlayer, i: number) => (
                        <div
                          key={p.puuid}
                          onClick={() => p.gameName && navigate(`/player/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`)}
                          className="flex items-center gap-3 group cursor-pointer rounded-md px-2 py-2 border border-transparent hover:border-border hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-muted text-sm w-5 shrink-0 text-center">{i + 1}</span>
                          <span className="text-sm text-gray-300 flex-1 group-hover:text-white transition-colors truncate">
                            {p.gameName ?? 'Unknown'}
                            {p.tagLine && <span className="text-muted text-xs">#{p.tagLine}</span>}
                          </span>
                          <span className="text-negative text-sm font-semibold shrink-0">-{p.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Activity feed — 1 col */}
        {activity && activity.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Activity</h2>
            <div className="space-y-2">
              {activity.map((item: ActivityItem, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2.5 px-3 rounded-lg border border-border bg-surface/50">
                  <div className={`mt-0.5 shrink-0 ${item.positive ? 'text-positive' : 'text-negative'}`}>
                    {item.positive ? <ThumbsUp size={13} /> : <ThumbsDown size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/player/${encodeURIComponent(item.subjectGameName)}/${encodeURIComponent(item.subjectTagLine)}`}
                      className="text-xs font-semibold text-white hover:text-gold transition-colors truncate block"
                    >
                      {item.subjectGameName}
                      <span className="text-muted font-normal">#{item.subjectTagLine}</span>
                    </Link>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant={item.positive ? 'positive' : 'negative'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {TAG_LABELS[tag] ?? tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted shrink-0 mt-0.5">{timeAgo(item.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
