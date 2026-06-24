import styles from './UserCard.module.scss'
import type { UserResult } from '../types'

interface UserCardProps {
  user: UserResult
}

export function UserCard({ user }: UserCardProps) {
  return (
    <a
      className={styles.card}
      href={user.html_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className={styles.avatar}
        src={user.avatar_url}
        alt=""
        width={80}
        height={80}
        onError={(event) => {
          event.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%2330363d" width="80" height="80"/%3E%3C/svg%3E'
        }}
      />
      <div className={styles.body}>
        <h3 className={styles.name}>{user.login}</h3>
        <p className={styles.type}>{user.type}</p>
        <p className={styles.location}>{user.location ?? 'Location unknown'}</p>
        <span className={styles.link}>View profile</span>
      </div>
    </a>
  )
}
