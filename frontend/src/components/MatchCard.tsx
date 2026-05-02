import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMatchParticipants, submitReviewByPuuid, getMyMatchReviews } from '../lib/api'
import { POSITIVE_TAGS, NEGATIVE_TAGS, TAG_LABELS, timeAgo, formatDuration, queueLabel, roleLabel, cn, championIconUrl } from '../lib/utils'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'

export interface MatchData {
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
    role?: string | null
  }
}

const TIER_COLORS: Record<string, string> = {
  IRON: '#a1a1aa', BRONZE: '#b45309', SILVER: '#94a3b8',
  GOLD: '#facc15', PLATINUM: '#2dd4bf', EMERALD: '#34d399',
  DIAMOND: '#60a5fa', MASTER: '#c084fc', GRANDMASTER: '#fb7185', CHALLENGER: '#7dd3fc',
}

interface Participant {
  puuid: string
  championName: string
  gameName?: string | null
  tagLine?: string | null
  soloTier?: string | null
  soloRank?: string | null
  teamId: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  role?: string | null
  riotAccount?: { gameName: string; tagLine: string; soloTier?: string | null; soloRank?: string | null } | null
}

interface Props {
  match: MatchData
  myPuuid?: string
}

function InlineReview({
  subjectPuuid,
  subjectName,
  matchId,
  existingTags,
  existingNote,
  onDone,
}: {
  subjectPuuid: string
  subjectName: string
  matchId: string
  existingTags?: string[]
  existingNote?: string
  onDone: () => void
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags ?? [])
  const [note, setNote] = useState(existingNote ?? '')
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => submitReviewByPuuid({ subjectPuuid, matchId, tags: selectedTags, note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-match-reviews', matchId] })
      setSuccess(true)
      setTimeout(onDone, 800)
    },
  })

  const toggle = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  if (success) {
    return (
      <div className="flex items-center gap-2 text-positive text-sm py-2">
        <Check size={16} /> Review for {subjectName} submitted
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <p className="text-xs text-muted">Reviewing <span className="text-white">{subjectName}</span></p>
      <div>
        <p className="text-xs font-semibold text-positive uppercase tracking-wider mb-2">Positive</p>
        <div className="flex flex-wrap gap-1.5">
          {POSITIVE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-positive border-positive text-background font-semibold'
                  : 'border-border text-muted hover:border-positive hover:text-positive'
              )}
            >
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-negative uppercase tracking-wider mb-2">Negative</p>
        <div className="flex flex-wrap gap-1.5">
          {NEGATIVE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-negative border-negative text-white font-semibold'
                  : 'border-border text-muted hover:border-negative hover:text-negative'
              )}
            >
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          placeholder="Optional note…"
          rows={2}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-muted resize-none focus:outline-none focus:ring-1 focus:ring-gold"
        />
        {note.length > 0 && (
          <span className={`absolute bottom-2 right-2 text-[10px] ${note.length > 250 ? 'text-negative' : 'text-muted'}`}>
            {280 - note.length}
          </span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-xs text-negative">
          {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong'}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button
          size="sm"
          disabled={selectedTags.length === 0 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Submitting…' : existingTags?.length ? 'Update' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}

function ParticipantRow({
  participant,
  matchId,
  myPuuid,
  reviewsByPuuid,
}: {
  participant: Participant
  matchId: string
  myPuuid?: string
  reviewsByPuuid?: Map<string, { tags: string[]; note?: string }>
}) {
  const [reviewing, setReviewing] = useState(false)
  const isSelf = participant.puuid === myPuuid
  const existingReview = reviewsByPuuid?.get(participant.puuid)
  const alreadyReviewed = !!existingReview

  const gameName = participant.riotAccount?.gameName ?? participant.gameName ?? null
  const tagLine = participant.riotAccount?.tagLine ?? participant.tagLine ?? null
  const tier = participant.riotAccount?.soloTier ?? participant.soloTier ?? null
  const rank = participant.riotAccount?.soloRank ?? participant.soloRank ?? null
  const displayName = gameName ?? participant.championName
  const profileLink = gameName && tagLine
    ? `/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <img
          src={championIconUrl(participant.championName)}
          alt={participant.championName}
          className="w-6 h-6 rounded shrink-0"
        />
        <span className="text-xs text-gray-300 flex-1 truncate">
          {profileLink ? (
            <Link to={profileLink} className="hover:text-gold transition-colors">
              {displayName}
            </Link>
          ) : displayName}
          {isSelf && <span className="text-gold ml-1">(you)</span>}
        </span>
        {tier && (
          <span className="text-xs font-semibold shrink-0" style={{ color: TIER_COLORS[tier] ?? '#8899BB' }}>
            {tier.charAt(0) + tier.slice(1).toLowerCase()}{rank ? ` ${rank}` : ''}
          </span>
        )}
        <span className="text-xs text-muted shrink-0">
          {participant.kills}/{participant.deaths}/{participant.assists}
        </span>
        {!isSelf && myPuuid && (
          <button
            onClick={() => setReviewing((v) => !v)}
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors shrink-0',
              alreadyReviewed && !reviewing
                ? 'border-border text-muted'
                : 'border-gold/40 text-gold hover:bg-gold/10'
            )}
          >
            {alreadyReviewed && !reviewing ? 'Reviewed' : reviewing ? 'Cancel' : 'Review'}
          </button>
        )}
      </div>

      {reviewing && (
        <div className="ml-4">
          <InlineReview
            subjectPuuid={participant.puuid}
            subjectName={displayName}
            matchId={matchId}
            existingTags={existingReview?.tags}
            existingNote={existingReview?.note}
            onDone={() => setReviewing(false)}
          />
        </div>
      )}
    </div>
  )
}

export default function MatchCard({ match, myPuuid }: Props) {
  const [expanded, setExpanded] = useState(false)
  const p = match.participant
  const win = p?.win

  const { data: participants, isLoading: loadingParticipants } = useQuery({
    queryKey: ['match-participants', match.riotMatchId],
    queryFn: () => getMatchParticipants(match.riotMatchId),
    enabled: expanded,
  })

  const { data: myMatchReviews } = useQuery({
    queryKey: ['my-match-reviews', match.id],
    queryFn: () => getMyMatchReviews(match.id),
    enabled: expanded && !!myPuuid,
  })

  const reviewsByPuuid = useMemo(
    () => new Map<string, { tags: string[]; note?: string }>(
      (myMatchReviews ?? []).map((r: { subjectPuuid: string; tags: string[]; note?: string }) => [
        r.subjectPuuid,
        { tags: r.tags, note: r.note },
      ])
    ),
    [myMatchReviews]
  )

  const team1 = (participants ?? []).filter((p: Participant) => p.teamId === 100)
  const team2 = (participants ?? []).filter((p: Participant) => p.teamId === 200)

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-colors',
      win === true ? 'border-blue-600/50 hover:border-blue-500/70' : win === false ? 'border-red-700/50 hover:border-red-600/70' : 'border-border hover:border-gold/30'
    )}>
      {/* Match header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center gap-4 p-4 text-left transition-colors',
          win === true ? 'bg-blue-950/40 hover:bg-blue-950/60' : win === false ? 'bg-red-950/30 hover:bg-red-950/50' : 'bg-surface hover:bg-white/5'
        )}
      >
        {/* Win/loss + champion icon */}
        {p ? (
          <div className="shrink-0 flex items-center gap-2.5">
            <img
              src={championIconUrl(p.championName)}
              alt={p.championName}
              className="w-10 h-10 rounded-md object-cover shrink-0"
            />
            <div className="w-10">
              <div className={cn('text-xs font-bold uppercase tracking-widest', win ? 'text-blue-400' : 'text-red-400')}>
                {win ? 'WIN' : 'LOSS'}
              </div>
              <div className="text-xs text-muted mt-0.5 truncate">{p.championName}</div>
            </div>
          </div>
        ) : (
          <div className="shrink-0 w-8" />
        )}

        {/* Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="neutral">{queueLabel(match.queueId)}</Badge>
            {p && (
              <span className="text-xs text-muted">
                {p.kills}/{p.deaths}/{p.assists}
                {roleLabel(p.role) ? ` · ${roleLabel(p.role)}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            <span>{formatDuration(match.gameDuration)}</span>
            <span>·</span>
            <span>{timeAgo(match.gameEndTimestamp)}</span>
          </div>
        </div>

        {/* Review hint + expand icon */}
        <div className="flex items-center gap-2 shrink-0">
          {!expanded && myPuuid && (
            <span className="text-[10px] text-gold/60 hidden sm:block">Review →</span>
          )}
          <div className="text-muted">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded participants */}
      {expanded && (
        <div className="border-t border-border p-4 bg-background/50">
          {loadingParticipants ? (
            <p className="text-xs text-muted">Loading participants…</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {/* Review progress */}
              {myPuuid && myMatchReviews !== undefined && (() => {
                const teammates = [...team1, ...team2].filter((pt) => pt.puuid !== myPuuid)
                const reviewed = teammates.filter((pt) => reviewsByPuuid.has(pt.puuid)).length
                if (teammates.length === 0) return null
                return (
                  <div className="sm:col-span-2 mb-3 flex items-center gap-2 text-xs text-muted">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold/50 rounded-full transition-all"
                        style={{ width: `${(reviewed / teammates.length) * 100}%` }}
                      />
                    </div>
                    <span>{reviewed}/{teammates.length} reviewed</span>
                  </div>
                )
              })()}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Blue Team</p>
                {team1.map((pt: Participant) => (
                  <ParticipantRow
                    key={pt.puuid}
                    participant={pt}
                    matchId={match.id}
                    myPuuid={myPuuid}
                    reviewsByPuuid={reviewsByPuuid}
                  />
                ))}
              </div>
              <div className="space-y-1.5 mt-4 sm:mt-0">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Red Team</p>
                {team2.map((pt: Participant) => (
                  <ParticipantRow
                    key={pt.puuid}
                    participant={pt}
                    matchId={match.id}
                    myPuuid={myPuuid}
                    reviewsByPuuid={reviewsByPuuid}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
