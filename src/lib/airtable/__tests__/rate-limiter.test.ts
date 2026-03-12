import { describe, it, expect, beforeEach } from 'vitest'
import { TokenBucket } from '../rate-limiter'

describe('TokenBucket', () => {
  it('allows up to 5 immediate acquisitions', async () => {
    const bucket = new TokenBucket(5, 5 / 1000)
    const start = Date.now()

    await Promise.all([
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
    ])

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(50)
  })

  it('delays 6th acquisition', async () => {
    const bucket = new TokenBucket(5, 5 / 1000)
    const times: number[] = []

    // Kick off 6 concurrent acquisitions
    const promises = Array.from({ length: 6 }, () => {
      return bucket.acquire().then(() => {
        times.push(Date.now())
      })
    })

    const start = Date.now()
    await Promise.all(promises)
    const totalElapsed = Date.now() - start

    // The 6th should have waited at least 150ms (200ms per token at 5/sec)
    expect(totalElapsed).toBeGreaterThan(150)
  }, 5000)

  it('refills tokens over time', async () => {
    const bucket = new TokenBucket(5, 5 / 1000)

    // Drain 5 tokens
    await Promise.all([
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
    ])

    // Wait for refill (1100ms should give ~5 tokens at 5/1000 rate)
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Now should be able to acquire 5 more immediately
    const start = Date.now()
    await Promise.all([
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
      bucket.acquire(),
    ])
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(100)
  }, 10000)
})
