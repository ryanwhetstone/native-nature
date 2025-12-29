-- Add home_lat and home_lng to users table
ALTER TABLE users ADD COLUMN home_lat numeric(10, 6);
ALTER TABLE users ADD COLUMN home_lng numeric(10, 6);
