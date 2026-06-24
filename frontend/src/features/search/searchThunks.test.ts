import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTestStore } from '../../test/testUtils'
import { fetchSearchResults, performSearch } from './searchThunks'

vi.mock('../../api/searchClient', () => ({
  search: vi.fn(),
  SearchAbortedError: class SearchAbortedError extends Error {
    constructor() {
      super('Search aborted')
      this.name = 'SearchAbortedError'
    }
  },
}))

import { search, SearchAbortedError } from '../../api/searchClient'

describe('performSearch', () => {
  beforeEach(() => {
    vi.mocked(search).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not call API when query is shorter than 3 characters', async () => {
    const store = createTestStore()
    await store.dispatch(performSearch({ query: 'ab', searchType: 'users', page: 1 }))
    expect(search).not.toHaveBeenCalled()
    expect(store.getState().searchUi.status).toBe('idle')
  })

  it('uses client cache without API call', async () => {
    const store = createTestStore()
    const cacheKey = 'users:django:1'
    store.dispatch({
      type: 'searchCache/addToCache',
      payload: {
        key: cacheKey,
        entry: {
          results: [{ id: 1, login: 'django', avatar_url: '', html_url: '', type: 'User', location: null }],
          total_count: 1,
          page: 1,
          per_page: 24,
          cached: false,
          search_type: 'users',
          query: 'django',
          cachedAt: Date.now(),
        },
      },
    })

    await store.dispatch(performSearch({ query: 'django', searchType: 'users', page: 1 }))
    expect(search).not.toHaveBeenCalled()
    expect(store.getState().searchUi.activeKey).toBe(cacheKey)
    expect(store.getState().searchUi.status).toBe('succeeded')
  })

  it('calls API on cache miss', async () => {
    vi.mocked(search).mockResolvedValue({
      results: [],
      total_count: 0,
      page: 1,
      per_page: 24,
      cached: false,
      search_type: 'repositories',
      query: 'django',
    })

    const store = createTestStore()
    await store.dispatch(performSearch({ query: 'django', searchType: 'repositories', page: 1 }))
    expect(search).toHaveBeenCalledWith('django', 'repositories', 1, expect.anything())
    expect(store.getState().searchUi.status).toBe('succeeded')
  })

  it('fetches a different page when not cached', async () => {
    vi.mocked(search).mockResolvedValue({
      results: [],
      total_count: 50,
      page: 2,
      per_page: 24,
      cached: false,
      search_type: 'repositories',
      query: 'django',
    })

    const store = createTestStore()
    await store.dispatch(performSearch({ query: 'django', searchType: 'repositories', page: 1 }))
    await store.dispatch(performSearch({ query: 'django', searchType: 'repositories', page: 2 }))

    expect(search).toHaveBeenCalledWith('django', 'repositories', 2, expect.anything())
    expect(store.getState().searchUi.page).toBe(2)
    expect(store.getState().searchUi.searchMeta?.totalCount).toBe(50)
  })

  it('uses cache for page N without API call', async () => {
    const store = createTestStore()
    store.dispatch({
      type: 'searchCache/addToCache',
      payload: {
        key: 'repositories:django:3',
        entry: {
          results: [],
          total_count: 100,
          page: 3,
          per_page: 24,
          cached: false,
          search_type: 'repositories',
          query: 'django',
          cachedAt: Date.now(),
        },
      },
    })

    await store.dispatch(performSearch({ query: 'django', searchType: 'repositories', page: 3 }))
    expect(search).not.toHaveBeenCalled()
    expect(store.getState().searchUi.page).toBe(3)
  })
})

describe('fetchSearchResults', () => {
  beforeEach(() => {
    vi.mocked(search).mockReset()
  })

  it('sets failed state on API error', async () => {
    vi.mocked(search).mockRejectedValue({ status: 502, message: 'GitHub API error' })

    const store = createTestStore()
    await store.dispatch(fetchSearchResults({ query: 'django', searchType: 'repositories', page: 1 }))

    expect(store.getState().searchUi.status).toBe('failed')
    expect(store.getState().searchUi.error).toBe('GitHub API error')
  })

  it('rejects aborted fetch without API error message', async () => {
    vi.mocked(search).mockRejectedValue(new SearchAbortedError())

    const store = createTestStore()
    const result = await store.dispatch(
      fetchSearchResults({ query: 'django', searchType: 'repositories', page: 1 }),
    )

    expect(result.type).toBe('search/fetchResults/rejected')
    expect(store.getState().searchUi.error).toBe('Something went wrong')
  })

  it('skips fetch when the same request is already loading', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 1,
        status: 'loading',
        error: null,
        activeKey: null,
        loadingKey: 'repositories:django:1',
        searchMeta: null,
      },
      searchCache: { cache: {} },
    })

    store.dispatch(fetchSearchResults({ query: 'django', searchType: 'repositories', page: 1 }))

    expect(search).not.toHaveBeenCalled()
    expect(store.getState().searchUi.status).toBe('loading')
  })

  it('stores response in cache and searchMeta', async () => {
    vi.mocked(search).mockResolvedValue({
      results: [{ id: 1 }],
      total_count: 12,
      page: 1,
      per_page: 24,
      cached: false,
      search_type: 'users',
      query: 'django',
    })

    const store = createTestStore()
    await store.dispatch(fetchSearchResults({ query: 'django', searchType: 'users', page: 1 }))

    expect(store.getState().searchCache.cache['users:django:1']).toBeDefined()
    expect(store.getState().searchUi.searchMeta?.totalCount).toBe(12)
  })
})
