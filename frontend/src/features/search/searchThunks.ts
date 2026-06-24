import { createAsyncThunk } from '@reduxjs/toolkit'
import { search, type ApiError, SearchAbortedError } from '../../api/searchClient'
import { buildCacheKey } from './cacheUtils'
import { selectValidCacheEntry } from './searchSelectors'
import { addToCache } from './searchCacheSlice'
import type { SearchCacheState } from './searchCacheSlice'
import { applyCachedResults } from './searchUiSlice'
import type { SearchUiState } from './searchUiSlice'
import type { FetchSearchPayload, FetchSearchResult, SearchResult } from './types'

export interface ThunkState {
  searchUi: SearchUiState
  searchCache: SearchCacheState
}

export const fetchSearchResults = createAsyncThunk<
  FetchSearchResult,
  FetchSearchPayload,
  { state: ThunkState; rejectValue: string }
>(
  'search/fetchResults',
  async ({ query, searchType, page }, { dispatch, signal, rejectWithValue }) => {
    const trimmed = query.trim()
    const cacheKey = buildCacheKey(searchType, trimmed, page)

    try {
      const response = await search(trimmed, searchType, page, signal)
      const entry = {
        results: response.results as SearchResult[],
        total_count: response.total_count,
        page: response.page,
        per_page: response.per_page,
        cached: response.cached,
        search_type: response.search_type,
        query: response.query,
        cachedAt: Date.now(),
      }

      dispatch(addToCache({ key: cacheKey, entry }))

      return {
        cacheKey,
        results: entry.results,
        total_count: entry.total_count,
        page: entry.page,
        per_page: entry.per_page,
        cached: entry.cached,
        search_type: entry.search_type,
        query: entry.query,
      }
    } catch (error) {
      if (error instanceof SearchAbortedError) {
        throw error
      }
      const apiError = error as ApiError
      return rejectWithValue(apiError.message)
    }
  },
  {
    condition: ({ query, searchType, page }, { getState }) => {
      const trimmed = query.trim()
      if (trimmed.length < 3) return false

      const state = getState()
      const cacheKey = buildCacheKey(searchType, trimmed, page)
      if (state.searchUi.status === 'loading' && state.searchUi.loadingKey === cacheKey) {
        return false
      }
      return true
    },
  },
)

/** Cache lookup + dispatch fetch; returns abortable promise when API call starts */
export const performSearch = createAsyncThunk<
  unknown,
  FetchSearchPayload,
  { state: ThunkState }
>(
  'search/perform',
  async ({ query, searchType, page }, { dispatch, getState }) => {
    const trimmed = query.trim()
    if (trimmed.length < 3) return

    const cacheKey = buildCacheKey(searchType, trimmed, page)
    const cached = selectValidCacheEntry(getState(), cacheKey)

    if (cached) {
      dispatch(applyCachedResults({ cacheKey, page }))
      return
    }

    return dispatch(fetchSearchResults({ query: trimmed, searchType, page }))
  },
)
