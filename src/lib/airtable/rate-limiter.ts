// Token bucket rate limiter — prevents exceeding Airtable's 5 req/sec limit
// Source: Token bucket pattern — timer-free implementation

export class TokenBucket {
  private tokens: number
  private lastRefill: number

  constructor(
    private capacity: number,  // max burst (5)
    private refillRate: number // tokens per ms (5/1000)
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now()
        const elapsed = now - this.lastRefill
        // Refill tokens based on elapsed time
        this.tokens = Math.min(
          this.capacity,
          this.tokens + elapsed * this.refillRate
        )
        this.lastRefill = now

        if (this.tokens >= 1) {
          this.tokens -= 1
          resolve()
        } else {
          // Wait until next token is available
          const waitMs = Math.ceil((1 - this.tokens) / this.refillRate)
          console.log(`[rate-limiter] Request queued — waiting ${waitMs}ms for next token`)
          setTimeout(tryAcquire, waitMs)
        }
      }
      tryAcquire()
    })
  }
}

// Singleton — one bucket per Node.js process
export const rateLimiter = new TokenBucket(5, 5 / 1000)
