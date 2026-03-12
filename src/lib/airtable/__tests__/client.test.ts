import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Airtable client', () => {
  it('throws if AIRTABLE_API_KEY is not set', async () => {
    const originalKey = process.env.AIRTABLE_API_KEY
    const originalBase = process.env.AIRTABLE_BASE_ID
    delete process.env.AIRTABLE_API_KEY
    process.env.AIRTABLE_BASE_ID = 'test-base-id'

    await expect(
      import('../client?missing-key=' + Date.now())
    ).rejects.toThrow()

    process.env.AIRTABLE_API_KEY = originalKey
    if (originalBase !== undefined) {
      process.env.AIRTABLE_BASE_ID = originalBase
    } else {
      delete process.env.AIRTABLE_BASE_ID
    }
  })

  it('throws if AIRTABLE_BASE_ID is not set', async () => {
    const originalKey = process.env.AIRTABLE_API_KEY
    const originalBase = process.env.AIRTABLE_BASE_ID
    process.env.AIRTABLE_API_KEY = 'test-api-key'
    delete process.env.AIRTABLE_BASE_ID

    await expect(
      import('../client?missing-base=' + Date.now())
    ).rejects.toThrow()

    if (originalKey !== undefined) {
      process.env.AIRTABLE_API_KEY = originalKey
    } else {
      delete process.env.AIRTABLE_API_KEY
    }
    process.env.AIRTABLE_BASE_ID = originalBase
  })

  it('does not use NEXT_PUBLIC_ prefix for env var access', () => {
    const clientPath = path.resolve(
      __dirname,
      '../client.ts'
    )
    const source = fs.readFileSync(clientPath, 'utf-8')
    // Ensure no env var is accessed with NEXT_PUBLIC_ prefix (would expose to browser)
    const matches = source.match(/process\.env\.NEXT_PUBLIC_/g)
    expect(matches).toBeNull()
  })
})
