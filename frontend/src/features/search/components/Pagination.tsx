import { useAppSelector } from '../../../app/hooks'
import {
  selectHasNextPage,
  selectHasPrevPage,
  selectIsLoading,
  selectPage,
  selectShowPagination,
  selectTotalPages,
} from '../searchSelectors'
import styles from './Pagination.module.scss'

interface PaginationProps {
  onPageChange: (page: number) => void
}

export function Pagination({ onPageChange }: PaginationProps) {
  const page = useAppSelector(selectPage)
  const totalPages = useAppSelector(selectTotalPages)
  const showPagination = useAppSelector(selectShowPagination)
  const hasPrev = useAppSelector(selectHasPrevPage)
  const hasNext = useAppSelector(selectHasNextPage)
  const isLoading = useAppSelector(selectIsLoading)

  if (!showPagination) {
    return null
  }

  return (
    <nav className={styles.pagination} aria-label="Search results pages">
      <button
        type="button"
        className={styles.button}
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev || isLoading}
        aria-label="Previous page"
      >
        Previous
      </button>
      <span className={styles.label} aria-current="page">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext || isLoading}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}
