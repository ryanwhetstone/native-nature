import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb, primaryKey, unique, numeric } from 'drizzle-orm/pg-core';
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
  homePlaceId: integer('home_place_id').references(() => inaturalistPlaces.id, { onDelete: 'set null' }),
  homeLat: numeric('home_lat', { precision: 10, scale: 6 }),
  homeLng: numeric('home_lng', { precision: 10, scale: 6 }),
  role: varchar('role', { length: 20 }).default('user').notNull(),
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
  approved: boolean('approved'),
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
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, funded, completed, paused
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
  approved: boolean('approved'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProjectPicture = typeof projectPictures.$inferSelect;
export type NewProjectPicture = typeof projectPictures.$inferInsert;

// Project Updates table
export const projectUpdates = pgTable('project_updates', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => conservationProjects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type NewProjectUpdate = typeof projectUpdates.$inferInsert;

// Project Update Pictures table
export const projectUpdatePictures = pgTable('project_update_pictures', {
  id: serial('id').primaryKey(),
  updateId: integer('update_id').notNull().references(() => projectUpdates.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: varchar('caption', { length: 500 }),
  approved: boolean('approved'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProjectUpdatePicture = typeof projectUpdatePictures.$inferSelect;
export type NewProjectUpdatePicture = typeof projectUpdatePictures.$inferInsert;

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

// Stripe Transactions table - complete audit trail of Stripe events
export const stripeTransactions = pgTable('stripe_transactions', {
  id: serial('id').primaryKey(),
  // Foreign keys
  donationId: integer('donation_id').references(() => donations.id, { onDelete: 'set null' }),
  projectId: integer('project_id').references(() => conservationProjects.id, { onDelete: 'set null' }),
  donorUserId: text('donor_user_id').references(() => users.id, { onDelete: 'set null' }),
  recipientUserId: text('recipient_user_id').references(() => users.id, { onDelete: 'set null' }), // Project owner
  // Stripe identifiers
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }).unique(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  // Amount breakdown (all in cents)
  amount: integer('amount').notNull(), // Total amount charged
  projectAmount: integer('project_amount').notNull(), // Amount to project
  siteTip: integer('site_tip').default(0).notNull(), // Site tip amount
  stripeFeeActual: integer('stripe_fee_actual'), // Actual fee from Stripe balance transaction
  netAmount: integer('net_amount'), // Amount after all fees
  siteTipActualAmount: integer('site_tip_actual_amount'), // Actual site tip (netAmount - projectAmount)
  currency: varchar('currency', { length: 10 }).default('usd').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // succeeded, failed, refunded, etc.
  paymentMethod: varchar('payment_method', { length: 50 }), // card, etc.
  cardBrand: varchar('card_brand', { length: 50 }), // visa, mastercard, etc.
  cardLast4: varchar('card_last4', { length: 4 }),
  // Raw Stripe data for complete audit trail
  stripeEventType: varchar('stripe_event_type', { length: 100 }),
  stripeEventData: jsonb('stripe_event_data'), // Full event payload
  balanceTransaction: jsonb('balance_transaction'), // Balance transaction details with exact fees
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

export type StripeTransaction = typeof stripeTransactions.$inferSelect;
export type NewStripeTransaction = typeof stripeTransactions.$inferInsert;

// Project Questions table
export const projectQuestions = pgTable('project_questions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => conservationProjects.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // nullable for anonymous questions
  askerName: varchar('asker_name', { length: 255 }), // For anonymous questions
  question: text('question').notNull(),
  response: text('response'), // Project owner's response
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProjectQuestion = typeof projectQuestions.$inferSelect;
export type NewProjectQuestion = typeof projectQuestions.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  favorites: many(favorites),
  observations: many(observations),
  conservationProjects: many(conservationProjects),
  donations: many(donations),
  homePlace: one(inaturalistPlaces, {
    fields: [users.homePlaceId],
    references: [inaturalistPlaces.id],
  }),
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
  updates: many(projectUpdates),
  questions: many(projectQuestions),
}));

export const projectPicturesRelations = relations(projectPictures, ({ one }) => ({
  project: one(conservationProjects, {
    fields: [projectPictures.projectId],
    references: [conservationProjects.id],
  }),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one, many }) => ({
  project: one(conservationProjects, {
    fields: [projectUpdates.projectId],
    references: [conservationProjects.id],
  }),
  user: one(users, {
    fields: [projectUpdates.userId],
    references: [users.id],
  }),
  pictures: many(projectUpdatePictures),
}));

export const projectUpdatePicturesRelations = relations(projectUpdatePictures, ({ one }) => ({
  update: one(projectUpdates, {
    fields: [projectUpdatePictures.updateId],
    references: [projectUpdates.id],
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
  stripeTransaction: one(stripeTransactions, {
    fields: [donations.id],
    references: [stripeTransactions.donationId],
  }),
}));

export const stripeTransactionsRelations = relations(stripeTransactions, ({ one }) => ({
  donation: one(donations, {
    fields: [stripeTransactions.donationId],
    references: [donations.id],
  }),
  project: one(conservationProjects, {
    fields: [stripeTransactions.projectId],
    references: [conservationProjects.id],
  }),
  donorUser: one(users, {
    fields: [stripeTransactions.donorUserId],
    references: [users.id],
  }),
  recipientUser: one(users, {
    fields: [stripeTransactions.recipientUserId],
    references: [users.id],
  }),
}));

export const projectQuestionsRelations = relations(projectQuestions, ({ one }) => ({
  project: one(conservationProjects, {
    fields: [projectQuestions.projectId],
    references: [conservationProjects.id],
  }),
  user: one(users, {
    fields: [projectQuestions.userId],
    references: [users.id],
  }),
}));
