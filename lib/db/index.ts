import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "./schema"

type Database = NeonHttpDatabase<typeof schema>

let database: Database | undefined

function getDatabase(): Database {
  if (!database) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("Missing required environment variable: DATABASE_URL")
    }
    database = drizzle(neon(url), { schema })
  }
  return database
}

// Defer the Neon client until a query runs so `next build` can load route
// modules when DATABASE_URL is only present at runtime.
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDatabase()
    const value = real[prop as keyof Database]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value
  },
  // Drizzle's is() walks the prototype for entityKind. A bare proxy fails that
  // check, so Auth.js would reject the client whenever DATABASE_URL is set.
  getPrototypeOf() {
    return Object.getPrototypeOf(getDatabase())
  },
  has(_target, prop) {
    return prop in getDatabase()
  },
})
