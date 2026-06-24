import { configureStore } from '@reduxjs/toolkit'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import searchCacheReducer, { type SearchCacheState } from '../features/search/searchCacheSlice'
import searchUiReducer, { type SearchUiState } from '../features/search/searchUiSlice'
import type { RepositoryResult, SearchResult, UserResult } from '../features/search/types'
import { RESULTS_PER_PAGE } from '../features/search/cacheUtils'

export interface TestRootState {
  searchUi: SearchUiState
  searchCache: SearchCacheState
}

export function createTestStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: {
      searchUi: searchUiReducer,
      searchCache: searchCacheReducer,
    },
    ...(preloadedState ? { preloadedState: preloadedState as TestRootState } : {}),
  })
}

export type TestStore = ReturnType<typeof createTestStore>

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<TestRootState>
  store?: TestStore
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

export function mockUser(overrides: Partial<UserResult> = {}): UserResult {
  return {
    id: 1,
    login: 'octocat',
    avatar_url: 'https://avatars.githubusercontent.com/u/1',
    html_url: 'https://github.com/octocat',
    type: 'User',
    location: 'San Francisco',
    ...overrides,
  }
}

export function mockRepository(overrides: Partial<RepositoryResult> = {}): RepositoryResult {
  return {
    id: 100,
    name: 'hello-world',
    full_name: 'octocat/hello-world',
    html_url: 'https://github.com/octocat/hello-world',
    description: 'A test repository',
    stargazers_count: 42,
    stars_count: 42,
    forks_count: 7,
    language: 'TypeScript',
    updated_at: '2024-01-01T00:00:00Z',
    owner_login: 'octocat',
    owner_avatar_url: 'https://avatars.githubusercontent.com/u/1',
    owner: {
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/1',
    },
    ...overrides,
  }
}

interface PreloadedResultsOptions {
  query?: string
  searchType?: 'users' | 'repositories'
  page?: number
  totalCount?: number
  results?: SearchResult[]
  status?: SearchUiState['status']
}

export function preloadedStateWithResults({
  query = 'django',
  searchType = 'repositories',
  page = 1,
  totalCount = 533,
  results = [mockRepository()],
  status = 'succeeded',
}: PreloadedResultsOptions = {}): Partial<TestRootState> {
  const cacheKey = `${searchType}:${query}:${page}`

  return {
    searchUi: {
      query,
      searchType,
      page,
      status,
      error: null,
      activeKey: status === 'succeeded' ? cacheKey : null,
      loadingKey: status === 'loading' ? cacheKey : null,
      searchMeta: {
        query,
        searchType,
        totalCount,
        perPage: RESULTS_PER_PAGE,
      },
    },
    searchCache: {
      cache: {
        [cacheKey]: {
          results,
          total_count: totalCount,
          page,
          per_page: RESULTS_PER_PAGE,
          cached: false,
          search_type: searchType,
          query,
          cachedAt: Date.now(),
        },
      },
    },
  }
}
