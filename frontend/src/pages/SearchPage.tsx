import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRankings, getPlayerMatches, getMe } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import MatchCard, { type MatchData } from '../components/MatchCard'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!user,
    retry: false,
  })

  const riotAccount = me?.riotAccount

  const { data: recentMatches } = useQuery({
    queryKey: ['my-matches', riotAccount?.gameName, riotAccount?.tagLine],
    queryFn: () => getPlayerMatches(riotAccount!.gameName, riotAccount!.tagLine),
    enabled: !!riotAccount,
  })

  const { data: rankings } = useQuery({
    queryKey: ['rankings'],
    queryFn: getRankings,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const [gameName, tagLine] = input.split('#')
    if (!gameName?.trim() || !tagLine?.trim()) return
    navigate(`/player/${encodeURIComponent(gameName.trim())}/${encodeURIComponent(tagLine.trim())}`)
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-6 pt-12">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
            Know who you're{' '}
            <span className="text-gold">queuing</span> with
          </h1>
          <p className="text-muted mt-4 max-w-md mx-auto text-base">
            Community karma for League of Legends — reputation left by real teammates.
          </p>
        </div>


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

      {/* Recent matches (logged in + riot linked) */}
      {riotAccount && recentMatches && recentMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Your Recent Matches
            </h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-gold hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentMatches.slice(0, 5).map((match: MatchData) => (
              <MatchCard
                key={match.id}
                match={match}
                myPuuid={riotAccount.puuid}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rankings */}
      {rankings && (
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Community Rankings
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Most praised */}
            <Card className="border-t-2 border-t-positive">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-positive uppercase tracking-wider mb-3">
                  Most Praised
                </p>
                {rankings.praised.length === 0 ? (
                  <p className="text-muted text-sm">No data yet.</p>
                ) : (
                  <div className="space-y-1">
                    {rankings.praised.map(
                      (p: { puuid: string; gameName: string; tagLine: string; score: number }, i: number) => (
                        <div
                          key={p.puuid}
                          onClick={() => p.gameName && navigate(`/player/${p.gameName}/${p.tagLine}`)}
                          className="flex items-center gap-3 group cursor-pointer rounded-md px-2 py-2 border border-transparent hover:border-border hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-muted text-sm w-5 shrink-0 text-center">{i + 1}</span>
                          <span className="text-sm text-gray-300 flex-1 group-hover:text-white transition-colors truncate">
                            {p.gameName}
                            <span className="text-muted">#{p.tagLine}</span>
                          </span>
                          <span className="text-positive text-sm font-semibold shrink-0">
                            +{p.score}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most reported */}
            <Card className="border-t-2 border-t-negative">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-negative uppercase tracking-wider mb-3">
                  Most Reported
                </p>
                {rankings.reported.length === 0 ? (
                  <p className="text-muted text-sm">No data yet.</p>
                ) : (
                  <div className="space-y-1">
                    {rankings.reported.map(
                      (p: { puuid: string; gameName: string; tagLine: string; score: number }, i: number) => (
                        <div
                          key={p.puuid}
                          onClick={() => p.gameName && navigate(`/player/${p.gameName}/${p.tagLine}`)}
                          className="flex items-center gap-3 group cursor-pointer rounded-md px-2 py-2 border border-transparent hover:border-border hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-muted text-sm w-5 shrink-0 text-center">{i + 1}</span>
                          <span className="text-sm text-gray-300 flex-1 group-hover:text-white transition-colors truncate">
                            {p.gameName}
                            <span className="text-muted">#{p.tagLine}</span>
                          </span>
                          <span className="text-negative text-sm font-semibold shrink-0">
                            -{p.score}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
