import styles from './RepositoryCard.module.scss'
import type { RepositoryResult } from '../types'

interface RepositoryCardProps {
  repository: RepositoryResult
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <a
      className={styles.card}
      href={repository.html_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={styles.header}>
        <img
          className={styles.avatar}
          src={repository.owner.avatar_url}
          alt=""
          width={40}
          height={40}
          onError={(event) => {
            event.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%2330363d" width="40" height="40"/%3E%3C/svg%3E'
          }}
        />
        <div>
          <p className={styles.owner}>{repository.owner.login}</p>
          <h3 className={styles.name}>{repository.name}</h3>
        </div>
      </div>
      <p className={styles.description}>
        {repository.description ?? 'No description'}
      </p>
      <ul className={styles.stats}>
        <li>★ {repository.stargazers_count.toLocaleString()}</li>
        <li>⑂ {repository.forks_count.toLocaleString()}</li>
        <li>{repository.language ?? '—'}</li>
      </ul>
    </a>
  )
}
