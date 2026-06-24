import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { CACHE_TTL_MS } from './cacheUtils'
import type { CachedEntry, CacheKey, SearchResult } from './types'

export interface SearchCacheState {
  cache: Record<CacheKey, CachedEntry<SearchResult>>
}

const initialState: SearchCacheState = {
  cache: {},
}

const searchCacheSlice = createSlice({
  name: 'searchCache',
  initialState,
  reducers: {
    addToCache(
      state,
      action: PayloadAction<{ key: CacheKey; entry: CachedEntry<SearchResult> }>,
    ) {
      state.cache[action.payload.key] = action.payload.entry
    },
    pruneExpired(state) {
      const now = Date.now()
      for (const [key, entry] of Object.entries(state.cache)) {
        if (now - entry.cachedAt > CACHE_TTL_MS) {
          delete state.cache[key]
        }
      }
    },
    clearCache(state) {
      state.cache = {}
    },
  },
})

export const { addToCache, pruneExpired, clearCache } = searchCacheSlice.actions
export default searchCacheSlice.reducer
