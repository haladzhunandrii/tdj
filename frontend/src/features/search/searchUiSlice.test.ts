import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  SEARCH_FETCH_FULFILLED,
  SEARCH_FETCH_PENDING,
  SEARCH_FETCH_REJECTED,
  applyCachedResults,
  resetSearch,
} from './searchUiSlice'
import { fetchSearchResults } from './searchThunks'
import { createTestStore } from '../../test/testUtils'

vi.mock('../../api/searchClient', () => ({
  search: vi.fn(),
  SearchAbortedError: class SearchAbortedError extends Error {},
}))

import { search } from '../../api/searchClient'

describe('searchUiSlice extraReducers', () => {
  it('preserves searchMeta when pending for same query on new page', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 1,
        status: 'succeeded',
        error: null,
        activeKey: 'repositories:django:1',
        loadingKey: null,
        searchMeta: {
          query: 'django',
          searchType: 'repositories',
          totalCount: 533,
          perPage: 24,
        },
      },
      searchCache: { cache: {} },
    })

    store.dispatch({
      type: SEARCH_FETCH_PENDING,
      meta: {
        arg: { query: 'django', searchType: 'repositories', page: 2 },
        requestId: '1',
        requestStatus: 'pending',
      },
    })

    const state = store.getState().searchUi
    expect(state.searchMeta?.totalCount).toBe(533)
    expect(state.activeKey).toBeNull()
    expect(state.page).toBe(2)
  })

  it('clears searchMeta when pending for a new query', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 1,
        status: 'succeeded',
        error: null,
        activeKey: 'repositories:django:1',
        loadingKey: null,
        searchMeta: {
          query: 'django',
          searchType: 'repositories',
          totalCount: 533,
          perPage: 24,
        },
      },
      searchCache: { cache: {} },
    })

    store.dispatch({
      type: SEARCH_FETCH_PENDING,
      meta: {
        arg: { query: 'react', searchType: 'repositories', page: 1 },
        requestId: '1',
        requestStatus: 'pending',
      },
    })

    expect(store.getState().searchUi.searchMeta).toBeNull()
  })

  it('updates searchMeta on fulfilled', () => {
    const store = createTestStore()

    store.dispatch({
      type: SEARCH_FETCH_FULFILLED,
      payload: {
        cacheKey: 'repositories:django:1',
        results: [],
        total_count: 100,
        page: 1,
        per_page: 24,
        cached: false,
        search_type: 'repositories',
        query: 'django',
      },
    })

    expect(store.getState().searchUi.searchMeta).toEqual({
      query: 'django',
      searchType: 'repositories',
      totalCount: 100,
      perPage: 24,
    })
  })

  it('sets failed state on rejected error', () => {
    const store = createTestStore()

    store.dispatch({
      type: SEARCH_FETCH_REJECTED,
      payload: 'GitHub API error',
      meta: {
        arg: { query: 'django', searchType: 'repositories', page: 1 },
        aborted: false,
        requestId: '1',
        requestStatus: 'rejected',
      },
    })

    expect(store.getState().searchUi.status).toBe('failed')
    expect(store.getState().searchUi.error).toBe('GitHub API error')
  })

  it('returns to idle on aborted rejection without active results', () => {
    const store = createTestStore()

    store.dispatch({
      type: SEARCH_FETCH_REJECTED,
      meta: {
        arg: { query: 'django', searchType: 'repositories', page: 1 },
        aborted: true,
        requestId: '1',
        requestStatus: 'rejected',
      },
    })

    expect(store.getState().searchUi.status).toBe('idle')
  })

  it('applyCachedResults does not update searchMeta', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 1,
        status: 'idle',
        error: null,
        activeKey: null,
        loadingKey: null,
        searchMeta: {
          query: 'django',
          searchType: 'repositories',
          totalCount: 50,
          perPage: 24,
        },
      },
      searchCache: { cache: {} },
    })

    store.dispatch(applyCachedResults({ cacheKey: 'repositories:django:2', page: 2 }))

    const state = store.getState().searchUi
    expect(state.activeKey).toBe('repositories:django:2')
    expect(state.page).toBe(2)
    expect(state.status).toBe('succeeded')
    expect(state.searchMeta?.totalCount).toBe(50)
  })

  it('resetSearch clears searchMeta and page', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 3,
        status: 'succeeded',
        error: null,
        activeKey: 'repositories:django:3',
        loadingKey: null,
        searchMeta: {
          query: 'django',
          searchType: 'repositories',
          totalCount: 50,
          perPage: 24,
        },
      },
      searchCache: { cache: {} },
    })

    store.dispatch(resetSearch())

    const state = store.getState().searchUi
    expect(state.status).toBe('idle')
    expect(state.activeKey).toBeNull()
    expect(state.page).toBe(1)
    expect(state.searchMeta).toBeNull()
  })
})

describe('searchUiSlice with fetchSearchResults thunk', () => {
  beforeEach(() => {
    vi.mocked(search).mockReset()
  })

  it('records searchMeta after successful fetch', async () => {
    vi.mocked(search).mockResolvedValue({
      results: [],
      total_count: 77,
      page: 1,
      per_page: 24,
      cached: false,
      search_type: 'users',
      query: 'django',
    })

    const store = createTestStore()
    await store.dispatch(fetchSearchResults({ query: 'django', searchType: 'users', page: 1 }))

    expect(store.getState().searchUi.searchMeta?.totalCount).toBe(77)
  })
})
