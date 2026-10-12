<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cloud Agent

The dev server listens on port 3000. Local PostgreSQL is the database unless `DATABASE_URL` is already set. The app uses the Neon HTTP driver, which reaches that local database at `https://api.localtest.me/sql`. Login shells export `NODE_EXTRA_CA_CERTS=/opt/titlewise-dev/certs/cert.pem` so Node trusts the local proxy certificate.

`npm run db:push` syncs `lib/db/schema.ts` to the local database. `npm run build` needs `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` to be non-empty; placeholder values are enough to compile. Real AI generation needs a real `ANTHROPIC_API_KEY`.
