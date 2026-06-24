import { useAppSelector } from '../../../app/hooks'
import {
  selectError,
  selectIsLoading,
  selectQuery,
  selectStatus,
  selectActiveResults,
} from '../searchSelectors'
import styles from './SearchStatus.module.scss'

interface SearchStatusProps {
  onRetry: () => void
}

export function SearchStatus({ onRetry }: SearchStatusProps) {
  const status = useAppSelector(selectStatus)
  const error = useAppSelector(selectError)
  const query = useAppSelector(selectQuery)
  const isLoading = useAppSelector(selectIsLoading)
  const results = useAppSelector(selectActiveResults)

  if (isLoading) {
    return null
  }

  if (status === 'failed' && error) {
    return (
      <div className={styles.error} role="alert" aria-live="polite">
        <p>{error}</p>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  if (status === 'succeeded' && results.length === 0) {
    return (
      <p className={styles.status} aria-live="polite">
        No results found for &ldquo;{query.trim()}&rdquo;
      </p>
    )
  }

  return null
}
