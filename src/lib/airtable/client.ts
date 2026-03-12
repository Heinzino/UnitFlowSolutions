// Airtable base singleton + rate limiter re-export
// API key is server-side only — env vars use no browser-visible prefix (DATA-01)
import Airtable from 'airtable'
import { rateLimiter } from './rate-limiter'

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY not set — add it to .env.local')
}
if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID not set — add it to .env.local')
}

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
export const base = airtable.base(process.env.AIRTABLE_BASE_ID)
export { rateLimiter }
