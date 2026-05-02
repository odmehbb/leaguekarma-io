import { config } from '../config.js'

const headers = { 'X-Riot-Token': config.riotApiKey }

async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`Riot API error ${res.status}: ${url}`)
  }
  return res.json() as Promise<T>
}

export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

export interface Summoner {
  id: string
  accountId: string
  puuid: string
  profileIconId: number
  revisionDate: number
  summonerLevel: number
}

export interface MatchParticipant {
  puuid: string
  championName: string
  teamId: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  teamPosition: string
  individualPosition: string
}

export interface MatchInfo {
  gameMode: string
  queueId: number
  gameDuration: number
  gameEndTimestamp: number
  participants: MatchParticipant[]
}

export interface Match {
  metadata: { matchId: string; participants: string[] }
  info: MatchInfo
}

export async function getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
  return riotFetch<RiotAccount>(
    `${config.riotRegionalBaseUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  )
}

export async function getAccountByPuuid(puuid: string): Promise<RiotAccount> {
  return riotFetch<RiotAccount>(
    `${config.riotRegionalBaseUrl}/riot/account/v1/accounts/by-puuid/${puuid}`
  )
}

// Map tagLine to platform base URL
function platformUrlForTag(tagLine: string): string {
  const tag = tagLine.toUpperCase()
  if (tag === 'EUNE' || tag === 'EUN1') return 'https://eun1.api.riotgames.com'
  if (tag === 'TR' || tag === 'TR1') return 'https://tr1.api.riotgames.com'
  if (tag === 'RU') return 'https://ru.api.riotgames.com'
  // Default EUW
  return config.riotPlatformBaseUrl
}

export async function getSummonerByPuuid(puuid: string, tagLine: string): Promise<Summoner> {
  const platformUrl = platformUrlForTag(tagLine)
  return riotFetch<Summoner>(
    `${platformUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`
  )
}

export async function getMatchIdsByPuuid(puuid: string, count: number): Promise<string[]> {
  return riotFetch<string[]>(
    `${config.riotRegionalBaseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&queue=400&count=${count}`
  )
}

export async function getMatch(matchId: string): Promise<Match> {
  return riotFetch<Match>(
    `${config.riotRegionalBaseUrl}/lol/match/v5/matches/${matchId}`
  )
}
