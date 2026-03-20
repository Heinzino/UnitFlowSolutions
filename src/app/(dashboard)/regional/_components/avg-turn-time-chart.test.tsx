import { describe, it, expect } from 'vitest'
import { getBarColor } from './avg-turn-time-chart'

describe('getBarColor', () => {
  it('returns green for days < 7', () => {
    expect(getBarColor(0)).toBe('#16803c')
    expect(getBarColor(6)).toBe('#16803c')
  })
  it('returns amber for days 7-14', () => {
    expect(getBarColor(7)).toBe('#d97706')
    expect(getBarColor(14)).toBe('#d97706')
  })
  it('returns red for days > 14', () => {
    expect(getBarColor(15)).toBe('#b91c1c')
    expect(getBarColor(30)).toBe('#b91c1c')
  })
})
