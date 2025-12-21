import { sql } from 'drizzle-orm';
import { db } from '../db';

async function recreateTable() {
  try {
    console.log('Dropping stripe_transactions table...');
    await db.execute(sql`DROP TABLE IF EXISTS stripe_transactions CASCADE`);
    
    console.log('Creating stripe_transactions table with new column order...');
    await db.execute(sql`
      CREATE TABLE stripe_transactions (
        id serial PRIMARY KEY NOT NULL,
        donation_id integer,
        project_id integer,
        donor_user_id text,
        recipient_user_id text,
        stripe_charge_id varchar(255),
        stripe_payment_intent_id varchar(255),
        stripe_session_id varchar(255),
        amount integer NOT NULL,
        project_amount integer NOT NULL,
        site_tip integer DEFAULT 0 NOT NULL,
        stripe_fee_actual integer,
        net_amount integer,
        site_tip_actual_amount integer,
        currency varchar(10) DEFAULT 'usd' NOT NULL,
        status varchar(50) NOT NULL,
        payment_method varchar(50),
        card_brand varchar(50),
        card_last4 varchar(4),
        stripe_event_type varchar(100),
        stripe_event_data jsonb,
        balance_transaction jsonb,
        created_at timestamp DEFAULT now() NOT NULL,
        processed_at timestamp,
        CONSTRAINT stripe_transactions_stripe_charge_id_unique UNIQUE(stripe_charge_id)
      )
    `);
    
    console.log('Adding foreign keys...');
    await db.execute(sql`
      ALTER TABLE stripe_transactions 
      ADD CONSTRAINT stripe_transactions_donation_id_donations_id_fk 
      FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE cascade
    `);
    
    await db.execute(sql`
      ALTER TABLE stripe_transactions 
      ADD CONSTRAINT stripe_transactions_project_id_conservation_projects_id_fk 
      FOREIGN KEY (project_id) REFERENCES conservation_projects(id) ON DELETE cascade
    `);
    
    await db.execute(sql`
      ALTER TABLE stripe_transactions 
      ADD CONSTRAINT stripe_transactions_donor_user_id_users_id_fk 
      FOREIGN KEY (donor_user_id) REFERENCES users(id) ON DELETE set null
    `);
    
    await db.execute(sql`
      ALTER TABLE stripe_transactions 
      ADD CONSTRAINT stripe_transactions_recipient_user_id_users_id_fk 
      FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE set null
    `);
    
    console.log('✅ Table recreated successfully with new column order!');
    process.exit(0);
  } catch (error) {
    console.error('Error recreating table:', error);
    process.exit(1);
  }
}

recreateTable();
