import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, linkRiot, getPlayerMatches } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import MatchCard from '../components/MatchCard'

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

  const linkMutation = useMutation({
    mutationFn: () => {
      const [gameName, tagLine] = riotInput.split('#')
      if (!gameName || !tagLine) throw new Error('Use format: PlayerName#TAG')
      return linkRiot(gameName, tagLine)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setLinkError('')
    },
    onError: (err: { message?: string; response?: { data?: { error?: string } } }) => {
      setLinkError(err?.response?.data?.error ?? err?.message ?? 'Failed to link account')
    },
  })

  if (isLoading) return <div className="text-gray-500">Loading…</div>

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Sign in to access your dashboard.</p>
        <button
          onClick={() => (window.location.href = '/api/auth/google')}
          className="bg-karma-gold text-karma-dark font-semibold px-6 py-2.5 rounded-lg hover:opacity-90"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{me?.email}</p>
      </div>

      {!riotAccount ? (
        <div className="bg-karma-surface border border-karma-border rounded-xl p-6 space-y-4 max-w-sm">
          <div>
            <h2 className="text-white font-semibold">Link your Riot account</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your Riot ID to sync your matches.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={riotInput}
              onChange={(e) => setRiotInput(e.target.value)}
              placeholder="PlayerName#EUW"
              className="flex-1 bg-karma-dark border border-karma-border rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-karma-gold"
            />
            <button
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending}
              className="bg-karma-gold text-karma-dark text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40"
            >
              Link
            </button>
          </div>
          {linkError && <p className="text-red-400 text-sm">{linkError}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-white font-semibold">
                {riotAccount.gameName}#{riotAccount.tagLine}
              </p>
              <p className="text-gray-500 text-sm">Level {riotAccount.summonerLevel}</p>
            </div>
            <button
              onClick={() => navigate(`/player/${riotAccount.gameName}/${riotAccount.tagLine}`)}
              className="ml-auto text-sm text-karma-gold hover:underline"
            >
              View profile →
            </button>
          </div>
        </div>
      )}

      {myMatches && myMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Matches
          </h2>
          <div className="space-y-2">
            {myMatches.map((match: Parameters<typeof MatchCard>[0]['match']) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {riotAccount && myMatches?.length === 0 && (
        <p className="text-gray-500 text-sm">
          Your matches are being synced in the background — check back shortly.
        </p>
      )}
    </div>
  )
}
