-- Add homePlaceId to users table
ALTER TABLE users ADD COLUMN home_place_id integer REFERENCES inaturalist_places(id) ON DELETE SET NULL;
