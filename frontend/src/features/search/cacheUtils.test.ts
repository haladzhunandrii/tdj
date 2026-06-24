import { describe, expect, it } from 'vitest'
import { buildCacheKey, isCacheValid, CACHE_TTL_MS } from './cacheUtils'
import type { CachedEntry } from './types'

describe('cacheUtils', () => {
  it('builds composite lowercase cache key with page', () => {
    expect(buildCacheKey('users', '  Django  ', 1)).toBe('users:django:1')
    expect(buildCacheKey('repositories', 'React', 2)).toBe('repositories:react:2')
  })

  it('returns false for missing entry', () => {
    expect(isCacheValid(undefined)).toBe(false)
  })

  it('returns true for fresh entry', () => {
    const entry: CachedEntry<{ id: number }> = {
      results: [{ id: 1 }],
      total_count: 1,
      page: 1,
      per_page: 24,
      cached: false,
      search_type: 'users',
      query: 'test',
      cachedAt: Date.now(),
    }
    expect(isCacheValid(entry)).toBe(true)
  })

  it('returns false for expired entry', () => {
    const entry: CachedEntry<{ id: number }> = {
      results: [],
      total_count: 0,
      page: 1,
      per_page: 24,
      cached: false,
      search_type: 'users',
      query: 'test',
      cachedAt: Date.now() - CACHE_TTL_MS - 1,
    }
    expect(isCacheValid(entry)).toBe(false)
  })
})
