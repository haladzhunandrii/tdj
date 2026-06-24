import type { CacheKey, CachedEntry, SearchType } from './types'

export const CACHE_TTL_MS = 7_200_000
export const RESULTS_PER_PAGE = 24

export function buildCacheKey(searchType: SearchType, query: string, page = 1): CacheKey {
  return `${searchType}:${query.trim().toLowerCase()}:${page}`
}

export function isCacheValid<T>(entry: CachedEntry<T> | undefined): entry is CachedEntry<T> {
  if (!entry) return false
  return Date.now() - entry.cachedAt <= CACHE_TTL_MS
}
