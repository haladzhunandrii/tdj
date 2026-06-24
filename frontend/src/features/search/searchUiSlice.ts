import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { buildCacheKey } from './cacheUtils'
import type { CacheKey, FetchSearchResult, SearchType } from './types'

export type SearchStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface SearchMeta {
  query: string
  searchType: SearchType
  totalCount: number
  perPage: number
}

export interface SearchUiState {
  query: string
  searchType: SearchType
  page: number
  status: SearchStatus
  error: string | null
  activeKey: CacheKey | null
  loadingKey: CacheKey | null
  searchMeta: SearchMeta | null
}

const initialState: SearchUiState = {
  query: '',
  searchType: 'repositories',
  page: 1,
  status: 'idle',
  error: null,
  activeKey: null,
  loadingKey: null,
  searchMeta: null,
}

export const SEARCH_FETCH_PENDING = 'search/fetchResults/pending'
export const SEARCH_FETCH_FULFILLED = 'search/fetchResults/fulfilled'
export const SEARCH_FETCH_REJECTED = 'search/fetchResults/rejected'

interface FetchMeta {
  arg: { query: string; searchType: SearchType; page: number }
  aborted: boolean
}

const searchUiSlice = createSlice({
  name: 'searchUi',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload
    },
    setSearchType(state, action: PayloadAction<SearchType>) {
      state.searchType = action.payload
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    clearActiveKey(state) {
      state.activeKey = null
    },
    resetSearch(state) {
      state.status = 'idle'
      state.error = null
      state.activeKey = null
      state.loadingKey = null
      state.page = 1
      state.searchMeta = null
    },
    applyCachedResults(state, action: PayloadAction<{ cacheKey: CacheKey; page: number }>) {
      state.activeKey = action.payload.cacheKey
      state.page = action.payload.page
      state.loadingKey = null
      state.status = 'succeeded'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action): action is { type: typeof SEARCH_FETCH_PENDING; meta: FetchMeta } =>
          action.type === SEARCH_FETCH_PENDING,
        (state, action) => {
          const { query, searchType, page } = action.meta.arg
          const trimmed = query.trim()
          state.status = 'loading'
          state.loadingKey = buildCacheKey(searchType, trimmed, page)
          state.page = page
          state.activeKey = null
          state.error = null
          if (
            !state.searchMeta ||
            state.searchMeta.query !== trimmed ||
            state.searchMeta.searchType !== searchType
          ) {
            state.searchMeta = null
          }
        },
      )
      .addMatcher(
        (
          action,
        ): action is { type: typeof SEARCH_FETCH_FULFILLED; payload: FetchSearchResult } =>
          action.type === SEARCH_FETCH_FULFILLED,
        (state, action) => {
          state.activeKey = action.payload.cacheKey
          state.page = action.payload.page
          state.loadingKey = null
          state.status = 'succeeded'
          state.error = null
          state.searchMeta = {
            query: action.payload.query,
            searchType: action.payload.search_type as SearchType,
            totalCount: action.payload.total_count,
            perPage: action.payload.per_page,
          }
        },
      )
      .addMatcher(
        (
          action,
        ): action is {
          type: typeof SEARCH_FETCH_REJECTED
          payload?: string
          meta: FetchMeta
        } => action.type === SEARCH_FETCH_REJECTED,
        (state, action) => {
          if (action.meta.aborted) {
            state.loadingKey = null
            if (!state.activeKey) {
              state.status = 'idle'
            }
            return
          }
          state.status = 'failed'
          state.error = action.payload ?? 'Something went wrong'
          state.loadingKey = null
        },
      )
  },
})

export const { setQuery, setSearchType, setPage, clearActiveKey, resetSearch, applyCachedResults } =
  searchUiSlice.actions

export default searchUiSlice.reducer
