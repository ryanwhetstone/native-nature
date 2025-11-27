import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

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
