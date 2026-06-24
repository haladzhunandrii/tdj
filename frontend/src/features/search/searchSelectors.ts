import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { isCacheValid, RESULTS_PER_PAGE } from './cacheUtils'
import type { SearchCacheState } from './searchCacheSlice'
import type { RepositoryResult, SearchResult, UserResult } from './types'

export const selectQuery = (state: RootState) => state.searchUi.query
export const selectSearchType = (state: RootState) => state.searchUi.searchType
export const selectPage = (state: RootState) => state.searchUi.page
export const selectStatus = (state: RootState) => state.searchUi.status
export const selectError = (state: RootState) => state.searchUi.error
export const selectActiveKey = (state: RootState) => state.searchUi.activeKey
export const selectLoadingKey = (state: RootState) => state.searchUi.loadingKey
export const selectSearchMeta = (state: RootState) => state.searchUi.searchMeta

export const selectTrimmedQueryLength = createSelector([selectQuery], (query) =>
  query.trim().length,
)

export const selectIsCentered = createSelector(
  [selectTrimmedQueryLength],
  (length) => length < 3,
)

export const selectShowGrid = createSelector(
  [selectTrimmedQueryLength],
  (length) => length >= 3,
)

export const selectIsLoading = createSelector(
  [selectStatus, selectShowGrid, selectActiveKey],
  (status, showGrid, activeKey) =>
    status === 'loading' || (showGrid && activeKey === null && status !== 'failed'),
)

export const selectActiveCacheEntry = createSelector(
  [(state: RootState) => state.searchCache.cache, selectActiveKey],
  (cache, activeKey) => (activeKey ? cache[activeKey] : undefined),
)

export const selectActiveResults = createSelector(
  [selectActiveCacheEntry],
  (entry) => entry?.results ?? [],
)

const selectResolvedMeta = createSelector(
  [selectActiveCacheEntry, selectSearchMeta, selectQuery, selectSearchType],
  (entry, meta, query, searchType) => {
    if (entry) {
      return { totalCount: entry.total_count, perPage: entry.per_page }
    }

    const trimmed = query.trim()
    if (meta && meta.query === trimmed && meta.searchType === searchType) {
      return { totalCount: meta.totalCount, perPage: meta.perPage }
    }

    return { totalCount: 0, perPage: RESULTS_PER_PAGE }
  },
)

export const selectTotalCount = createSelector(
  [selectResolvedMeta],
  (meta) => meta.totalCount,
)

export const selectPerPage = createSelector(
  [selectResolvedMeta],
  (meta) => meta.perPage,
)

export const selectTotalPages = createSelector(
  [selectTotalCount, selectPerPage],
  (totalCount, perPage) => Math.max(1, Math.ceil(totalCount / perPage)),
)

export const selectShowPagination = createSelector(
  [selectTotalCount, selectPerPage],
  (totalCount, perPage) => totalCount > perPage,
)

export const selectHasPrevPage = createSelector([selectPage], (page) => page > 1)

export const selectHasNextPage = createSelector(
  [selectPage, selectTotalPages],
  (page, totalPages) => page < totalPages,
)

export const selectResultsSubtitle = createSelector(
  [selectShowGrid, selectTotalCount, selectPage, selectTotalPages, selectPerPage],
  (showGrid, totalCount, page, totalPages, perPage) => {
    if (!showGrid || totalCount === 0) return null

    const total = totalCount.toLocaleString()
    if (totalPages > 1) {
      const from = (page - 1) * perPage + 1
      const to = Math.min(page * perPage, totalCount)
      return `Page ${page} of ${totalPages} · ${from.toLocaleString()}–${to.toLocaleString()} of ${total} on GitHub`
    }

    return `${total} result${totalCount === 1 ? '' : 's'}`
  },
)

export const selectCacheEntry = (state: RootState, key: string) =>
  state.searchCache.cache[key]

export const selectValidCacheEntry = (state: { searchCache: SearchCacheState }, key: string) => {
  const entry = state.searchCache.cache[key]
  return isCacheValid(entry) ? entry : undefined
}

export const selectTypedResults = createSelector(
  [selectActiveResults, selectSearchType],
  (results, searchType) => {
    if (searchType === 'users') {
      return results as UserResult[]
    }
    return results as RepositoryResult[]
  },
)

export type { SearchResult }
