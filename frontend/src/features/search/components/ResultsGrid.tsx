import { useAppSelector } from '../../../app/hooks'
import { selectIsLoading, selectQuery, selectSearchType, selectTypedResults } from '../searchSelectors'
import type { RepositoryResult, UserResult } from '../types'
import { RepositoryCard } from './RepositoryCard'
import styles from './ResultsGrid.module.scss'
import { UserCard } from './UserCard'

export function ResultsGrid() {
  const searchType = useAppSelector(selectSearchType)
  const results = useAppSelector(selectTypedResults)
  const isLoading = useAppSelector(selectIsLoading)
  const query = useAppSelector(selectQuery)

  if (isLoading) {
    return (
      <div
        className={styles.grid}
        aria-busy="true"
        aria-live="polite"
        aria-label={`Searching for ${query.trim()}`}
      >
        <p className={styles.srOnly}>Searching for {query.trim()}…</p>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.skeleton} aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  if (searchType === 'users') {
    return (
      <div className={styles.grid}>
        {(results as UserResult[]).map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {(results as RepositoryResult[]).map((repo) => (
        <RepositoryCard key={repo.id} repository={repo} />
      ))}
    </div>
  )
}
