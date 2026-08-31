-- Add password_hash column for NextAuth
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Make clerk_id nullable for migration
ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;

-- Add unique constraint on email
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
