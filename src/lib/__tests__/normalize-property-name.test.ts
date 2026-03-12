import { describe, it, expect } from 'vitest'
import {
  normalizePropertyName,
  propertyMatches,
  filterByProperties,
} from '@/lib/normalize-property-name'

describe('normalizePropertyName', () => {
  it('converts to lowercase and trims trailing space', () => {
    expect(normalizePropertyName('Oak Estates ')).toBe('oak estates')
  })

  it('converts to lowercase and trims leading space', () => {
    expect(normalizePropertyName('  PINE RIDGE')).toBe('pine ridge')
  })

  it('handles already normalized name', () => {
    expect(normalizePropertyName('oak estates')).toBe('oak estates')
  })

  it('handles empty string', () => {
    expect(normalizePropertyName('')).toBe('')
  })

  it('trims both sides and lowercases', () => {
    expect(normalizePropertyName('  Maple Court  ')).toBe('maple court')
  })
})

describe('propertyMatches', () => {
  it('returns true when property name matches assigned names (case-insensitive)', () => {
    expect(propertyMatches('Oak Estates', ['oak estates', 'pine ridge'])).toBe(true)
  })

  it('returns false when property name is not in assigned names', () => {
    expect(propertyMatches('Unknown', ['oak estates'])).toBe(false)
  })

  it('returns true with bidirectional normalization (trailing space)', () => {
    expect(propertyMatches('oak estates ', ['Oak Estates'])).toBe(true)
  })

  it('returns false for empty assigned names array', () => {
    expect(propertyMatches('Oak Estates', [])).toBe(false)
  })

  it('handles leading/trailing spaces on both sides', () => {
    expect(propertyMatches('  Pine Ridge  ', ['  pine ridge  '])).toBe(true)
  })
})

describe('filterByProperties', () => {
  const mockItems = [
    { id: 1, property: 'Oak Estates' },
    { id: 2, property: 'Pine Ridge' },
    { id: 3, property: 'Maple Court' },
  ]

  it('filters items to only those matching assigned property names', () => {
    const result = filterByProperties(
      mockItems,
      (item) => item.property,
      ['oak estates', 'pine ridge']
    )
    expect(result).toHaveLength(2)
    expect(result.map((i) => i.id)).toEqual([1, 2])
  })

  it('returns empty array when no items match', () => {
    const result = filterByProperties(mockItems, (item) => item.property, ['unknown property'])
    expect(result).toHaveLength(0)
  })

  it('returns all items when all match', () => {
    const result = filterByProperties(mockItems, (item) => item.property, [
      'oak estates',
      'pine ridge',
      'maple court',
    ])
    expect(result).toHaveLength(3)
  })

  it('handles empty items array', () => {
    const result = filterByProperties([], (item: { property: string }) => item.property, [
      'oak estates',
    ])
    expect(result).toHaveLength(0)
  })
})
