import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const riotAccounts = pgTable('riot_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  puuid: text('puuid').notNull().unique(),
  gameName: text('game_name').notNull(),
  tagLine: text('tag_line').notNull(),
  summonerId: text('summoner_id'),
  profileIconId: integer('profile_icon_id'),
  summonerLevel: integer('summoner_level'),
  lastSyncedAt: timestamp('last_synced_at'),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  riotMatchId: text('riot_match_id').notNull().unique(),
  gameMode: text('game_mode').notNull(),
  queueId: integer('queue_id').notNull(),
  gameDuration: integer('game_duration_seconds').notNull(),
  gameEndTimestamp: timestamp('game_end_timestamp').notNull(),
  season: text('season').notNull().default('2025-S1'),
})

export const matchParticipants = pgTable(
  'match_participants',
  {
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    puuid: text('puuid').notNull(),
    riotAccountId: uuid('riot_account_id').references(() => riotAccounts.id, {
      onDelete: 'set null',
    }),
    championName: text('champion_name').notNull(),
    teamId: integer('team_id').notNull(),
    win: boolean('win').notNull(),
    kills: integer('kills').notNull().default(0),
    deaths: integer('deaths').notNull().default(0),
    assists: integer('assists').notNull().default(0),
    role: text('role'),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.puuid] })]
)

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reviewerAccountId: uuid('reviewer_account_id')
      .notNull()
      .references(() => riotAccounts.id, { onDelete: 'cascade' }),
    subjectPuuid: text('subject_puuid').notNull(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    tags: text('tags').array().notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.reviewerAccountId, t.subjectPuuid, t.matchId)]
)

export type User = typeof users.$inferSelect
export type RiotAccount = typeof riotAccounts.$inferSelect
export type Match = typeof matches.$inferSelect
export type MatchParticipant = typeof matchParticipants.$inferSelect
export type Review = typeof reviews.$inferSelect
