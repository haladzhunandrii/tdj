import { describe, expect, it } from 'vitest'
import { CACHE_TTL_MS } from './cacheUtils'
import searchCacheReducer, { clearCache, pruneExpired } from './searchCacheSlice'

describe('searchCacheSlice', () => {
  it('pruneExpired removes stale entries', () => {
    const state = searchCacheReducer(
      {
        cache: {
          fresh: {
            results: [],
            total_count: 1,
            page: 1,
            per_page: 24,
            cached: false,
            search_type: 'users',
            query: 'fresh',
            cachedAt: Date.now(),
          },
          stale: {
            results: [],
            total_count: 1,
            page: 1,
            per_page: 24,
            cached: false,
            search_type: 'users',
            query: 'stale',
            cachedAt: Date.now() - CACHE_TTL_MS - 1,
          },
        },
      },
      pruneExpired(),
    )

    expect(state.cache.fresh).toBeDefined()
    expect(state.cache.stale).toBeUndefined()
  })

  it('clearCache removes all entries', () => {
    const state = searchCacheReducer(
      {
        cache: {
          'users:django:1': {
            results: [],
            total_count: 1,
            page: 1,
            per_page: 24,
            cached: false,
            search_type: 'users',
            query: 'django',
            cachedAt: Date.now(),
          },
        },
      },
      clearCache(),
    )

    expect(state.cache).toEqual({})
  })
})
