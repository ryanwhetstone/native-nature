import 'dotenv/config';
import { db } from '../db/index';
import { species } from '../db/schema';
import { sql } from 'drizzle-orm';

async function populateSlugs() {
  console.log('Starting slug population...');
  
  try {
    // Get all species that have a NULL slug
    const allSpecies = await db.execute(
      sql`SELECT id, name, preferred_common_name FROM species WHERE slug IS NULL`
    );
    
    console.log(`Found ${allSpecies.rows.length} species to update`);
    
    if (allSpecies.rows.length === 0) {
      console.log('All species already have slugs!');
      return;
    }
    
    // Update each species with generated slug
    for (const row of allSpecies.rows) {
      const commonNameSlug = row.preferred_common_name
        ? row.preferred_common_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : '';
      const scientificNameSlug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = commonNameSlug ? `${commonNameSlug}-${scientificNameSlug}` : scientificNameSlug;
      
      await db.execute(
        sql`UPDATE species SET slug = ${slug} WHERE id = ${row.id}`
      );
    }
    
    console.log('Slug population complete!');
    
    // Check if column is already NOT NULL
    const columnInfo = await db.execute(
      sql`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'slug'`
    );
    
    if (columnInfo.rows[0]?.is_nullable === 'YES') {
      await db.execute(sql`ALTER TABLE species ALTER COLUMN slug SET NOT NULL`);
      console.log('Set slug column to NOT NULL');
    }
    
    // Check if constraint exists
    const constraintExists = await db.execute(
      sql`SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'species' AND constraint_name = 'species_slug_unique'`
    );
    
    if (constraintExists.rows.length === 0) {
      await db.execute(sql`ALTER TABLE species ADD CONSTRAINT species_slug_unique UNIQUE (slug)`);
      console.log('Added unique constraint');
    } else {
      console.log('Unique constraint already exists');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

populateSlugs()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
