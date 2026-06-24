import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTestStore, type TestStore } from '../../../test/testUtils'
import { useSearch } from './useSearch'

vi.mock('../searchThunks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../searchThunks')>()
  return {
    ...actual,
    performSearch: vi.fn((payload) => ({
      type: 'search/perform',
      payload,
    })),
    fetchSearchResults: vi.fn((payload) => ({
      type: 'search/fetchResults/pending',
      meta: { arg: payload },
      abort: vi.fn(),
    })),
  }
})

import { fetchSearchResults, performSearch } from '../searchThunks'

function createWrapper(store: TestStore) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }
}

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(performSearch).mockClear()
    vi.mocked(fetchSearchResults).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not search before debounce elapses', () => {
    const store = createTestStore()
    const { result } = renderHook(() => useSearch(), { wrapper: createWrapper(store) })

    act(() => {
      result.current.handleQueryChange('django')
    })

    expect(performSearch).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(performSearch).toHaveBeenCalledWith({
      query: 'django',
      searchType: 'repositories',
      page: 1,
    })
  })

  it('resets when query is shorter than 3 characters', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 2,
        status: 'succeeded',
        error: null,
        activeKey: 'repositories:django:2',
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

    const { result } = renderHook(() => useSearch(), { wrapper: createWrapper(store) })

    act(() => {
      result.current.handleQueryChange('ab')
    })

    expect(store.getState().searchUi.status).toBe('idle')
    expect(store.getState().searchUi.page).toBe(1)
    expect(performSearch).not.toHaveBeenCalled()
  })

  it('searches immediately when search type changes', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 3,
        status: 'succeeded',
        error: null,
        activeKey: null,
        loadingKey: null,
        searchMeta: null,
      },
      searchCache: { cache: {} },
    })

    const { result } = renderHook(() => useSearch(), { wrapper: createWrapper(store) })

    act(() => {
      result.current.handleSearchTypeChange('users')
    })

    expect(store.getState().searchUi.page).toBe(1)
    expect(performSearch).toHaveBeenCalledWith({
      query: 'django',
      searchType: 'users',
      page: 1,
    })
  })

  it('fetches the requested page on page change', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 1,
        status: 'succeeded',
        error: null,
        activeKey: null,
        loadingKey: null,
        searchMeta: null,
      },
      searchCache: { cache: {} },
    })

    const { result } = renderHook(() => useSearch(), { wrapper: createWrapper(store) })

    act(() => {
      result.current.handlePageChange(4)
    })

    expect(performSearch).toHaveBeenCalledWith({
      query: 'django',
      searchType: 'repositories',
      page: 4,
    })
  })

  it('uses fetchSearchResults on retry', () => {
    const store = createTestStore({
      searchUi: {
        query: 'django',
        searchType: 'repositories',
        page: 2,
        status: 'failed',
        error: 'GitHub API error',
        activeKey: null,
        loadingKey: null,
        searchMeta: null,
      },
      searchCache: { cache: {} },
    })

    const { result } = renderHook(() => useSearch(), { wrapper: createWrapper(store) })

    act(() => {
      result.current.handleRetry()
    })

    expect(fetchSearchResults).toHaveBeenCalledWith({
      query: 'django',
      searchType: 'repositories',
      page: 2,
    })
  })
})
