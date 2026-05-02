import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRankings } from '../lib/api'

export default function SearchPage() {
  const [input, setInput] = useState('')
  const navigate = useNavigate()

  const { data: rankings } = useQuery({
    queryKey: ['rankings'],
    queryFn: getRankings,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const [gameName, tagLine] = input.split('#')
    if (!gameName || !tagLine) return
    navigate(`/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl font-bold text-white">
          Know who you're queuing with
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Look up any player's karma — reputation left by their actual teammates.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm mx-auto mt-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="PlayerName#EUW"
            className="flex-1 bg-karma-surface border border-karma-border rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-karma-gold"
          />
          <button
            type="submit"
            className="bg-karma-gold text-karma-dark font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>
      </div>

      {rankings && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
              Most Praised
            </h2>
            <div className="space-y-2">
              {rankings.praised.map((p: { puuid: string; gameName: string; tagLine: string; score: number }, i: number) => (
                <div
                  key={p.puuid}
                  onClick={() => p.gameName && navigate(`/player/${p.gameName}/${p.tagLine}`)}
                  className="flex items-center gap-3 p-3 bg-karma-surface border border-karma-border rounded-lg cursor-pointer hover:border-green-700/50 transition-colors"
                >
                  <span className="text-gray-600 text-sm w-5">{i + 1}</span>
                  <span className="text-white text-sm flex-1">
                    {p.gameName}#{p.tagLine}
                  </span>
                  <span className="text-green-400 text-sm font-semibold">+{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
              Most Reported
            </h2>
            <div className="space-y-2">
              {rankings.reported.map((p: { puuid: string; gameName: string; tagLine: string; score: number }, i: number) => (
                <div
                  key={p.puuid}
                  onClick={() => p.gameName && navigate(`/player/${p.gameName}/${p.tagLine}`)}
                  className="flex items-center gap-3 p-3 bg-karma-surface border border-karma-border rounded-lg cursor-pointer hover:border-red-700/50 transition-colors"
                >
                  <span className="text-gray-600 text-sm w-5">{i + 1}</span>
                  <span className="text-white text-sm flex-1">
                    {p.gameName}#{p.tagLine}
                  </span>
                  <span className="text-red-400 text-sm font-semibold">-{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
