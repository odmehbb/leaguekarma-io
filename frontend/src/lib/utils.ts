import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

export const TAG_LABELS: Record<string, string> = {
  'great-comms': 'Great Comms',
  'good-shotcaller': 'Good Shotcaller',
  'positive-attitude': 'Positive Attitude',
  'carried-us': 'Carried Us',
  'great-teammate': 'Great Teammate',
  flamer: 'Flamer',
  inted: 'Intentional Feeder',
  afk: 'AFK',
  'bad-attitude': 'Bad Attitude',
  'no-comms': 'No Comms',
  'surrendered-early': 'Surrendered Early',
  sabotage: 'Sabotage',
}
