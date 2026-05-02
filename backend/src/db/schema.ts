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
import { relations } from 'drizzle-orm'

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
    .unique()
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
    gameName: text('game_name'),
    tagLine: text('tag_line'),
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

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  riotAccount: one(riotAccounts, {
    fields: [users.id],
    references: [riotAccounts.userId],
  }),
}))

export const riotAccountsRelations = relations(riotAccounts, ({ one, many }) => ({
  user: one(users, { fields: [riotAccounts.userId], references: [users.id] }),
  matchParticipants: many(matchParticipants),
}))

export const matchesRelations = relations(matches, ({ many }) => ({
  participants: many(matchParticipants),
}))

export const matchParticipantsRelations = relations(matchParticipants, ({ one }) => ({
  match: one(matches, {
    fields: [matchParticipants.matchId],
    references: [matches.id],
  }),
  riotAccount: one(riotAccounts, {
    fields: [matchParticipants.riotAccountId],
    references: [riotAccounts.id],
  }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  match: one(matches, { fields: [reviews.matchId], references: [matches.id] }),
  reviewerAccount: one(riotAccounts, {
    fields: [reviews.reviewerAccountId],
    references: [riotAccounts.id],
  }),
}))

export type User = typeof users.$inferSelect
export type RiotAccount = typeof riotAccounts.$inferSelect
export type Match = typeof matches.$inferSelect
export type MatchParticipant = typeof matchParticipants.$inferSelect
export type Review = typeof reviews.$inferSelect
