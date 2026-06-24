import debounce from 'lodash/debounce'
import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectPage, selectQuery, selectSearchType } from '../searchSelectors'
import {
  clearActiveKey,
  resetSearch,
  setPage,
  setQuery,
  setSearchType,
} from '../searchUiSlice'
import { fetchSearchResults, performSearch } from '../searchThunks'
import type { SearchType } from '../types'

type AbortableThunk = { abort: () => void }

export function useSearch() {
  const dispatch = useAppDispatch()
  const query = useAppSelector(selectQuery)
  const searchType = useAppSelector(selectSearchType)
  const page = useAppSelector(selectPage)
  const pendingRef = useRef<AbortableThunk | null>(null)

  const abortPending = useCallback(() => {
    pendingRef.current?.abort()
    pendingRef.current = null
  }, [])

  const runSearch = useCallback(
    (rawQuery: string, type: SearchType, targetPage: number) => {
      const trimmed = rawQuery.trim()
      if (trimmed.length < 3) {
        abortPending()
        dispatch(resetSearch())
        return
      }

      abortPending()
      const result = dispatch(
        performSearch({ query: trimmed, searchType: type, page: targetPage }),
      )
      if (result && typeof (result as AbortableThunk).abort === 'function') {
        pendingRef.current = result as unknown as AbortableThunk
      }
    },
    [abortPending, dispatch],
  )

  const runSearchRef = useRef(runSearch)
  useEffect(() => {
    runSearchRef.current = runSearch
  }, [runSearch])

  const debouncedSearchRef = useRef(
    // eslint-disable-next-line react-hooks/refs -- stable debounced wrapper over latest runSearch ref
    debounce((q: string, type: SearchType) => {
      dispatch(setPage(1))
      runSearchRef.current(q, type, 1)
    }, 400),
  )

  useEffect(() => {
    const debounced = debouncedSearchRef.current
    return () => {
      debounced.cancel()
      abortPending()
    }
  }, [abortPending])

  const handleQueryChange = (value: string) => {
    dispatch(setQuery(value))
    const trimmed = value.trim()

    if (trimmed.length < 3) {
      debouncedSearchRef.current.cancel()
      abortPending()
      dispatch(resetSearch())
      return
    }

    dispatch(clearActiveKey())
    debouncedSearchRef.current(trimmed, searchType)
  }

  const handleSearchTypeChange = (type: SearchType) => {
    dispatch(setSearchType(type))
    dispatch(setPage(1))
    debouncedSearchRef.current.cancel()
    abortPending()
    dispatch(clearActiveKey())

    const trimmed = query.trim()
    if (trimmed.length >= 3) {
      runSearch(trimmed, type, 1)
    }
  }

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage))
    abortPending()

    const trimmed = query.trim()
    if (trimmed.length >= 3) {
      runSearch(trimmed, searchType, newPage)
    }
  }

  const handleRetry = () => {
    const trimmed = query.trim()
    if (trimmed.length >= 3) {
      abortPending()
      pendingRef.current = dispatch(
        fetchSearchResults({ query: trimmed, searchType, page }),
      ) as unknown as AbortableThunk
    }
  }

  return {
    query,
    searchType,
    page,
    handleQueryChange,
    handleSearchTypeChange,
    handlePageChange,
    handleRetry,
  }
}
