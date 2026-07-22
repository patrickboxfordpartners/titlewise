CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "excerpt" text NOT NULL,
  "body" text NOT NULL,
  "author" text NOT NULL DEFAULT 'Patrick Mitchell',
  "author_url" text NOT NULL DEFAULT 'https://linkedin.com/in/patricktmitchell',
  "category" text NOT NULL,
  "read_time" text NOT NULL,
  "brand" text NOT NULL DEFAULT 'titlewise',
  "tags" text[] DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'draft',
  "canonical" text,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_blog_posts_slug" ON "blog_posts" ("slug");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_status" ON "blog_posts" ("status");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_published" ON "blog_posts" ("published_at");
