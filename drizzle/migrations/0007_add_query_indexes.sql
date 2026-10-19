-- Query indexes for list, cron, and inbound-email lookups.
-- Not applied by this change. Run against the database when ready:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/migrations/0007_add_query_indexes.sql
-- CONCURRENTLY keeps writes flowing during the build. psql -f does not wrap the
-- file in a transaction, so CONCURRENTLY is allowed. Do not run this file inside
-- BEGIN/COMMIT. Not tracked in the Drizzle journal; the matching indexes are
-- not declared in lib/db/schema.ts, so check `db:generate` output before a push.
-- IF NOT EXISTS can skip an invalid index left by a failed concurrent build.
-- The final check rejects missing or invalid indexes. Drop or rebuild any
-- invalid index before retrying this migration.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_created
  ON users (subscription_status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matters_user_updated
  ON matters (user_id, updated_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_threads_matter_created
  ON email_threads (matter_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_status_published
  ON blog_posts (status, published_at);

-- Inbound mail resolves matter-{first 8 hex chars of id}@titlewise.app with LIKE.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matters_id_text_pattern
  ON matters ((id::text) text_pattern_ops);

DO $$
DECLARE
  index_name text;
BEGIN
  FOREACH index_name IN ARRAY ARRAY[
    'idx_users_status_created',
    'idx_matters_user_updated',
    'idx_email_threads_matter_created',
    'idx_blog_posts_status_published',
    'idx_matters_id_text_pattern'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_index
      WHERE indexrelid = to_regclass(index_name) AND indisvalid
    ) THEN
      RAISE EXCEPTION 'Index % is missing or invalid. Drop or rebuild it before retrying this migration.', index_name;
    END IF;
  END LOOP;
END;
$$;
