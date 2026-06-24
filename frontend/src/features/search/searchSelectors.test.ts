import { describe, expect, it } from 'vitest'
import type { RootState } from '../../app/store'
import {
  selectHasNextPage,
  selectHasPrevPage,
  selectIsLoading,
  selectResultsSubtitle,
  selectShowPagination,
  selectTotalCount,
  selectTotalPages,
} from './searchSelectors'
import { mockRepository } from '../../test/testUtils'
import type { TestRootState } from '../../test/testUtils'

function asRootState(state: TestRootState): RootState {
  return state as unknown as RootState
}

function buildState(overrides: Partial<TestRootState['searchUi']> = {}): TestRootState {
  return {
    searchUi: {
      query: 'mfrc',
      searchType: 'repositories',
      page: 1,
      status: 'succeeded',
      error: null,
      activeKey: 'repositories:mfrc:1',
      loadingKey: null,
      searchMeta: {
        query: 'mfrc',
        searchType: 'repositories',
        totalCount: 533,
        perPage: 24,
      },
      ...overrides,
    },
    searchCache: {
      cache: {
        'repositories:mfrc:1': {
          results: [mockRepository()],
          total_count: 533,
          page: 1,
          per_page: 24,
          cached: false,
          search_type: 'repositories',
          query: 'mfrc',
          cachedAt: Date.now(),
        },
      },
    },
  }
}

describe('searchSelectors', () => {
  it('keeps totalCount from searchMeta while loading next page', () => {
    const state = buildState({
      page: 2,
      status: 'loading',
      activeKey: null,
      loadingKey: 'repositories:mfrc:2',
    })

    expect(selectTotalCount(asRootState(state))).toBe(533)
    expect(selectShowPagination(asRootState(state))).toBe(true)
  })

  it('formats paginated subtitle for page 3', () => {
    const state = buildState({ page: 3 })
    expect(selectResultsSubtitle(asRootState(state))).toBe('Page 3 of 23 · 49–72 of 533 on GitHub')
  })

  it('returns true for isLoading during fetch', () => {
    const state = buildState({
      status: 'loading',
      activeKey: null,
      loadingKey: 'repositories:mfrc:2',
    })
    expect(selectIsLoading(asRootState(state))).toBe(true)
  })

  it('reports prev/next page availability on boundaries', () => {
    const firstPage = buildState({ page: 1 })
    expect(selectHasPrevPage(asRootState(firstPage))).toBe(false)
    expect(selectHasNextPage(asRootState(firstPage))).toBe(true)

    const lastPage = buildState({ page: 23 })
    expect(selectHasPrevPage(asRootState(lastPage))).toBe(true)
    expect(selectHasNextPage(asRootState(lastPage))).toBe(false)
  })

  it('hides pagination when total fits one page', () => {
    const state = buildState({
      searchMeta: {
        query: 'mfrc',
        searchType: 'repositories',
        totalCount: 10,
        perPage: 24,
      },
    })
    state.searchCache.cache['repositories:mfrc:1'].total_count = 10
    expect(selectShowPagination(asRootState(state))).toBe(false)
    expect(selectTotalPages(asRootState(state))).toBe(1)
  })

  it('returns simple subtitle for single-page results', () => {
    const state = buildState({
      searchMeta: {
        query: 'mfrc',
        searchType: 'repositories',
        totalCount: 5,
        perPage: 24,
      },
    })
    state.searchCache.cache['repositories:mfrc:1'].total_count = 5
    expect(selectResultsSubtitle(asRootState(state))).toBe('5 results')
  })
})
