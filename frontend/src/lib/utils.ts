import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ROLE_LABELS: Record<string, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  UTILITY: 'Support',
}
export function roleLabel(role: string | null | undefined): string | null {
  if (!role) return null
  return ROLE_LABELS[role.toUpperCase()] ?? role
}

// Data Dragon champion icons — version bumps ~every 2 weeks with patches
const DDRAGON_VERSION = '16.9.1'
export function championIconUrl(championName: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championName}.png`
}

export const POSITIVE_TAGS = [
  'great-comms',
  'good-shotcaller',
  'positive-attitude',
  'carried-us',
  'great-teammate',
] as const

export const NEGATIVE_TAGS = [
  'flamer',
  'inted',
  'afk',
  'bad-attitude',
  'no-comms',
  'surrendered-early',
  'sabotage',
] as const

export const ALL_TAGS = [...POSITIVE_TAGS, ...NEGATIVE_TAGS] as const
export type Tag = (typeof ALL_TAGS)[number]

export const TAG_LABELS: Record<string, string> = {
  'great-comms': 'Great Comms',
  'good-shotcaller': 'Good Shotcaller',
  'positive-attitude': 'Positive Attitude',
  'carried-us': 'Carried Us',
  'great-teammate': 'Great Teammate',
  flamer: 'Flamer',
  inted: 'Int',
  afk: 'AFK',
  'bad-attitude': 'Bad Attitude',
  'no-comms': 'No Comms',
  'surrendered-early': 'Gave Up',
  sabotage: 'Sabotage',
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function queueLabel(queueId: number): string {
  if (queueId === 420) return 'Ranked Solo'
  if (queueId === 440) return 'Ranked Flex'
  if (queueId === 400) return 'Normal Draft'
  if (queueId === 450) return 'ARAM'
  return 'Custom'
}
