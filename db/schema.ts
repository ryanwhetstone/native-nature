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
  slug: varchar('slug', { length: 255 }).notNull().unique(),
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

// iNaturalist Places table - stores place IDs for countries and regions
export const inaturalistPlaces = pgTable('inaturalist_places', {
  id: serial('id').primaryKey(),
  // iNaturalist place ID
  placeId: integer('place_id').notNull().unique(),
  // Location info
  countryCode: varchar('country_code', { length: 3 }).notNull(), // ISO 3-letter code
  placeName: varchar('place_name', { length: 255 }).notNull(), // e.g., "Ontario", "California"
  placeSlug: varchar('place_slug', { length: 255 }).notNull(), // URL-friendly slug
  // Additional metadata from iNaturalist
  displayName: varchar('display_name', { length: 500 }), // Full display name from iNaturalist
  placeType: integer('place_type'), // iNaturalist place type code
  adminLevel: integer('admin_level'), // Administrative level
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure unique combination of country and place
  uniqueCountryPlace: unique().on(table.countryCode, table.placeSlug),
}));

export type INaturalistPlace = typeof inaturalistPlaces.$inferSelect;
export type NewINaturalistPlace = typeof inaturalistPlaces.$inferInsert;

// Observations table
export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  speciesId: integer('species_id').notNull().references(() => species.id, { onDelete: 'cascade' }),
  // Location data
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  country: varchar('country', { length: 255 }),
  city: varchar('city', { length: 255 }),
  region: varchar('region', { length: 255 }),
  zipcode: varchar('zipcode', { length: 20 }),
  // Description
  description: text('description'),
  // Timestamps
  observedAt: timestamp('observed_at').notNull(), // When the observation was made
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Observation = typeof observations.$inferSelect;
export type NewObservation = typeof observations.$inferInsert;

// Observation Pictures table
export const observationPictures = pgTable('observation_pictures', {
  id: serial('id').primaryKey(),
  observationId: integer('observation_id').notNull().references(() => observations.id, { onDelete: 'cascade' }),
  speciesId: integer('species_id').notNull().references(() => species.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: varchar('caption', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ObservationPicture = typeof observationPictures.$inferSelect;
export type NewObservationPicture = typeof observationPictures.$inferInsert;

// Conservation Projects table
export const conservationProjects = pgTable('conservation_projects', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  // Location data
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  country: varchar('country', { length: 255 }),
  city: varchar('city', { length: 255 }),
  region: varchar('region', { length: 255 }),
  // Funding
  fundingGoal: integer('funding_goal').notNull(), // in cents to avoid floating point issues
  currentFunding: integer('current_funding').default(0).notNull(),
  // Status
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, completed, paused
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ConservationProject = typeof conservationProjects.$inferSelect;
export type NewConservationProject = typeof conservationProjects.$inferInsert;

// Project Pictures table
export const projectPictures = pgTable('project_pictures', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => conservationProjects.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: varchar('caption', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProjectPicture = typeof projectPictures.$inferSelect;
export type NewProjectPicture = typeof projectPictures.$inferInsert;

// Donations table
export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => conservationProjects.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // nullable in case user deletes account
  amount: integer('amount').notNull(), // Total amount charged in cents
  projectAmount: integer('project_amount').notNull(), // Amount credited to project in cents (after fees if not covered)
  siteTip: integer('site_tip').default(0).notNull(), // Optional tip to support the site in cents
  coversFees: boolean('covers_fees').default(false).notNull(), // Whether donor covered transaction fees
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).unique(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, completed, failed, refunded
  donorName: varchar('donor_name', { length: 255 }), // For anonymous donations
  donorEmail: varchar('donor_email', { length: 255 }), // For anonymous donations
  message: text('message'), // Optional message from donor
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  observations: many(observations),
  conservationProjects: many(conservationProjects),
  donations: many(donations),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  favorites: many(favorites),
  observations: many(observations),
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

export const observationsRelations = relations(observations, ({ one, many }) => ({
  user: one(users, {
    fields: [observations.userId],
    references: [users.id],
  }),
  species: one(species, {
    fields: [observations.speciesId],
    references: [species.id],
  }),
  pictures: many(observationPictures),
}));

export const observationPicturesRelations = relations(observationPictures, ({ one }) => ({
  observation: one(observations, {
    fields: [observationPictures.observationId],
    references: [observations.id],
  }),
  species: one(species, {
    fields: [observationPictures.speciesId],
    references: [species.id],
  }),
}));

export const conservationProjectsRelations = relations(conservationProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [conservationProjects.userId],
    references: [users.id],
  }),
  pictures: many(projectPictures),
  donations: many(donations),
}));

export const projectPicturesRelations = relations(projectPictures, ({ one }) => ({
  project: one(conservationProjects, {
    fields: [projectPictures.projectId],
    references: [conservationProjects.id],
  }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  project: one(conservationProjects, {
    fields: [donations.projectId],
    references: [conservationProjects.id],
  }),
  user: one(users, {
    fields: [donations.userId],
    references: [users.id],
  }),
}));
