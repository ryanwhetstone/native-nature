import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb, primaryKey, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// NextAuth required tables
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  // Custom fields
  publicName: varchar('public_name', { length: 255 }),
  bio: text('bio'),
  preferences: jsonb('preferences'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const species = pgTable('species', {
  id: serial('id').primaryKey(),
  // iNaturalist taxon ID
  taxonId: integer('taxon_id').notNull().unique(),
  // Basic info
  name: varchar('name', { length: 255 }).notNull(), // Scientific name
  preferredCommonName: varchar('preferred_common_name', { length: 255 }),
  rank: varchar('rank', { length: 50 }).notNull(), // species, genus, family, etc.
  // Classification
  kingdom: varchar('kingdom', { length: 100 }),
  phylum: varchar('phylum', { length: 100 }),
  class: varchar('class', { length: 100 }),
  order: varchar('order', { length: 100 }),
  family: varchar('family', { length: 100 }),
  genus: varchar('genus', { length: 100 }),
  // Details
  wikipediaUrl: text('wikipedia_url'),
  wikipediaSummary: text('wikipedia_summary'),
  observationsCount: integer('observations_count').default(0),
  // Photo
  defaultPhotoUrl: text('default_photo_url'),
  defaultPhotoAttribution: text('default_photo_attribution'),
  defaultPhotoLicense: varchar('default_photo_license', { length: 50 }),
  // Conservation status
  conservationStatus: varchar('conservation_status', { length: 50 }),
  conservationStatusName: varchar('conservation_status_name', { length: 100 }),
  // Additional data stored as JSON
  taxonPhotos: jsonb('taxon_photos'), // Array of photo objects
  // Native/introduced info (can be state-specific)
  establishmentMeans: jsonb('establishment_means'), // Store per-place data
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Species = typeof species.$inferSelect;
export type NewSpecies = typeof species.$inferInsert;

// Favorites table
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  speciesId: integer('species_id').notNull().references(() => species.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure a user can only favorite a species once
  uniqueUserSpecies: unique().on(table.userId, table.speciesId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  species: one(species, {
    fields: [favorites.speciesId],
    references: [species.id],
  }),
}));
